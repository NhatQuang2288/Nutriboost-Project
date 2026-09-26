import {
  CHAT_SYSTEM_VERSION,
  type AiStore,
  type GatewayStatus,
  type TokenUsage,
  computeCostUsd,
  gatewayMessage,
} from '@nutriboost/ai'

/**
 * Hạn mức và nhật ký chi phí cho **đường chat dạng stream**.
 *
 * Vì sao cần file riêng: `createAiGateway` chỉ dùng cho các lời gọi có cấu trúc (trả về một
 * đối tượng đã kiểm bằng zod). Đường chat dùng `streamText` nên không đi qua cổng, và do đó
 * không tự có hạn mức lẫn nhật ký chi phí. Trước đây đúng như vậy: trần lượt AI và bảng
 * `ai_calls` tồn tại trong CSDL mà **không có gì ghi vào** — hạn mức kinh tế trong
 * docs/PRICING.md chỉ là con số trên giấy.
 */

export interface ChatAllowance {
  allowed: boolean
  /** Câu hiển thị khi bị chặn. `null` khi được gọi. */
  message: string | null
  status: GatewayStatus | null
}

export interface ChatCallInfo {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  model: string
}

/**
 * Kiểm tra còn được gọi model không.
 *
 * Thứ tự giống `createAiGateway`: hạn mức lượt trước, rồi mới tới trần chi phí. Không có
 * `store` (chế độ dữ liệu mẫu, hoặc thiếu khoá service role) thì cho qua — lúc đó cũng
 * không có khoá Gemini nên không có gì để tiêu.
 */
export async function checkChatAllowance(args: {
  store: AiStore | null
  userId: string | null
  dailyChatLimit: number
  dailyBudgetUsd: number
  now?: Date
}): Promise<ChatAllowance> {
  if (args.store === null || args.userId === null) {
    return { allowed: true, message: null, status: null }
  }

  const claimed = await args.store.claimQuota(args.userId, 'chat', args.dailyChatLimit)
  if (!claimed) {
    return {
      allowed: false,
      message: gatewayMessage('rate_limited'),
      status: 'rate_limited',
    }
  }

  /*
   * Lượt đã bị trừ trước khi kiểm tra chi phí. Đúng như cổng: một lượt đã tiêu là một lượt
   * đã tiêu, kể cả khi sau đó bị trần chi phí chặn — người dùng không được lợi gì khi gọi
   * liên tục vào lúc hết ngân sách.
   */
  const spent = await args.store.dailyCostUsd(args.userId, args.now ?? new Date())
  if (spent >= args.dailyBudgetUsd) {
    return {
      allowed: false,
      message: gatewayMessage('budget_exceeded'),
      status: 'budget_exceeded',
    }
  }

  return { allowed: true, message: null, status: null }
}

/**
 * Ghi một lượt chat đã hoàn tất vào `ai_calls`.
 *
 * Model chưa khai báo giá **không** được làm hỏng lượt gọi: người dùng vẫn cần câu trả lời.
 * Ghi chi phí bằng 0 kèm mã lỗi để chuyện thiếu bảng giá lộ ra ở nhật ký, thay vì âm thầm
 * làm sai con số tổng. Cùng cách xử lý với `createAiGateway`.
 */
export async function recordChatCall(args: {
  store: AiStore | null
  userId: string | null
  info: ChatCallInfo
  latencyMs: number
  now?: Date
}): Promise<string | null> {
  if (args.store === null) return null

  const usage: TokenUsage = {
    inputTokens: args.info.inputTokens,
    outputTokens: args.info.outputTokens,
    cachedTokens: args.info.cachedTokens,
  }

  let costUsd = 0
  let errorCode: string | null = null
  try {
    costUsd = computeCostUsd(args.info.model, usage, args.now ?? new Date())
  } catch {
    errorCode = 'unknown_model_price'
  }

  return args.store.logCall({
    userId: args.userId,
    purpose: 'chat',
    model: args.info.model,
    promptVersion: CHAT_SYSTEM_VERSION,
    usage,
    costUsd,
    latencyMs: args.latencyMs,
    status: 'ok',
    errorCode,
    cacheHit: false,
  })
}
