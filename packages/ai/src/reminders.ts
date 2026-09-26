import type { Goal } from '@nutriboost/nutrition'

import { ASSISTANT } from './identity'
import type { PromptBundle } from './prompts'

/**
 * Nhắc nhở khách hàng.
 *
 * Phân chia trách nhiệm rõ ràng:
 *   • **Thời điểm là luật tất định** — hàm thuần, kiểm thử được, không phụ thuộc model.
 *     Gửi sai giờ hoặc gửi trùng là lỗi không thể tha thứ với một ứng dụng nhắc nhở.
 *   • **Lời nhắn do AI viết** — đây đúng là việc của model: diễn đạt ngắn, ấm, có ngữ cảnh.
 *     Nếu AI lỗi, hệ thống vẫn gửi được câu mặc định.
 */

export type ReminderKind = 'log_meal' | 'weigh_in' | 'workout' | 'hydration' | 'weekly_checkin'

export const REMINDER_LABELS: Readonly<Record<ReminderKind, string>> = {
  log_meal: 'Nhắc ghi bữa ăn',
  weigh_in: 'Nhắc cân nặng',
  workout: 'Nhắc buổi tập',
  hydration: 'Nhắc uống nước',
  weekly_checkin: 'Điểm danh cuối tuần',
}

export interface ReminderRule {
  kind: ReminderKind
  /** Giờ địa phương dạng `HH:mm`. */
  time: string
  /** 0 = Chủ nhật, 1 = thứ Hai … 6 = thứ Bảy. */
  days: readonly number[]
  enabled: boolean
}

export interface LocalNow {
  /** `YYYY-MM-DD` theo giờ địa phương. */
  date: string
  /** `HH:mm` theo giờ địa phương. */
  time: string
  /** 0 = Chủ nhật … 6 = thứ Bảy. */
  weekday: number
}

export interface ReminderDecision {
  send: boolean
  reason: string
}

/** Khung giờ được phép gửi, tính bằng phút từ nửa đêm. */
export const QUIET_HOURS_START = 21 * 60 + 30
export const QUIET_HOURS_END = 6 * 60 + 30

/**
 * Cửa sổ gửi quanh giờ đã hẹn, tính bằng phút.
 *
 * Bộ lập lịch chạy định kỳ nên cần một khung chứ không phải một thời điểm chính xác.
 * Chống gửi trùng bằng `alreadySentToday`, không phải bằng cách thu hẹp khung.
 */
export const SEND_WINDOW_MINUTES = 20

export function minutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (match === null) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function isQuietHour(minutes: number): boolean {
  return minutes >= QUIET_HOURS_START || minutes < QUIET_HOURS_END
}

/**
 * Đọc thời gian địa phương từ một thời điểm.
 *
 * Dùng `Intl` với `timeZone` tường minh nên không phụ thuộc múi giờ của máy chạy —
 * đây là điều kiện để nhắc đúng giờ với người dùng ở Việt Nam khi máy chủ đặt ở nước ngoài.
 */
export function localNow(timeZone: string, at: Date = new Date()): LocalNow {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)

  // `en-US` trả về tên thứ tiếng Anh; đổi sang chỉ số bằng bảng tra, tránh phụ thuộc locale.
  const weekdayName = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(at)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayName)

  return { date, time, weekday: weekday < 0 ? 0 : weekday }
}

/**
 * Quyết định có gửi nhắc nhở hay không.
 *
 * Xét theo thứ tự từ rẻ tới đắt, và luôn trả về lý do để ghi log — khi khách hàng hỏi
 * "sao hôm nay không thấy nhắc", câu trả lời nằm ở đây.
 */
export function decideReminder(
  rule: ReminderRule,
  now: LocalNow,
  alreadySentToday: boolean,
): ReminderDecision {
  if (!rule.enabled) return { send: false, reason: 'đang tắt' }

  if (!rule.days.includes(now.weekday)) {
    return { send: false, reason: 'không phải ngày gửi' }
  }

  if (alreadySentToday) return { send: false, reason: 'đã gửi hôm nay' }

  const nowMinutes = minutesOfDay(now.time)
  const ruleMinutes = minutesOfDay(rule.time)

  if (nowMinutes === null) return { send: false, reason: 'giờ hiện tại không hợp lệ' }
  if (ruleMinutes === null) return { send: false, reason: 'giờ hẹn không hợp lệ' }

  if (isQuietHour(nowMinutes)) return { send: false, reason: 'trong giờ yên tĩnh' }

  const delta = nowMinutes - ruleMinutes
  if (delta < -SEND_WINDOW_MINUTES) return { send: false, reason: 'chưa tới giờ' }
  if (delta > SEND_WINDOW_MINUTES) return { send: false, reason: 'đã quá khung giờ' }

  return { send: true, reason: 'đến giờ gửi' }
}

export interface ReminderProfile {
  goal: Goal
  /** Số buổi tập mỗi tuần, để đặt nhắc tập vào đúng ngày. */
  trainingDays?: readonly number[]
  /** Ngày muốn nhắc cân nặng. Mặc định thứ Hai đầu tuần. */
  weighInDay?: number
}

/**
 * Bộ nhắc nhở mặc định.
 *
 * Chọn giờ theo nếp sinh hoạt Việt Nam, và **không đặt quá bốn nhắc mỗi ngày** —
 * nhắc nhiều làm người dùng tắt thông báo, và khi đã tắt thì không nhắc được gì nữa.
 */
