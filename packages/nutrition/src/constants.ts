/**
 * Hằng số dinh dưỡng và nguồn tham chiếu.
 *
 * Mọi hằng số ở đây phải kèm nguồn. Khi đổi một hằng số, phải đổi cả test vector
 * tương ứng trong `src/__tests__/`.
 */

import type { ActivityLevel, BmiCategory, BmiStandard, Goal, Sex } from './types'

/** Phiên bản công thức — ghi vào `energy_targets.formula_version`. */
export const FORMULA_VERSION = 'nutriboost-energy-1.0.0'

/**
 * Hệ số vận động (activity factor).
 * Nguồn: cách dùng phổ biến trong thực hành lâm sàng, nhân với BMR để ra TDEE.
 */
export const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/** Nhãn tiếng Việt của mức vận động. */
export const ACTIVITY_LABELS: Readonly<Record<ActivityLevel, string>> = {
  sedentary: 'Ít vận động (ngồi nhiều)',
  light: 'Vận động nhẹ (1–3 buổi/tuần)',
  moderate: 'Vận động vừa (3–5 buổi/tuần)',
  active: 'Vận động nhiều (6–7 buổi/tuần)',
  very_active: 'Vận động rất nhiều (lao động nặng)',
}

/**
 * Năng lượng của 1 kg mô mỡ.
 * Nguồn: giá trị kinh điển ~7700 kcal/kg (≈ 32,2 MJ/kg) dùng để quy đổi
 * tốc độ thay đổi cân thành mức thâm hụt/thặng dư năng lượng mỗi ngày.
 */
export const KCAL_PER_KG_FAT = 7700

/** Số ngày trong tuần — dùng cho quy đổi kg/tuần → kcal/ngày. */
export const DAYS_PER_WEEK = 7

/** Nhiệt lượng trên mỗi gram đa lượng (Atwater). */
export const KCAL_PER_GRAM = {
  protein: 4,
  carb: 4,
  fat: 9,
} as const

/**
 * Ngưỡng an toàn tuyệt đối cho chế độ ăn tự quản lý.
 * Nguồn: khuyến cáo lâm sàng phổ biến (không hạ dưới mức này nếu không có giám sát y tế).
 */
export const ABSOLUTE_MIN_KCAL: Readonly<Record<Sex, number>> = {
  female: 1200,
  male: 1500,
}

/** Không bao giờ để mục tiêu thấp hơn BMR × hệ số này. */
export const BMR_FLOOR_FACTOR = 1.1

/**
 * Mức thâm hụt tối đa khi giảm cân, tính theo tỉ lệ TDEE.
 * Nguồn: khuyến cáo giảm cân an toàn 0,5–1 kg/tuần (0,5–1 % cân nặng/tuần).
 */
export const MAX_DEFICIT_RATIO = 0.2

/** Mức thặng dư tối đa khi tăng cân, tính theo tỉ lệ TDEE. */
export const MAX_SURPLUS_RATIO = 0.15

/** Tốc độ thay đổi cân mặc định, kg/tuần. */
export const DEFAULT_RATE_KG_PER_WEEK = 0.5

/** Tốc độ thay đổi cân tối đa cho phép nhập vào, kg/tuần. */
export const MAX_RATE_KG_PER_WEEK = 1

/**
 * Đạm theo cân nặng, g/kg/ngày.
 * Nguồn: Morton et al. 2018 (phân tích gộp) — 1,6 g/kg là ngưỡng lợi ích;
 * khi giảm cân dùng mức cao hơn để giữ khối nạc.
 */
export const PROTEIN_G_PER_KG: Readonly<Record<Goal, number>> = {
  lose: 1.8,
  maintain: 1.6,
  gain: 1.6,
}

/** Đạm không vượt quá tỉ lệ này của tổng năng lượng. */
export const MAX_PROTEIN_ENERGY_RATIO = 0.4

/** Chất béo chiếm tỉ lệ này của tổng năng lượng. */
export const FAT_ENERGY_RATIO = 0.25

/** Sàn chất béo, g/kg — dưới ngưỡng này ảnh hưởng hấp thu vitamin tan trong dầu. */
export const MIN_FAT_G_PER_KG = 0.6

/** Trần chất béo theo tỉ lệ năng lượng. */
export const MAX_FAT_ENERGY_RATIO = 0.4

/** Bước làm tròn. */
export const ROUNDING = {
  kcal: 10,
  macroG: 5,
} as const

/**
 * Ngưỡng BMI theo từng chuẩn, dưới dạng dải có thứ tự.
 * Chọn dải đầu tiên mà `bmi < max`.
 *
 * - `who` : phân loại quốc tế (thừa cân từ 25, béo phì độ II từ 35).
 * - `asia`: WHO Expert Consultation, Lancet 2004 — ngưỡng cho người châu Á
 *           (nguy cơ từ 23, béo phì độ I từ 25, độ II từ 30).
 */
export const BMI_BANDS: Readonly<
  Record<BmiStandard, readonly { readonly max: number; readonly category: BmiCategory }[]>
> = {
  who: [
    { max: 18.5, category: 'underweight' },
    { max: 25, category: 'normal' },
    { max: 30, category: 'overweight' },
    { max: 35, category: 'obese_1' },
    { max: Number.POSITIVE_INFINITY, category: 'obese_2' },
  ],
  asia: [
    { max: 18.5, category: 'underweight' },
    { max: 23, category: 'normal' },
    { max: 25, category: 'at_risk' },
    { max: 30, category: 'obese_1' },
    { max: Number.POSITIVE_INFINITY, category: 'obese_2' },
  ],
}

/** Chuẩn BMI mặc định cho người Việt. */
export const DEFAULT_BMI_STANDARD: BmiStandard = 'asia'

/** Nhãn tiếng Việt của từng phân loại BMI. */
export const BMI_LABELS: Readonly<Record<BmiCategory, string>> = {
  underweight: 'Thiếu cân',
  normal: 'Bình thường',
  at_risk: 'Thừa cân (nguy cơ)',
  overweight: 'Thừa cân',
  obese_1: 'Béo phì độ I',
  obese_2: 'Béo phì độ II',
}

/**
 * Cờ sức khoẻ cần chuyển hướng chuyên gia.
 * Khi hồ sơ có bất kỳ cờ nào, trợ lý phải hạ mức khuyến nghị và hiện cảnh báo.
 */
export const MEDICAL_FLAGS = [
  'diabetes',
  'hypertension',
  'heart_disease',
  'kidney_disease',
  'liver_disease',
  'pregnancy',
  'breastfeeding',
  'eating_disorder',
  'gout',
  'thyroid',
] as const

export type MedicalFlag = (typeof MEDICAL_FLAGS)[number]

/** Nhãn tiếng Việt của cờ sức khoẻ. */
export const MEDICAL_FLAG_LABELS: Readonly<Record<MedicalFlag, string>> = {
  diabetes: 'Tiểu đường',
  hypertension: 'Tăng huyết áp',
  heart_disease: 'Bệnh tim mạch',
  kidney_disease: 'Bệnh thận',
  liver_disease: 'Bệnh gan',
  pregnancy: 'Đang mang thai',
  breastfeeding: 'Đang cho con bú',
  eating_disorder: 'Tiền sử rối loạn ăn uống',
  gout: 'Gút',
  thyroid: 'Bệnh tuyến giáp',
}

/** Mức vận động mặc định khi người dùng chưa chọn. */
export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'light'
