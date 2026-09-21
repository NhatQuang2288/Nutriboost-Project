import type { FoodNutrientsPer100g, ScaledNutrients } from './types'

/**
 * Quy đổi chỉ số trên 100 g thành chỉ số thực tế theo khối lượng ăn.
 *
 * Đây là bước biến "AI chọn món + ước lượng gram" thành con số calo.
 * Nhờ vậy model không bao giờ tự bịa calo: nó chỉ chọn `food_id` và gram.
 */
export function scaleNutrients(per100g: FoodNutrientsPer100g, grams: number): ScaledNutrients {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new RangeError(`grams phải là số không âm, nhận được: ${String(grams)}`)
  }
  const factor = grams / 100
  return {
    kcal: Math.round(per100g.kcal * factor),
    proteinG: round1(per100g.proteinG * factor),
    carbG: round1(per100g.carbG * factor),
    fatG: round1(per100g.fatG * factor),
    fiberG: round1((per100g.fiberG ?? 0) * factor),
    sugarG: round1((per100g.sugarG ?? 0) * factor),
    sodiumMg: Math.round((per100g.sodiumMg ?? 0) * factor),
  }
}

/** Cộng dồn nhiều mục trong một bữa hoặc một ngày. */
export function sumNutrients(items: readonly ScaledNutrients[]): ScaledNutrients {
  const total: ScaledNutrients = {
    kcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
  }
  for (const item of items) {
    total.kcal += item.kcal
    total.proteinG = round1(total.proteinG + item.proteinG)
    total.carbG = round1(total.carbG + item.carbG)
    total.fatG = round1(total.fatG + item.fatG)
    total.fiberG = round1(total.fiberG + item.fiberG)
    total.sugarG = round1(total.sugarG + item.sugarG)
    total.sodiumMg += item.sodiumMg
  }
  return total
}

/** Khối lượng cần ăn để đạt một mục tiêu kcal. Dùng cho gợi ý khẩu phần. */
export function gramsForKcal(per100g: FoodNutrientsPer100g, targetKcal: number): number {
  if (per100g.kcal <= 0) return 0
  return Math.round((targetKcal / per100g.kcal) * 100)
}

/**
 * Bội số khẩu phần được phép cho AI chọn.
 * Chặn model ước lượng "1,7 bát" — chỉ cho phép các mức rời rạc dễ kiểm chứng.
 */
export const SERVING_MULTIPLIERS = [0.5, 1, 1.5, 2] as const
export type ServingMultiplier = (typeof SERVING_MULTIPLIERS)[number]

export function gramsFromServing(servingGrams: number, multiplier: ServingMultiplier): number {
  return Math.round(servingGrams * multiplier)
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
