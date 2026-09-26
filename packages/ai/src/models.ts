import { MODEL_PRICES } from './prices'

/**
 * Mục đích gọi AI — khớp enum `ai_purpose` trong CSDL.
 * Mỗi mục đích có hạn mức riêng và được định tuyến tới một model riêng.
 */
export type AiPurpose =
  'parse_meal' | 'estimate_meal' | 'generate_plan' | 'chat' | 'insight' | 'title'

export type ModelRole = 'fast' | 'quality'

/**
 * Định tuyến model theo mục đích.
 *
 * Lý do của từng lựa chọn:
 *   • `parse_meal` / `estimate_meal` — khối lượng lớn, đầu ra là JSON ngắn, chỉ cần model rẻ.
 *   • `insight` / `title`            — một câu văn ngắn, model rẻ là đủ.
 *   • `generate_plan`                — chạy một lần mỗi tuần nhưng chất lượng ảnh hưởng
 *                                      trực tiếp tới trải nghiệm, nên dùng model chất lượng.
 *   • `chat`                         — **mặc định model rẻ**, vì đây là khoản đắt nhất
 *                                      (tăng theo số lượt, không theo số người dùng).
 *                                      Chỉ nâng cấp khi người dùng chủ động yêu cầu.
 */
export const MODEL_ROUTES: Readonly<Record<AiPurpose, ModelRole>> = {
  parse_meal: 'fast',
  estimate_meal: 'fast',
  generate_plan: 'quality',
  chat: 'fast',
  insight: 'fast',
  title: 'fast',
}

export interface ModelSelectionOptions {
  /**
   * Nâng cấp lên model chất lượng cho một lượt cụ thể.
   * Chỉ dùng khi người dùng bấm "phân tích kỹ" — không bao giờ tự động.
   */
  escalate?: boolean
}

export function resolveModel(
  purpose: AiPurpose,
  models: { fast: string; quality: string },
  options: ModelSelectionOptions = {},
): string {
  if (options.escalate === true) return models.quality
  return MODEL_ROUTES[purpose] === 'quality' ? models.quality : models.fast
}

/**
 * Ước lượng thô chi phí một lượt gọi, dùng cho cảnh báo trước khi gọi.
 * Đây chỉ là phòng ngừa; con số thật luôn lấy từ token đã dùng sau khi gọi xong.
 */
export function estimateWorstCaseCostUsd(
  model: string,
  expectedInputTokens: number,
  maxOutputTokens: number,
): number {
  const tier = MODEL_PRICES[model]?.tiers.at(-1)
  if (tier === undefined) return Number.POSITIVE_INFINITY
  return (
    (expectedInputTokens * tier.inputPerMillion) / 1_000_000 +
    (maxOutputTokens * tier.outputPerMillion) / 1_000_000
  )
}
