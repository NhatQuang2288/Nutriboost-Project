/**
 * Kiểu dữ liệu dùng chung cho lõi dinh dưỡng tất định.
 *
 * Nguyên tắc: gói này KHÔNG gọi AI và KHÔNG đọc/ghi dữ liệu.
 * Mọi con số dinh dưỡng trong sản phẩm đều phải đi qua đây.
 */

export type Sex = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type Goal = 'lose' | 'maintain' | 'gain'

/**
 * Chuẩn phân loại BMI.
 * - `who`  : ngưỡng quốc tế (thừa cân từ 25).
 * - `asia` : ngưỡng WHO dành cho người châu Á (thừa cân từ 23) — MẶC ĐỊNH cho người Việt.
 */
export type BmiStandard = 'who' | 'asia'

export type BmiCategory =
  'underweight' | 'normal' | 'at_risk' | 'overweight' | 'obese_1' | 'obese_2'

export interface BodyInput {
  /** Cân nặng, kg. */
  weightKg: number
  /** Chiều cao, cm. */
  heightCm: number
  /** Tuổi, năm. */
  age: number
  sex: Sex
}

export interface EnergyInput extends BodyInput {
  activityLevel: ActivityLevel
  goal: Goal
  /**
   * Tốc độ thay đổi cân mong muốn, kg/tuần.
   * Chỉ dùng khi `goal` khác `maintain`. Mặc định 0.5 kg/tuần.
   */
  rateKgPerWeek?: number
}

/** Yếu tố biên đã can thiệp vào kết quả — phải hiển thị được cho người dùng. */
export type EnergyFloor =
  'absolute_minimum' | 'bmr_floor' | 'deficit_cap' | 'surplus_cap' | 'protein_cap' | 'fat_floor'

export interface EnergyTargets {
  bmrKcal: number
  tdeeKcal: number
  /** Mục tiêu kcal/ngày, đã làm tròn tới 10 kcal. */
  targetKcal: number
  proteinG: number
  carbG: number
  fatG: number
  /**
   * Chênh lệch giữa `targetKcal` và tổng kcal suy ra từ macro đã làm tròn.
   * Luôn được kiểm soát bằng test; dùng để hiển thị minh bạch nếu lệch đáng kể.
   */
  macroDriftKcal: number
  /** Phiên bản công thức — ghi vào cột `energy_targets.formula_version`. */
  formulaVersion: string
  /** Các yếu tố biên đã kích hoạt, để giải thích cho người dùng. */
  floorsApplied: EnergyFloor[]
}

export interface MacroSplit {
  proteinG: number
  carbG: number
  fatG: number
}

/** Một mục thực phẩm với chỉ số trên 100 g (khớp bảng `foods`). */
export interface FoodNutrientsPer100g {
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
}

export interface ScaledNutrients {
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
}

export interface BmiResult {
  bmi: number
  category: BmiCategory
  standard: BmiStandard
  /** Nhãn tiếng Việt để hiển thị trực tiếp. */
  label: string
}
