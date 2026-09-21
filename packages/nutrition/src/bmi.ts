import { BMI_BANDS, BMI_LABELS, DEFAULT_BMI_STANDARD } from './constants'
import type { BmiCategory, BmiResult, BmiStandard } from './types'

/**
 * Chỉ số khối cơ thể: BMI = cân nặng (kg) / chiều cao (m)².
 *
 * Làm tròn 1 chữ số thập phân để hiển thị ổn định và để test vector không phụ
 * thuộc sai số dấu phẩy động.
 */
export function bmi(weightKg: number, heightCm: number): number {
  assertPositive(weightKg, 'weightKg')
  assertPositive(heightCm, 'heightCm')
  const heightM = heightCm / 100
  return round(weightKg / (heightM * heightM), 1)
}

/**
 * Phân loại BMI theo chuẩn đã chọn.
 *
 * Mặc định dùng ngưỡng châu Á vì sản phẩm phục vụ người Việt: cùng một chỉ số BMI,
 * người châu Á có nguy cơ chuyển hoá cao hơn người da trắng ở ngưỡng thấp hơn.
 */
export function classifyBmi(
  value: number,
  standard: BmiStandard = DEFAULT_BMI_STANDARD,
): BmiCategory {
  const bands = BMI_BANDS[standard]
  for (const band of bands) {
    if (value < band.max) return band.category
  }
  // Không thể tới đây vì dải cuối có `max = Infinity`; giữ để TypeScript yên tâm.
  return 'obese_2'
}

export function computeBmi(
  weightKg: number,
  heightCm: number,
  standard: BmiStandard = DEFAULT_BMI_STANDARD,
): BmiResult {
  const value = bmi(weightKg, heightCm)
  const category = classifyBmi(value, standard)
  return {
    bmi: value,
    category,
    standard,
    label: BMI_LABELS[category],
  }
}

/** Khoảng cân nặng khoẻ mạnh theo chiều cao và chuẩn đang dùng, trả về kg. */
export function healthyWeightRangeKg(
  heightCm: number,
  standard: BmiStandard = DEFAULT_BMI_STANDARD,
): { minKg: number; maxKg: number } {
  assertPositive(heightCm, 'heightCm')
  const bands = BMI_BANDS[standard]
  const lower = bands[0]?.max ?? 18.5
  const normalBand = bands.find((band) => band.category === 'normal')
  const upper = normalBand?.max ?? 23
  const heightM = heightCm / 100
  return {
    minKg: round(lower * heightM * heightM, 1),
    maxKg: round(upper * heightM * heightM, 1),
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} phải là số dương hữu hạn, nhận được: ${String(value)}`)
  }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
