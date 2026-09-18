import type { MealType } from '@nutriboost/db'

import type { MealCatalogueEntry } from './meal-estimator'

/**
 * Dựng kế hoạch tuần — TẤT ĐỊNH.
 *
 * Vì sao có bản tất định trước khi có bản AI: kế hoạch là thứ người dùng nhìn mỗi ngày,
 * nên nó phải luôn có, kể cả khi hết hạn mức AI, mất mạng, hay model lỗi. Bản AI sau này
 * chỉ *tinh chỉnh* trên nền bản tất định, không thay thế nó.
 *
 * Cách làm: chia mục tiêu kcal trong ngày cho từng bữa theo tỉ lệ chuẩn, rồi chọn món
 * từ danh mục và nhân khẩu phần cho vừa mục tiêu. Mọi con số tính bằng code.
 */

export const MEAL_SHARE: Readonly<Record<MealType, number>> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
}

export const DEFAULT_MEALS_PER_DAY: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export interface PlanTargets {
  targetKcal: number
  proteinG: number
  carbG: number
  fatG: number
}

export interface PlanItem {
  slug: string
  nameVi: string
  grams: number
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
}

export interface PlanMeal {
  mealType: MealType
  targetKcal: number
  items: PlanItem[]
  totalKcal: number
}

export interface PlanDay {
  /** `YYYY-MM-DD`. */
  date: string
  meals: PlanMeal[]
  totalKcal: number
  totalProteinG: number
}

export interface BuiltPlan {
  weekStart: string
  days: PlanDay[]
  averageKcal: number
  averageProteinG: number
  /** Ghi chú về những chỗ kế hoạch không đạt mục tiêu — hiển thị được cho người dùng. */
  notes: string[]
}

export interface BuildPlanInput {
  weekStart: string
  targets: PlanTargets
  catalogue: readonly MealCatalogueEntry[]
  mealsPerDay?: readonly MealType[]
  /** Món phải tránh (dị ứng, người dùng không ăn). */
  excludedSlugs?: readonly string[]
  days?: number
  /** Tỉ lệ khẩu phần tối thiểu và tối đa so với khẩu phần chuẩn của món. */
  servingBounds?: readonly [number, number]
}

/**
 * Số món tối đa trong một bữa.
 *
 * Bữa ăn Việt Nam thường gồm cơm + món mặn + canh. Một món duy nhất thường không đủ
 * đạt mục tiêu kcal của bữa, mà khẩu phần lại bị kẹp để tránh đề xuất vô lý
 * ("3,7 bát cơm"). Ghép 2–3 món vừa sát mục tiêu hơn, vừa giống bữa ăn thật.
 */
export const MAX_DISHES_PER_MEAL = 3

/** Mức lệch còn chấp nhận được của một bữa trước khi ghép thêm món. */
const MEAL_TOLERANCE = 0.1
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new RangeError(`Ngày không hợp lệ: ${isoDate}`)
  }
  const base = Date.UTC(year, month - 1, day)
  const shifted = new Date(base + days * 86_400_000)
  return shifted.toISOString().slice(0, 10)
}

