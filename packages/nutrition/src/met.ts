import type { ScaledNutrients } from './types'

/**
 * Mã hoạt động thể lực được hỗ trợ trong Release 1.
 * Giữ danh sách ngắn và có mã ổn định để lưu vào `activity_logs.activity_code`.
 */
export type ActivityCode =
  | 'walking'
  | 'brisk_walking'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'yoga'
  | 'badminton'
  | 'football'
  | 'housework'

/**
 * Giá trị MET theo 2011 Compendium of Physical Activities
 * (Ainsworth BE, et al. Med Sci Sports Exerc. 2011;43(8):1575-81).
 */
export const MET_VALUES: Readonly<Record<ActivityCode, number>> = {
  walking: 3.5,
  brisk_walking: 4.3,
  running: 9.8,
  cycling: 7.5,
  swimming: 8.0,
  strength: 5.0,
  yoga: 2.5,
  badminton: 5.5,
  football: 7.0,
  housework: 3.0,
}

export const ACTIVITY_LABELS_VI: Readonly<Record<ActivityCode, string>> = {
  walking: 'Đi bộ',
  brisk_walking: 'Đi bộ nhanh',
  running: 'Chạy bộ',
  cycling: 'Đạp xe',
  swimming: 'Bơi',
  strength: 'Tập kháng lực',
  yoga: 'Yoga',
  badminton: 'Cầu lông',
  football: 'Bóng đá',
  housework: 'Việc nhà',
}

export const ACTIVITY_CODES: readonly ActivityCode[] = Object.keys(MET_VALUES) as ActivityCode[]

export function isActivityCode(value: string): value is ActivityCode {
  return Object.prototype.hasOwnProperty.call(MET_VALUES, value)
}

/**
 * Năng lượng tiêu hao của một hoạt động.
 *
 *   kcal = MET × 3,5 × cân nặng (kg) / 200 × số phút
 *
 * Công thức chuẩn dùng VO₂ (ml/kg/phút) quy đổi 1 MET ≈ 3,5 ml O₂/kg/phút,
 * và 1 lít O₂ giải phóng ≈ 5 kcal.
 */
export function kcalBurnedForMet(met: number, weightKg: number, minutes: number): number {
  if (!Number.isFinite(met) || met <= 0) {
    throw new RangeError(`met phải là số dương, nhận được: ${String(met)}`)
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new RangeError(`weightKg phải là số dương, nhận được: ${String(weightKg)}`)
  }
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new RangeError(`minutes phải là số dương, nhận được: ${String(minutes)}`)
  }
  return Math.round(((met * 3.5 * weightKg) / 200) * minutes)
}

export function kcalBurnedForActivity(
  code: ActivityCode,
  weightKg: number,
  minutes: number,
): number {
  return kcalBurnedForMet(MET_VALUES[code], weightKg, minutes)
}

/** Quy đổi kcal tiêu hao trong một ngày thành giá trị để lưu log. */
export function activityLog(
  code: ActivityCode,
  weightKg: number,
  minutes: number,
): { code: ActivityCode; minutes: number; met: number; kcal: number } {
  const met = MET_VALUES[code]
  return { code, minutes, met, kcal: kcalBurnedForMet(met, weightKg, minutes) }
}

/** Tổng kcal tiêu hao từ danh sách hoạt động. */
export function totalKcalBurned(entries: readonly { kcal: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.kcal, 0)
}

/** Kiểu trả về dùng chung khi ghép hoạt động vào tổng quan trong ngày. */
export type { ScaledNutrients }
