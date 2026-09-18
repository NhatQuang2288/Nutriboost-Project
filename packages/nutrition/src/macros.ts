import {
  FAT_ENERGY_RATIO,
  KCAL_PER_GRAM,
  MAX_FAT_ENERGY_RATIO,
  MAX_PROTEIN_ENERGY_RATIO,
  MIN_FAT_G_PER_KG,
  PROTEIN_G_PER_KG,
  ROUNDING,
} from './constants'
import type { EnergyFloor, Goal, MacroSplit } from './types'

/** Sàn đạm tuyệt đối khi phải hạ đạm để nhường chỗ cho chất béo. */
const PROTEIN_ABSOLUTE_FLOOR_G_PER_KG = 1.2

export interface MacroResult {
  split: MacroSplit
  /** Yếu tố biên đã can thiệp — hiển thị cho người dùng để giải thích. */
  floors: EnergyFloor[]
}

/**
 * Chia đa lượng từ mục tiêu năng lượng.
 *
 * Thứ tự ưu tiên khi phải cắt bớt:
 *   1. Đạm theo cân nặng của mục tiêu (nhưng không vượt 40 % năng lượng).
 *   2. Chất béo 25 % năng lượng, kẹp trong [0,6 g/kg, 40 % năng lượng].
 *   3. Carbohydrate nhận phần còn lại; đây là đa lượng duy nhất được phép về 0.
 *
 * Nếu carbohydrate âm, hạ chất béo về sàn trước, rồi mới hạ đạm về 1,2 g/kg.
 * Không bao giờ để carbohydrate âm.
 */
export function computeMacros(targetKcal: number, weightKg: number, goal: Goal): MacroResult {
  if (!Number.isFinite(targetKcal) || targetKcal <= 0) {
    throw new RangeError(`targetKcal phải là số dương, nhận được: ${String(targetKcal)}`)
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new RangeError(`weightKg phải là số dương, nhận được: ${String(weightKg)}`)
  }

  const floors: EnergyFloor[] = []

  const proteinIdealG = PROTEIN_G_PER_KG[goal] * weightKg
  const proteinCapG = (targetKcal * MAX_PROTEIN_ENERGY_RATIO) / KCAL_PER_GRAM.protein
  let proteinG = Math.min(proteinIdealG, proteinCapG)
  if (proteinIdealG > proteinCapG) floors.push('protein_cap')

  const minFatG = MIN_FAT_G_PER_KG * weightKg
  const maxFatG = (targetKcal * MAX_FAT_ENERGY_RATIO) / KCAL_PER_GRAM.fat
  let fatG = (targetKcal * FAT_ENERGY_RATIO) / KCAL_PER_GRAM.fat
  if (fatG < minFatG) {
    // Sàn chất béo thắng trần năng lượng: axit béo thiết yếu và hấp thu vitamin
    // tan trong dầu là ràng buộc sinh lý cứng, còn trần 40 % chỉ là mục tiêu mềm.
    // Dùng if/else để trường hợp minFatG > maxFatG vẫn cho sàn thắng.
    fatG = minFatG
    floors.push('fat_floor')
  } else if (fatG > maxFatG) {
    fatG = maxFatG
  }

  let carbKcal = targetKcal - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat

  if (carbKcal < 0) {
    fatG = minFatG
    floors.push('fat_floor')
    carbKcal = targetKcal - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat
  }

  if (carbKcal < 0) {
    proteinG = Math.min(proteinG, PROTEIN_ABSOLUTE_FLOOR_G_PER_KG * weightKg)
    floors.push('protein_cap')
    carbKcal = targetKcal - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat
  }

  const carbExactG = Math.max(0, carbKcal / KCAL_PER_GRAM.carb)

  const proteinRounded = roundToStep(proteinG, ROUNDING.macroG)
  const fatRounded = roundToStep(fatG, ROUNDING.macroG)
  const carbRounded = roundToStep(carbExactG, ROUNDING.macroG)

  // Bù sai số làm tròn bằng carbohydrate.
  //
  // Làm tròn độc lập cả ba đa lượng về bội số 5 g có thể lệch tới ~45 kcal so với
  // mục tiêu. Mỗi bước 5 g carbohydrate tương ứng 20 kcal, nên chỉnh carbohydrate
  // theo bội số gần nhất sẽ kéo độ lệch về sát 0 mà vẫn giữ mọi macro là bội số 5.
  const drift =
    targetKcal - kcalFromMacros({ proteinG: proteinRounded, carbG: carbRounded, fatG: fatRounded })
  const correctionSteps = Math.round(drift / (ROUNDING.macroG * KCAL_PER_GRAM.carb))
  const carbFinalG = Math.max(0, carbRounded + correctionSteps * ROUNDING.macroG)

  return {
    split: {
      proteinG: proteinRounded,
      carbG: carbFinalG,
      fatG: fatRounded,
    },
    floors: dedupe(floors),
  }
}

/** Năng lượng suy ra từ một bộ macro. */
export function kcalFromMacros(split: MacroSplit): number {
  return (
    split.proteinG * KCAL_PER_GRAM.protein +
    split.carbG * KCAL_PER_GRAM.carb +
    split.fatG * KCAL_PER_GRAM.fat
  )
}

/**
 * Lệch giữa mục tiêu kcal và năng lượng suy ra từ macro đã làm tròn.
 *
 * Sau bước bù sai số bằng carbohydrate trong `computeMacros`, độ lệch tuyệt đối
 * không vượt quá 20 kcal trên toàn miền hồ sơ hợp lệ. Có test theo lưới hồ sơ rộng.
 */
export function macroDriftKcal(targetKcal: number, split: MacroSplit): number {
  return Math.round(targetKcal - kcalFromMacros(split))
}

/** Làm tròn về bội số gần nhất. */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

function dedupe(values: EnergyFloor[]): EnergyFloor[] {
  return [...new Set(values)]
}
