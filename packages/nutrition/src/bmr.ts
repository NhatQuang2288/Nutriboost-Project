import type { BodyInput, Sex } from './types'

/**
 * BMR theo phương trình Mifflin–St Jeor.
 *
 * Nguồn: Mifflin MD, St Jeor ST, Hill LA, et al. "A new predictive equation for
 * resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241-7.
 *
 * Đây là phương trình được khuyến nghị cho người trưởng thành khoẻ mạnh và chính xác
 * hơn Harris–Benedict ở người thừa cân. Đây là lựa chọn mặc định của gói này.
 *
 *   nam : 10 × kg + 6,25 × cm − 5 × tuổi + 5
 *   nữ  : 10 × kg + 6,25 × cm − 5 × tuổi − 161
 */
export function bmrMifflinStJeor(input: BodyInput): number {
  const { weightKg, heightCm, age, sex } = input
  assertBody(input)

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const sexAdjustment = sex === 'male' ? 5 : -161
  return Math.round(base + sexAdjustment)
}

/** Hệ số điều chỉnh theo giới tính trong phương trình Mifflin–St Jeor. */
export function sexAdjustment(sex: Sex): number {
  return sex === 'male' ? 5 : -161
}

function assertBody(input: BodyInput): void {
  const { weightKg, heightCm, age } = input
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new RangeError(`weightKg phải là số dương, nhận được: ${String(weightKg)}`)
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new RangeError(`heightCm phải là số dương, nhận được: ${String(heightCm)}`)
  }
  if (!Number.isFinite(age) || age <= 0 || age > 120) {
    throw new RangeError(`age phải nằm trong (0, 120], nhận được: ${String(age)}`)
  }
}
