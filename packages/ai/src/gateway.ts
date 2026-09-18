import type { AiCallStatus } from '@nutriboost/db'
import type { ZodType } from 'zod'

import { ModelCallError, type StructuredModelClient } from './client'
import { EMPTY_USAGE, computeCostUsd, type TokenUsage } from './cost'
import { type AiEnv, readAiEnv } from './env'
import { type AiPurpose, resolveModel } from './models'
import type { AiStore } from './store'

/**
 * AI Gateway — cửa duy nhất cho mọi lời gọi model.
 *
 * Trách nhiệm, theo thứ tự thực thi:
 *   1. Công tắc dừng khẩn cấp
 *   2. Cache (tra trước khi tiêu hạn mức — trúng cache không tính lượt)
 *   3. Hạn mức theo người dùng và mục đích
 *   4. Trần chi phí trong ngày
 *   5. Gọi model kèm thời gian chờ
 *   6. Ghi `ai_calls` với token, chi phí, độ trễ, trạng thái
 *
 * Không nơi nào khác trong hệ thống được gọi model trực tiếp.
 */

export type GatewayStatus =
  | 'ok'
  | 'cache_hit'
  | 'rate_limited'
  | 'budget_exceeded'
  | 'blocked'
  | 'timeout'
  | 'invalid_output'
  | 'error'

export const DEFAULT_MAX_OUTPUT_TOKENS = 2048
export const DEFAULT_TIMEOUT_MS = 20_000
export const DEFAULT_TEMPERATURE = 0.2
export const DEFAULT_CACHE_TTL_SECONDS = 3600

export interface GenerateStructuredArgs<T> {
  purpose: AiPurpose
  /** `null` cho tác vụ hệ thống. Khi có người dùng thì mới áp hạn mức và trần chi phí. */
  userId: string | null
  /** Phiên bản prompt, ví dụ `parse-meal@v3`. Ghi vào `ai_calls.prompt_version`. */
  promptVersion: string
  system: string
  user: string
  schema: ZodType<T>
  /** Có khoá này thì bật cache. Bỏ trống khi kết quả phụ thuộc dữ liệu hay đổi. */
  cacheKey?: string | null
  cacheTtlSeconds?: number
  maxOutputTokens?: number
  /** Nâng lên model chất lượng cho riêng lượt này. Không bao giờ tự động. */
  escalate?: boolean
  timeoutMs?: number
  temperature?: number
  signal?: AbortSignal
}

export interface GatewayResult<T> {
  data: T | null
  status: GatewayStatus
  model: string
  callId: string | null
  usage: TokenUsage
  costUsd: number
  latencyMs: number
  /** Thông báo thân thiện để hiển thị khi `status` khác `ok` và `cache_hit`. */
  message: string | null
  /** Số lượt còn lại trong ngày, nếu biết. */
  quotaExhausted: boolean
}

export interface AiGateway {
  generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<GatewayResult<T>>
  /** Kiểm tra nhanh mà không gọi model — dùng để ẩn tính năng khi AI không khả dụng. */
  isAvailable(): boolean
}

export interface AiGatewayDeps {
  store: AiStore
  client: StructuredModelClient
  env?: AiEnv
  now?: () => Date
}

const MESSAGES: Readonly<Record<GatewayStatus, string | null>> = {
  ok: null,
  cache_hit: null,
  rate_limited: 'Bạn đã dùng hết lượt trợ lý cho hôm nay. Bạn vẫn ghi bữa ăn bằng tay được.',
  budget_exceeded: 'Trợ lý tạm nghỉ để kiểm soát chi phí. Bạn vẫn ghi bữa ăn bằng tay được.',
  blocked: 'Trợ lý đang tạm nghỉ. Bạn vẫn ghi bữa ăn bằng tay được.',
  timeout: 'Trợ lý phản hồi chậm quá. Bạn thử lại, hoặc ghi bữa ăn bằng tay.',
  invalid_output: 'Trợ lý trả về kết quả chưa đọc được. Bạn thử lại giúp mình nhé.',
  error: 'Trợ lý đang gặp sự cố. Bạn thử lại sau một chút.',
}

/**
 * Câu hiển thị ứng với một trạng thái của cổng.
 *
 * Xuất ra để đường chat dạng stream dùng **cùng câu chữ** với đường gọi có cấu trúc. Hai
 * đường nói cùng một chuyện với người dùng thì phải nói giống nhau; chép lại câu chữ ở nơi
 * khác là cách chắc chắn nhất để chúng lệch nhau.
 */
export function gatewayMessage(status: GatewayStatus): string | null {
  return MESSAGES[status]
}

