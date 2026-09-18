import {
  ABSOLUTE_MIN_KCAL,
  BMR_FLOOR_FACTOR,
  DAYS_PER_WEEK,
  DEFAULT_RATE_KG_PER_WEEK,
  FORMULA_VERSION,
  KCAL_PER_KG_FAT,
  MAX_DEFICIT_RATIO,
  MAX_RATE_KG_PER_WEEK,
  MAX_SURPLUS_RATIO,
  ROUNDING,
} from './constants'
import { bmrMifflinStJeor } from './bmr'
import { tdeeFromBmr } from './tdee'
import { computeMacros, macroDriftKcal, roundToStep } from './macros'
import type { EnergyFloor, EnergyInput, EnergyTargets } from './types'

/**
 * Điểm vào duy nhất để tính mục tiêu năng lượng.
 *
 * Thứ tự áp dụng ràng buộc (quan trọng, có test cho từng nhánh):
 *   1. TDEE = BMR × hệ số vận động.
 *   2. Điều chỉnh theo mục tiêu, quy đổi từ kg/tuần sang kcal/ngày.
 *   3. Kẹp thâm hụt ≤ 20 % TDEE, thặng dư ≤ 15 % TDEE.
 *   4. Kẹp không thấp hơn BMR × 1,1.
 *   5. Kẹp không thấp hơn ngưỡng an toàn tuyệt đối theo giới tính.
 *   6. Làm tròn 10 kcal, rồi chia đa lượng.
 *
 * Bước 4 và 5 chỉ áp dụng cho mục tiêu giảm cân và giữ cân; khi tăng cân,
 * mục tiêu luôn cao hơn TDEE nên không thể chạm sàn.
 */
export function computeEnergyTargets(input: EnergyInput): EnergyTargets {
  const { activityLevel, goal, sex, weightKg, rateKgPerWeek } = input

  const bmrKcal = bmrMifflinStJeor(input)
  const tdeeKcal = tdeeFromBmr(bmrKcal, activityLevel)

  const floors: EnergyFloor[] = []
  let targetKcal: number

  if (goal === 'maintain') {
    targetKcal = tdeeKcal
  } else {
    const rate = clampRate(rateKgPerWeek ?? DEFAULT_RATE_KG_PER_WEEK)
    const dailyDelta = (rate * KCAL_PER_KG_FAT) / DAYS_PER_WEEK
    const ratio = dailyDelta / tdeeKcal

    if (goal === 'lose') {
      if (ratio > MAX_DEFICIT_RATIO) {
        floors.push('deficit_cap')
        targetKcal = tdeeKcal * (1 - MAX_DEFICIT_RATIO)
      } else {
        targetKcal = tdeeKcal - dailyDelta
      }
    } else {
      if (ratio > MAX_SURPLUS_RATIO) {
        floors.push('surplus_cap')
        targetKcal = tdeeKcal * (1 + MAX_SURPLUS_RATIO)
      } else {
        targetKcal = tdeeKcal + dailyDelta
      }
    }
  }

  const bmrFloor = bmrKcal * BMR_FLOOR_FACTOR
  if (targetKcal < bmrFloor) {
    targetKcal = bmrFloor
    floors.push('bmr_floor')
  }

  const absoluteFloor = ABSOLUTE_MIN_KCAL[sex]
  if (targetKcal < absoluteFloor) {
    targetKcal = absoluteFloor
    floors.push('absolute_minimum')
  }

  const roundedTargetKcal = roundToStep(targetKcal, ROUNDING.kcal)
  const macros = computeMacros(roundedTargetKcal, weightKg, goal)

  return {
    bmrKcal,
    tdeeKcal,
    targetKcal: roundedTargetKcal,
    proteinG: macros.split.proteinG,
    carbG: macros.split.carbG,
    fatG: macros.split.fatG,
    macroDriftKcal: macroDriftKcal(roundedTargetKcal, macros.split),
    formulaVersion: FORMULA_VERSION,
    floorsApplied: dedupe([...floors, ...macros.floors]),
  }
}

/** Nhãn tiếng Việt giải thích vì sao mục tiêu bị điều chỉnh. */
export const ENERGY_FLOOR_LABELS: Readonly<Record<EnergyFloor, string>> = {
  absolute_minimum: 'Đã nâng lên ngưỡng năng lượng an toàn tối thiểu',
  bmr_floor: 'Đã nâng lên trên mức chuyển hoá cơ bản để tránh mất khối nạc',
  deficit_cap: 'Đã giới hạn mức thâm hụt ở 20 % TDEE để giảm cân an toàn',
  surplus_cap: 'Đã giới hạn mức thặng dư ở 15 % TDEE để hạn chế tăng mỡ',
  protein_cap: 'Đạm đã được giới hạn ở 40 % tổng năng lượng',
  fat_floor: 'Chất béo đã được nâng lên mức sàn để hấp thu vitamin tan trong dầu',
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) return DEFAULT_RATE_KG_PER_WEEK
  return Math.min(rate, MAX_RATE_KG_PER_WEEK)
}

function dedupe(values: EnergyFloor[]): EnergyFloor[] {
  return [...new Set(values)]
}
