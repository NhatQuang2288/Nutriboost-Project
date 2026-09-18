import { ACTIVITY_FACTORS } from './constants'
import { bmrMifflinStJeor } from './bmr'
import type { ActivityLevel, BodyInput } from './types'

/**
 * Tổng năng lượng tiêu hao mỗi ngày: TDEE = BMR × hệ số vận động.
 */
export function tdeeFromBmr(bmrKcal: number, activityLevel: ActivityLevel): number {
  if (!Number.isFinite(bmrKcal) || bmrKcal <= 0) {
    throw new RangeError(`bmrKcal phải là số dương, nhận được: ${String(bmrKcal)}`)
  }
  return Math.round(bmrKcal * ACTIVITY_FACTORS[activityLevel])
}

/** Tiện ích gộp: từ hồ sơ cơ thể ra cả BMR và TDEE. */
export function energyExpenditure(
  input: BodyInput,
  activityLevel: ActivityLevel,
): { bmrKcal: number; tdeeKcal: number } {
  const bmrKcal = bmrMifflinStJeor(input)
  return { bmrKcal, tdeeKcal: tdeeFromBmr(bmrKcal, activityLevel) }
}