export function defaultReminderRules(profile: ReminderProfile): ReminderRule[] {
  const trainingDays = profile.trainingDays ?? [1, 3, 5]
  const weighInDay = profile.weighInDay ?? 1

  return [
    { kind: 'log_meal', time: '12:30', days: [1, 2, 3, 4, 5, 6, 0], enabled: true },
    { kind: 'weigh_in', time: '07:00', days: [weighInDay], enabled: true },
    { kind: 'workout', time: '18:00', days: [...trainingDays], enabled: true },
    { kind: 'hydration', time: '15:00', days: [1, 2, 3, 4, 5], enabled: true },
    { kind: 'weekly_checkin', time: '20:00', days: [0], enabled: true },
  ]
}

/**
 * Số lần nhắc nhiều nhất trong MỘT NGÀY, tính trên ngày bận nhất của tuần.
 *
 * Không phải tổng số luật: `weigh_in` chỉ chạy thứ Hai và `weekly_checkin` chỉ chạy
 * Chủ nhật, nên chúng không bao giờ trùng ngày. Đếm tổng số luật sẽ cho con số cao hơn
 * thực tế và làm mất ý nghĩa của việc kiểm soát tần suất.
 */
export function maxRemindersPerDay(rules: readonly ReminderRule[]): number {
  const enabled = rules.filter((rule) => rule.enabled)
  let busiest = 0

  for (let day = 0; day < 7; day += 1) {
    const count = enabled.filter((rule) => rule.days.includes(day)).length
    if (count > busiest) busiest = count
  }

  return busiest
}

/* ---------------------------------------------------------------------------
 * Lời nhắn do AI viết
 * ------------------------------------------------------------------------- */

export interface ReminderMessageInput {
  kind: ReminderKind
  /** Tên gọi ngắn của khách, ví dụ "Minh". */
  name: string
  /** Dữ kiện đã tính sẵn, ví dụ "còn 620 kcal", "chuỗi 5 ngày". */
  facts: readonly string[]
  /** Buổi tập hôm nay, nếu có. */
  sessionFocus?: string | null
}

export const REMINDER_MESSAGE_VERSION = 'reminder-message@v1'

/**
 * Prompt để model viết lời nhắc.
 *
 * Ràng buộc quan trọng: **không gây cảm giác tội lỗi**. Đây là điểm khác biệt lớn nhất
 * giữa một ứng dụng nhắc nhở dùng được và một ứng dụng bị tắt thông báo sau ba ngày.
 */
export function buildReminderMessagePrompt(input: ReminderMessageInput): PromptBundle {
  const subject: Record<ReminderKind, string> = {
    log_meal: 'nhắc ghi lại bữa ăn gần nhất',
    weigh_in: 'nhắc cân và ghi lại cân nặng',
    workout: 'nhắc buổi tập hôm nay',
    hydration: 'nhắc uống nước',
    weekly_checkin: 'nhắc nhìn lại cả tuần',
  }

  const system = [
    `Bạn viết thông báo đẩy cho ứng dụng dinh dưỡng, nhân danh trợ lý ${ASSISTANT.name}.`,
    `Giọng điệu: ${ASSISTANT.voice}.`,
    '',
    'QUY TẮC:',
    '1. Tối đa 120 ký tự. Thông báo đẩy dài sẽ bị cắt. Tiếng Việt có dấu đầy đủ.',
    '2. Nêu đúng MỘT việc cần làm, cụ thể tới mức làm được ngay.',
    '3. KHÔNG gây cảm giác tội lỗi. Không dùng "bạn đã bỏ", "lại quên", "cố lên nào".',
    '4. Không chẩn đoán, không nói tới bệnh hay thuốc.',
    '5. Không dùng emoji quá một lần, tốt nhất là không dùng.',
    '6. Nếu người dùng đã làm tốt, ghi nhận điều đó thay vì nhắc thêm.',
  ].join('\n')

  const user = [
    `Người dùng tên: ${input.name}`,
    `Loại nhắc: ${subject[input.kind]}`,
    input.sessionFocus === undefined || input.sessionFocus === null
      ? ''
      : `Buổi tập hôm nay: ${input.sessionFocus}`,
    input.facts.length === 0 ? '' : `Số liệu hiện tại: ${input.facts.join(' · ')}`,
  ]
    .filter((line) => line.length > 0)
    .join('\n')

  return { version: REMINDER_MESSAGE_VERSION, system, user }
}

/** Lời nhắn dùng khi AI lỗi hoặc chưa cấu hình — phải luôn có để gửi được. */
export const FALLBACK_REMINDER_MESSAGES: Readonly<Record<ReminderKind, string>> = {
  log_meal: 'Bạn ghi lại bữa vừa rồi giúp mình nhé, chỉ cần một câu.',
  weigh_in: 'Cân buổi sáng là lúc ổn định nhất. Bạn ghi lại giúp mình nhé.',
  workout: 'Hôm nay có buổi tập. Bạn mở lịch tập để xem bài nhé.',
  hydration: 'Bạn uống một cốc nước nhé.',
  weekly_checkin: 'Cuối tuần rồi, bạn xem lại tiến độ tuần này nhé.',
}
