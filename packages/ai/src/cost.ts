import { rateFor } from './prices'

export interface TokenUsage {
  /** Tổng token đầu vào, bao gồm cả phần đọc từ cache. */
  inputTokens: number
  outputTokens: number
  /** Phần đầu vào đọc từ cache ngữ cảnh — là tập con của `inputTokens`. */
  cachedTokens: number
}

export const EMPTY_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0, cachedTokens: 0 }

/**
 * Chi phí một lượt gọi, tính bằng USD.
 *
 * Token đọc từ cache là **tập con** của token đầu vào và có đơn giá riêng rẻ hơn
 * khoảng 10 lần, nên phải trừ ra khỏi phần tính theo giá đầy đủ. Nếu quên bước này,
 * chi phí sẽ bị tính cao hơn thực tế.
 *
 * Làm tròn 6 chữ số thập phân để khớp cột `ai_calls.cost_usd numeric(10,6)`.
 *
 * Dùng `rateFor` chứ không `priceFor`: DeepSeek tính **một nửa giá** ngoài giờ cao điểm, nên
 * đơn giá phụ thuộc cả ngày lẫn giờ. Dùng `priceFor` sẽ tính theo giá cao điểm cho mọi lượt
 * gọi — sai tới gấp đôi vào những giờ chiếm phần lớn thời gian trong ngày.
 */
export function computeCostUsd(model: string, usage: TokenUsage, at: Date = new Date()): number {
  const tier = rateFor(model, at)

  const cached = clampNonNegative(usage.cachedTokens)
  const input = clampNonNegative(usage.inputTokens)
  const uncachedInput = Math.max(0, input - cached)
  const output = clampNonNegative(usage.outputTokens)

  const cost =
    (uncachedInput * tier.inputPerMillion) / 1_000_000 +
    (cached * tier.cachedInputPerMillion) / 1_000_000 +
    (output * tier.outputPerMillion) / 1_000_000

  return round6(cost)
}

/** Chi phí lưu cache ngữ cảnh trong một khoảng thời gian. */
export function computeCacheStorageCostUsd(
  model: string,
  cachedTokens: number,
  hours: number,
  at: Date = new Date(),
): number {
  if (cachedTokens <= 0 || hours <= 0) return 0
  const tier = rateFor(model, at)
  return round6((cachedTokens * tier.cacheStoragePerMillionHour * hours) / 1_000_000)
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
  }
}

/** Tỉ lệ token đầu vào được phục vụ từ cache — chỉ số theo dõi hiệu quả tiết kiệm. */
export function cacheHitRate(usage: TokenUsage): number {
  if (usage.inputTokens <= 0) return 0
  return Math.min(1, usage.cachedTokens / usage.inputTokens)
}

export function formatUsd(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}
