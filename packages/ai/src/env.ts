import type { AiPurpose } from './models'

/**
 * Đọc cấu hình AI từ biến môi trường. Đọc lười, không ném lỗi lúc import.
 *
 * `AI_KILL_SWITCH=true` là công tắc dừng khẩn cấp: tắt mọi lời gọi AI mà không cần
 * deploy lại. Ứng dụng vẫn phải dùng được — người dùng chuyển sang ghi tay.
 */

export type AiLimits = Readonly<Record<AiPurpose, number>>

export interface AiEnv {
  apiKey: string | null
  models: { fast: string; quality: string }
  dailyBudgetUsd: number
  killSwitch: boolean
  limits: AiLimits
}

/**
 * Hạn mức mặc định mỗi người dùng mỗi ngày.
 *
 * Chọn theo chi phí: `chat` là khoản đắt nhất nên bị giới hạn chặt nhất tương ứng
 * với ngân sách $0,02/người/ngày.
 */
export const DEFAULT_AI_LIMITS: AiLimits = {
  parse_meal: 40,
  estimate_meal: 60,
  generate_plan: 3,
  chat: 40,
  insight: 1,
  title: 10,
}

/** Trần mềm chi phí mỗi người dùng mỗi ngày, USD. */
export const DEFAULT_DAILY_BUDGET_USD = 0.02

export function readAiEnv(): AiEnv {
  return {
    apiKey: clean(process.env.GEMINI_API_KEY),
    models: {
      fast: clean(process.env.AI_MODEL_FAST) ?? 'gemini-3.5-flash-lite',
      quality: clean(process.env.AI_MODEL_QUALITY) ?? 'gemini-3.6-flash',
    },
    dailyBudgetUsd: readNumber(process.env.AI_DAILY_BUDGET_USD, DEFAULT_DAILY_BUDGET_USD),
    killSwitch: process.env.AI_KILL_SWITCH === 'true',
    limits: {
      parse_meal: readNumber(process.env.AI_LIMIT_PARSE_PER_DAY, DEFAULT_AI_LIMITS.parse_meal),
      /*
       * Biến riêng, không dùng chung với `parse_meal`. Trước đây hai dòng này cùng đọc
       * `AI_LIMIT_PARSE_PER_DAY`, nên đặt hạn mức cho việc phân tích bữa ăn lại âm thầm đổi
       * luôn hạn mức ước lượng — hai việc có tần suất và chi phí khác nhau.
       */
      estimate_meal: readNumber(
        process.env.AI_LIMIT_ESTIMATE_PER_DAY,
        DEFAULT_AI_LIMITS.estimate_meal,
      ),
      generate_plan: readNumber(process.env.AI_LIMIT_PLAN_PER_DAY, DEFAULT_AI_LIMITS.generate_plan),
      chat: readNumber(process.env.AI_LIMIT_CHAT_PER_DAY, DEFAULT_AI_LIMITS.chat),
      insight: readNumber(process.env.AI_LIMIT_INSIGHT_PER_DAY, DEFAULT_AI_LIMITS.insight),
      title: DEFAULT_AI_LIMITS.title,
    },
  }
}

export function isAiConfigured(): boolean {
  const env = readAiEnv()
  return env.apiKey !== null && !env.killSwitch
}

/**
 * Lý do AI không dùng được, dạng đọc được cho người dùng.
 * Trả về `null` khi AI dùng được bình thường.
 */
export function aiDisabledReason(): string | null {
  const env = readAiEnv()
  if (env.killSwitch) {
    return 'Trợ lý đang tạm nghỉ để bảo trì. Bạn vẫn ghi bữa ăn bằng tay được.'
  }
  if (env.apiKey === null) {
    return 'Chưa cấu hình khoá Gemini. Bạn vẫn ghi bữa ăn bằng tay được.'
  }
  return null
}

function clean(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function readNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}