export function buildPlan(input: BuildPlanInput): BuiltPlan {
  const mealsPerDay = input.mealsPerDay ?? DEFAULT_MEALS_PER_DAY
  const dayCount = input.days ?? 7
  const excluded = new Set(input.excludedSlugs ?? [])
  const [minBound, maxBound] = input.servingBounds ?? [0.5, 2]

  // Chỉ dùng món, không dùng nguyên liệu thô: thực đơn phải là thứ ăn được.
  const pool = input.catalogue
    .filter((entry) => (entry.kind ?? 'dish') === 'dish')
    .filter((entry) => !excluded.has(entry.slug))
    .filter((entry) => entry.kcalPer100g > 0)
    // Sắp xếp tất định để cùng đầu vào luôn cho cùng kế hoạch.
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const notes: string[] = []

  if (pool.length === 0) {
    return {
      weekStart: input.weekStart,
      days: [],
      averageKcal: 0,
      averageProteinG: 0,
      notes: ['Không có món nào dùng được — kiểm tra danh mục hoặc danh sách loại trừ.'],
    }
  }

  if (pool.length < mealsPerDay.length) {
    notes.push(
      `Danh mục chỉ có ${pool.length} món nên thực đơn sẽ lặp lại trong tuần. ` +
        'Bổ sung thêm món để kế hoạch đa dạng hơn.',
    )
  }

  const days: PlanDay[] = []

  // Bộ đếm dùng chung cho cả tuần: mỗi món được lấy ra thì tăng lên một, nên hai món
  // liền kề trong thực đơn không bao giờ trùng nhau.
  let picker = 0

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const meals: PlanMeal[] = []

    for (const mealType of mealsPerDay) {
      const share = MEAL_SHARE[mealType] / sumShares(mealsPerDay)
      const mealTargetKcal = Math.round(input.targets.targetKcal * share)

      const items: PlanItem[] = []
      let remaining = mealTargetKcal

      // Ghép dần cho tới khi bữa ăn tiệm cận mục tiêu, hoặc đã đủ số món tối đa.
      for (let attempt = 0; attempt < MAX_DISHES_PER_MEAL; attempt += 1) {
        if (remaining <= mealTargetKcal * MEAL_TOLERANCE) break

        const dish = pool[picker % pool.length]
        picker += 1
        if (dish === undefined) break

        const item = scaleDishToTarget(dish, remaining, minBound, maxBound)
        items.push(item)
        remaining -= item.kcal
      }

      const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0)
      meals.push({ mealType, targetKcal: mealTargetKcal, items, totalKcal })
    }

    const totalKcal = meals.reduce((sum, meal) => sum + meal.totalKcal, 0)
    const totalProteinG = round1(
      meals.reduce(
        (sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + item.proteinG, 0),
        0,
      ),
    )

    days.push({ date: addDays(input.weekStart, dayIndex), meals, totalKcal, totalProteinG })
  }

  const averageKcal = Math.round(
    days.reduce((sum, day) => sum + day.totalKcal, 0) / Math.max(1, days.length),
  )
  const averageProteinG = round1(
    days.reduce((sum, day) => sum + day.totalProteinG, 0) / Math.max(1, days.length),
  )

  // Nói thẳng chỗ không đạt thay vì im lặng: người dùng cần biết kế hoạch có sát mục tiêu không.
  const kcalDeviation = Math.abs(averageKcal - input.targets.targetKcal) / input.targets.targetKcal
  if (kcalDeviation > 0.1) {
    notes.push(
      `Trung bình ${averageKcal} kcal/ngày, lệch ${Math.round(kcalDeviation * 100)} % ` +
        `so với mục tiêu ${input.targets.targetKcal} kcal.`,
    )
  }

  const proteinDeviation =
    input.targets.proteinG > 0
      ? (input.targets.proteinG - averageProteinG) / input.targets.proteinG
      : 0
  if (proteinDeviation > 0.1) {
    notes.push(
      `Trung bình ${averageProteinG} g đạm/ngày, thấp hơn mục tiêu ` +
        `${input.targets.proteinG} g. Nên thêm món giàu đạm.`,
    )
  }

  return { weekStart: input.weekStart, days, averageKcal, averageProteinG, notes }
}

/**
 * Nhân khẩu phần của một món để tiệm cận mục tiêu kcal của bữa.
 *
 * Kẹp trong `[minBound, maxBound]` lần khẩu phần chuẩn: không bao giờ đề xuất
 * "3,7 bát cơm" chỉ để khớp con số.
 */
export function scaleDishToTarget(
  dish: MealCatalogueEntry,
  targetKcal: number,
  minBound = 0.5,
  maxBound = 2,
): PlanItem {
  const servingGrams = dish.servingGrams ?? 100
  const kcalPerGram = dish.kcalPer100g / 100

  const idealGrams = kcalPerGram > 0 ? targetKcal / kcalPerGram : servingGrams
  const clampedGrams = Math.min(
    servingGrams * maxBound,
    Math.max(servingGrams * minBound, idealGrams),
  )
  const grams = Math.max(1, Math.round(clampedGrams))
  const factor = grams / 100

  return {
    slug: dish.slug,
    nameVi: dish.nameVi,
    grams,
    kcal: Math.round(dish.kcalPer100g * factor),
    proteinG: round1(dish.proteinG * factor),
    carbG: round1(dish.carbG * factor),
    fatG: round1(dish.fatG * factor),
  }
}

function sumShares(meals: readonly MealType[]): number {
  const total = meals.reduce((sum, meal) => sum + MEAL_SHARE[meal], 0)
  return total > 0 ? total : 1
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
