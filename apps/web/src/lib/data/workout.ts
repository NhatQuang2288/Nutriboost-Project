import { buildWorkoutPlan, type BuiltWorkoutPlan } from '@nutriboost/ai'
import { EXERCISES } from '@nutriboost/seed'

import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'

import { startOfWeekIso } from './plan'
import { getTodayView } from './today'

/**
 * Lịch tập tuần cho màn `/lich-tap`.
 *
 * Tất định, giống bộ dựng thực đơn: lịch tập phải luôn có, kể cả khi hết hạn mức AI.
 * Bản AI sau này chỉ tinh chỉnh trên nền bản này.
 */

export interface WeeklyWorkoutView {
  plan: BuiltWorkoutPlan
  weekLabel: string
  todayDate: string
  /** `demo` = dữ liệu mẫu. Xem ghi chú trong `today.ts`. */
  source: 'demo' | 'live'
}

export async function getWeeklyWorkout(now: Date = new Date()): Promise<WeeklyWorkoutView> {
  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)
  const view = await getTodayView(now)

  const plan = buildWorkoutPlan({
    weekStart,
    goal: view.profile.goal,
    // Hồ sơ mẫu chưa khai trình độ nên mặc định người mới tập.
    level: 'beginner',
    daysPerWeek: 3,
    sessionMinutes: 45,
    weightKg: view.profile.weightKg,
    equipment: [],
    injuries: [],
    exercises: EXERCISES,
  })

  const lastDate = plan.sessions[plan.sessions.length - 1]?.date ?? weekStart

  return { plan, weekLabel: `${weekStart} → ${lastDate}`, todayDate: today, source: view.source }
}
