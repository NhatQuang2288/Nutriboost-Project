import { createDeepSeek } from '@ai-sdk/deepseek'
import { generateObject } from 'ai'
import type { ZodType } from 'zod'

import { EMPTY_USAGE, type TokenUsage } from './cost'

/**
 * Cổng gọi model.
 *
 * Tách thành giao diện để:
 *   • AI Gateway kiểm thử được mà không cần khoá thật,
 *   • đổi nhà cung cấp chỉ cần thêm một hiện thực mới,
 *   • chế độ chạy không có khoá vẫn dựng được giao diện (dùng `createUnavailableClient`).
 */

export interface StructuredCallArgs<T> {
  model: string
  system: string
  user: string
  schema: ZodType<T>
  maxOutputTokens: number
  timeoutMs: number
  temperature: number
  signal?: AbortSignal
}

export interface StructuredCallResult<T> {
  object: T
  usage: TokenUsage
  finishReason: string
}

export interface StructuredModelClient {
  generate<T>(args: StructuredCallArgs<T>): Promise<StructuredCallResult<T>>
}

export type ModelErrorKind = 'timeout' | 'invalid_output' | 'api_error' | 'unknown'

export class ModelCallError extends Error {
  constructor(
    readonly kind: ModelErrorKind,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ModelCallError'
  }
}

/**
 * Phân loại lỗi mà không phụ thuộc vào lớp lỗi cụ thể của thư viện.
 *
 * Dựa vào `name` của lỗi: AI SDK đặt tên ổn định (`AI_APICallError`,
 * `AI_NoObjectGeneratedError`) nhưng không xuất lớp ra ngoài ở mọi phiên bản.
 */
export function classifyError(error: unknown): ModelCallError {
  if (error instanceof ModelCallError) return error

  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error)

  if (name === 'AbortError' || name === 'TimeoutError' || /timed out|timeout/i.test(message)) {
    return new ModelCallError('timeout', 'timeout', 'Model không phản hồi kịp thời gian cho phép.')
  }
  if (
    name === 'AI_NoObjectGeneratedError' ||
    /no object generated|did not match schema/i.test(message)
  ) {
    return new ModelCallError(
      'invalid_output',
      'no_object',
      'Model trả về dữ liệu không khớp schema yêu cầu.',
    )
  }
  if (name === 'AI_APICallError' || /status ?code|api call/i.test(message)) {
    return new ModelCallError('api_error', name === '' ? 'api_call' : name, message)
  }
  return new ModelCallError('unknown', name === '' ? 'unknown' : name, message)
}

/**
 * Cổng gọi model thật, qua DeepSeek.
 *
 * DeepSeek dùng API tương thích OpenAI và `@ai-sdk/deepseek` bọc sẵn phần đó. `baseURL` cho
 * phép trỏ sang một máy chủ tương thích khác (proxy nội bộ, bản tự dựng) mà không phải sửa mã;
 * bỏ trống thì provider dùng `https://api.deepseek.com`.
 */
export function createDeepSeekClient(apiKey: string, baseURL?: string): StructuredModelClient {
  const provider = createDeepSeek(baseURL === undefined ? { apiKey } : { apiKey, baseURL })

  return {
    async generate<T>(args: StructuredCallArgs<T>): Promise<StructuredCallResult<T>> {
      const timeoutController = new AbortController()
      const timer = setTimeout(() => timeoutController.abort(), args.timeoutMs)

      // Gộp tín hiệu huỷ của người gọi với tín hiệu hết giờ.
      const signal =
        args.signal === undefined
          ? timeoutController.signal
          : AbortSignal.any([args.signal, timeoutController.signal])

      try {
        const result = await generateObject({
          model: provider(args.model),
          schema: args.schema,
          system: args.system,
          prompt: args.user,
          maxOutputTokens: args.maxOutputTokens,
          temperature: args.temperature,
          abortSignal: signal,
        })

        return {
          object: result.object as T,
          usage: toTokenUsage(result.usage),
          finishReason: String(result.finishReason ?? 'unknown'),
        }
      } catch (error) {
        throw classifyError(error)
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

/**
 * Cổng luôn thất bại, kèm lý do đọc được.
 * Dùng khi chưa cấu hình khoá hoặc khi công tắc dừng khẩn cấp đang bật.
 */
export function createUnavailableClient(reason: string): StructuredModelClient {
  return {
    generate<T>(): Promise<StructuredCallResult<T>> {
      return Promise.reject(new ModelCallError('api_error', 'unavailable', reason))
    },
  }
}

/**
 * Chuyển số liệu token của AI SDK sang dạng nội bộ.
 *
 * `cacheReadTokens` nằm trong `inputTokenDetails` và là **tập con** của
 * `inputTokens` — cần cho việc tính đúng chi phí ở `computeCostUsd`.
 */
export function toTokenUsage(usage: {
  inputTokens?: number | undefined
  outputTokens?: number | undefined
  inputTokenDetails?: { cacheReadTokens?: number | undefined } | undefined
}): TokenUsage {
  if (usage.inputTokens === undefined && usage.outputTokens === undefined) {
    return EMPTY_USAGE
  }
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    cachedTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
  }
}