export function createAiGateway(deps: AiGatewayDeps): AiGateway {
  const env = deps.env ?? readAiEnv()
  const now = deps.now ?? ((): Date => new Date())

  return {
    isAvailable(): boolean {
      return env.apiKey !== null && !env.killSwitch
    },

    async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<GatewayResult<T>> {
      const startedAt = now().getTime()
      const model = resolveModel(
        args.purpose,
        env.models,
        args.escalate === true ? { escalate: true } : {},
      )

      const base = {
        model,
        callId: null,
        usage: EMPTY_USAGE,
        costUsd: 0,
        latencyMs: 0,
        quotaExhausted: false,
      } as const

      // 1. Công tắc dừng khẩn cấp
      if (env.killSwitch) {
        return { ...base, data: null, status: 'blocked', message: MESSAGES.blocked }
      }
      if (env.apiKey === null) {
        return { ...base, data: null, status: 'blocked', message: MESSAGES.blocked }
      }

      // 2. Cache — tra trước để trúng cache không tiêu hạn mức
      const cacheKey = args.cacheKey ?? null
      if (cacheKey !== null) {
        const cached = await deps.store.getCached(cacheKey)
        if (cached !== null) {
          const parsed = args.schema.safeParse(cached.response)
          if (parsed.success) {
            await deps.store.logCall({
              userId: args.userId,
              purpose: args.purpose,
              model: cached.model,
              promptVersion: cached.promptVersion,
              usage: EMPTY_USAGE,
              costUsd: 0,
              latencyMs: now().getTime() - startedAt,
              status: 'ok',
              errorCode: null,
              cacheHit: true,
            })
            return {
              ...base,
              model: cached.model,
              data: parsed.data,
              status: 'cache_hit',
              latencyMs: now().getTime() - startedAt,
              message: null,
            }
          }
          // Bản cache hỏng (schema đã đổi): bỏ qua và gọi thật.
        }
      }

      // 3. Hạn mức theo người dùng
      if (args.userId !== null) {
        const limit = env.limits[args.purpose]
        const claimed = await deps.store.claimQuota(args.userId, args.purpose, limit)
        if (!claimed) {
          await deps.store.logCall({
            userId: args.userId,
            purpose: args.purpose,
            model,
            promptVersion: args.promptVersion,
            usage: EMPTY_USAGE,
            costUsd: 0,
            latencyMs: now().getTime() - startedAt,
            status: 'rate_limited',
            errorCode: 'quota_exceeded',
            cacheHit: false,
          })
          return {
            ...base,
            data: null,
            status: 'rate_limited',
            message: MESSAGES.rate_limited,
            quotaExhausted: true,
          }
        }

        // 4. Trần chi phí trong ngày
        const spent = await deps.store.dailyCostUsd(args.userId, now())
        if (spent >= env.dailyBudgetUsd) {
          await deps.store.logCall({
            userId: args.userId,
            purpose: args.purpose,
            model,
            promptVersion: args.promptVersion,
            usage: EMPTY_USAGE,
            costUsd: 0,
            latencyMs: now().getTime() - startedAt,
            status: 'rate_limited',
            errorCode: 'budget_exceeded',
            cacheHit: false,
          })
          return {
            ...base,
            data: null,
            status: 'budget_exceeded',
            message: MESSAGES.budget_exceeded,
          }
        }
      }

      // 5. Gọi model
      const callArgs: Parameters<StructuredModelClient['generate']>[0] = {
        model,
        system: args.system,
        user: args.user,
        schema: args.schema,
        maxOutputTokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        timeoutMs: args.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        temperature: args.temperature ?? DEFAULT_TEMPERATURE,
      }
      if (args.signal !== undefined) {
        callArgs.signal = args.signal
      }

      let result: { object: T; usage: TokenUsage; finishReason: string }
      try {
        // `any` ở đây là cần thiết: kiểu tổng quát của `generate` không suy ra được
        // qua `Parameters<>`, nhưng schema đã bảo đảm kiểu đầu ra.
        result = (await deps.client.generate(callArgs as never)) as typeof result
      } catch (error) {
        const classified =
          error instanceof ModelCallError
            ? error
            : new ModelCallError('unknown', 'unknown', String(error))
        const status: GatewayStatus =
          classified.kind === 'timeout'
            ? 'timeout'
            : classified.kind === 'invalid_output'
              ? 'invalid_output'
              : 'error'

        const callId = await deps.store.logCall({
          userId: args.userId,
          purpose: args.purpose,
          model,
          promptVersion: args.promptVersion,
          usage: EMPTY_USAGE,
          costUsd: 0,
          latencyMs: now().getTime() - startedAt,
          status: toCallStatus(status),
          errorCode: classified.code,
          cacheHit: false,
        })

        return {
          ...base,
          callId,
          data: null,
          status,
          latencyMs: now().getTime() - startedAt,
          message: MESSAGES[status],
        }
      }

      // 6. Tính chi phí và ghi nhật ký
      //
      // Model chưa khai báo giá KHÔNG được làm hỏng lượt gọi: người dùng vẫn cần câu trả
      // lời. Ghi nhận chi phí bằng 0 kèm mã lỗi để việc thiếu bảng giá lộ ra ở nhật ký
      // thay vì âm thầm làm sai con số tổng.
      let costUsd = 0
      let costError: string | null = null
      try {
        costUsd = computeCostUsd(model, result.usage, now())
      } catch {
        costError = 'unknown_model_price'
      }
      const latencyMs = now().getTime() - startedAt

      const callId = await deps.store.logCall({
        userId: args.userId,
        purpose: args.purpose,
        model,
        promptVersion: args.promptVersion,
        usage: result.usage,
        costUsd,
        latencyMs,
        status: 'ok',
        errorCode: costError,
        cacheHit: false,
      })

      if (cacheKey !== null) {
        await deps.store.setCached({
          cacheKey,
          purpose: args.purpose,
          model,
          promptVersion: args.promptVersion,
          response: result.object,
          ttlSeconds: args.cacheTtlSeconds ?? DEFAULT_CACHE_TTL_SECONDS,
        })
      }

      return {
        data: result.object,
        status: 'ok',
        model,
        callId,
        usage: result.usage,
        costUsd,
        latencyMs,
        message: null,
        quotaExhausted: false,
      }
    },
  }
}

function toCallStatus(status: GatewayStatus): AiCallStatus {
  switch (status) {
    case 'timeout':
      return 'timeout'
    case 'rate_limited':
    case 'budget_exceeded':
      return 'rate_limited'
    case 'blocked':
      return 'blocked'
    default:
      return 'error'
  }
}
