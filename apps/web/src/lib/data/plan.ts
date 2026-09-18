import { buildPlan, type BuiltPlan } from '@nutriboost/ai'
import { buildDataset } from '@nutriboost/seed'

import { DEFAULT_TIMEZONE, localDateIn } from '@/lib/date'

import { getTodayView } from './today'

/**
 * Kế hoạch tuần cho màn `/ke-hoach`.
 *
 * HIỆN TÍNH TẤT ĐỊNH TỪ DANH MỤC, chưa gọi AI. Đây là chủ ý: kế hoạch là thứ người dùng
 * mở ra mỗi ngày, nên nó phải luôn có — kể cả khi hết hạn mức AI, mất mạng, hay model lỗi.
 * Bản AI sau này chỉ tinh chỉnh trên nền bản này.
 */

/** Thứ Hai của tuần chứa `isoDate` — tuần bắt đầu từ thứ Hai theo nếp Việt Nam. */
export function startOfWeekIso(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate

  const base = Date.UTC(year, month - 1, day)
  // getUTCDay: 0 = Chủ nhật. Lùi về thứ Hai gần nhất.
  const weekday = new Date(base).getUTCDay()
  const offset = (weekday + 6) % 7

  return new Date(base - offset * 86_400_000).toISOString().slice(0, 10)
}

export interface WeeklyPlanView {
  plan: BuiltPlan
  targetKcal: number
  weekLabel: string
}

export function getWeeklyPlan(now: Date = new Date()): WeeklyPlanView {
  const today = localDateIn(DEFAULT_TIMEZONE, now)
  const weekStart = startOfWeekIso(today)

  const view = getTodayView(now)
  const catalogue = buildDataset().all

  const plan = buildPlan({
    weekStart,
    targets: {
      targetKcal: view.targets.targetKcal,
      proteinG: view.targets.proteinG,
      carbG: view.targets.carbG,
      fatG: view.targets.fatG,
    },
    catalogue,
    // Người dùng chưa khai dị ứng nên chưa loại trừ món nào.
    excludedSlugs: [],
  })

  return {
    plan,
    targetKcal: view.targets.targetKcal,
    weekLabel: `${plan.days[0]?.date ?? weekStart} → ${plan.days[plan.days.length - 1]?.date ?? weekStart}`,
  }
}
