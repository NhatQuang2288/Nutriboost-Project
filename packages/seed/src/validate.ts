/**
 * Kiểm tra tính hợp lệ của dữ liệu dinh dưỡng.
 *
 * Đây là hàng rào quan trọng nhất của gói seed: một con số sai trong bảng thành phần
 * sẽ lan ra toàn bộ sản phẩm — mọi mục tiêu calo, mọi gợi ý, mọi biểu đồ.
 *
 * Kiểm tra dựa trên ràng buộc vật lý và sinh hoá, không dựa trên việc "trông có vẻ đúng":
 *   • 1 g đa lượng không thể nhiều hơn 1 g thực phẩm.
 *   • Năng lượng giải phóng tối đa là 9 kcal/g (chất béo thuần).
 *   • Năng lượng công bố phải khớp năng lượng suy ra từ đa lượng (hệ số Atwater).
 *   • Đường là tập con của carbohydrate.
 */

export interface FoodRecord {
  slug: string
  nameVi: string
  kind: 'ingredient' | 'dish'
  category: string
  servingName?: string
  servingGrams?: number
  kcalPer100g: number
  proteinG: number
  carbG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
  sourceRef: string
  aliases?: readonly string[]
}

export interface FoodComponent {
  ingredientSlug: string
  grams: number
}

export interface DishRecord {
  dishSlug: string
  components: readonly FoodComponent[]
}

export interface ValidationIssue {
  slug: string
  field: string
  severity: 'error' | 'warning'
  message: string
}

/** Hệ số Atwater: kcal trên mỗi gram đa lượng. */
const KCAL_PER_GRAM = { protein: 4, carb: 4, fat: 9 } as const

/** Năng lượng tối đa của thực phẩm tự nhiên: chất béo thuần khoảng 900 kcal/100 g. */
const MAX_KCAL_PER_100G = 900

/** Sai lệch năng lượng được phép giữa số công bố và số suy ra từ đa lượng. */
const ENERGY_TOLERANCE_ABSOLUTE = 20
const ENERGY_TOLERANCE_RATIO = 0.15

export function validateFood(food: FoodRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (field: string, severity: 'error' | 'warning', message: string): void => {
    issues.push({ slug: food.slug, field, severity, message })
  }

  if (food.slug.trim().length === 0) add('slug', 'error', 'Thiếu slug.')
  if (food.nameVi.trim().length === 0) add('nameVi', 'error', 'Thiếu tên tiếng Việt.')
  if (food.sourceRef.trim().length === 0) {
    add(
      'sourceRef',
      'error',
      'Thiếu nguồn số liệu — không được đưa số liệu không rõ nguồn vào CSDL.',
    )
  }
  if (food.category.trim().length === 0) add('category', 'warning', 'Chưa phân loại.')

  const numbers: [string, number | undefined, number][] = [
    ['kcalPer100g', food.kcalPer100g, MAX_KCAL_PER_100G],
    ['proteinG', food.proteinG, 100],
    ['carbG', food.carbG, 100],
    ['fatG', food.fatG, 100],
    ['fiberG', food.fiberG, 100],
    ['sugarG', food.sugarG, 100],
    ['sodiumMg', food.sodiumMg, 50_000],
  ]

  for (const [field, value, max] of numbers) {
    if (value === undefined) continue
    if (!Number.isFinite(value)) {
      add(field, 'error', 'Không phải số hữu hạn.')
      continue
    }
    if (value < 0) add(field, 'error', `Không được âm (nhận ${value}).`)
    if (value > max) add(field, 'error', `Vượt ngưỡng hợp lý ${max} (nhận ${value}).`)
  }

  // Ràng buộc vật lý: tổng đa lượng không thể vượt quá khối lượng thực phẩm.
  const macroSum = food.proteinG + food.carbG + food.fatG
  if (Number.isFinite(macroSum) && macroSum > 100) {
    add(
      'macros',
      'error',
      `Tổng đa lượng ${macroSum.toFixed(1)} g/100 g vượt quá 100 g thực phẩm — bất khả thi về mặt vật lý.`,
    )
  }

  // Đường là tập con của carbohydrate.
  if (
    food.sugarG !== undefined &&
    Number.isFinite(food.sugarG) &&
    Number.isFinite(food.carbG) &&
    food.sugarG > food.carbG + 0.01
  ) {
    add('sugarG', 'error', `Đường (${food.sugarG} g) lớn hơn carbohydrate (${food.carbG} g).`)
  }

  // Năng lượng công bố phải khớp năng lượng suy ra từ đa lượng.
  const derivedKcal =
    food.proteinG * KCAL_PER_GRAM.protein +
    food.carbG * KCAL_PER_GRAM.carb +
    food.fatG * KCAL_PER_GRAM.fat
  const tolerance = Math.max(ENERGY_TOLERANCE_ABSOLUTE, food.kcalPer100g * ENERGY_TOLERANCE_RATIO)
  const deviation = Math.abs(derivedKcal - food.kcalPer100g)

  if (Number.isFinite(deviation) && deviation > tolerance) {
    add(
      'kcalPer100g',
      'warning',
      `Năng lượng công bố ${food.kcalPer100g} kcal lệch ${deviation.toFixed(1)} kcal so với ` +
        `${derivedKcal.toFixed(1)} kcal suy ra từ đa lượng (cho phép ${tolerance.toFixed(1)}). ` +
        'Kiểm tra lại số liệu hoặc bổ sung giải thích (ví dụ: alcohol, axit hữu cơ).',
    )
  }

  // Khẩu phần phải đi kèm nhau và có khối lượng hợp lý.
  const hasName = food.servingName !== undefined && food.servingName.trim().length > 0
  const hasGrams = food.servingGrams !== undefined
  if (hasName !== hasGrams) {
    add('serving', 'warning', 'Khai báo khẩu phần phải có cả tên lẫn khối lượng.')
  }
  if (hasGrams && (food.servingGrams ?? 0) <= 0) {
    add('servingGrams', 'error', 'Khối lượng khẩu phần phải lớn hơn 0.')
  }

  return issues
}

export interface DatasetValidationReport {
  issues: ValidationIssue[]
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  isValid: boolean
  slugCount: number
}

export function validateDataset(foods: readonly FoodRecord[]): DatasetValidationReport {
  const issues: ValidationIssue[] = []

  for (const food of foods) {
    issues.push(...validateFood(food))
  }

  // Slug phải duy nhất: trùng slug sẽ ghi đè lặng lẽ khi import.
  const seen = new Map<string, number>()
  for (const food of foods) {
    seen.set(food.slug, (seen.get(food.slug) ?? 0) + 1)
  }
  for (const [slug, count] of seen) {
    if (count > 1) {
      issues.push({
        slug,
        field: 'slug',
        severity: 'error',
        message: `Slug xuất hiện ${count} lần — sẽ ghi đè khi import.`,
      })
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return {
    issues,
    errors,
    warnings,
    isValid: errors.length === 0,
    slugCount: seen.size,
  }
}

/**
 * Kiểm tra thành phần của món ăn.
 *
 * Món phải quy về được nguyên liệu có thật, khối lượng dương, và không tự tham chiếu.
 */
export function validateDishes(
  dishes: readonly DishRecord[],
  ingredientSlugs: ReadonlySet<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const dish of dishes) {
    if (dish.components.length === 0) {
      issues.push({
        slug: dish.dishSlug,
        field: 'components',
        severity: 'error',
        message: 'Món không có thành phần nào — không tính được calo.',
      })
      continue
    }

    for (const component of dish.components) {
      if (component.ingredientSlug === dish.dishSlug) {
        issues.push({
          slug: dish.dishSlug,
          field: 'components',
          severity: 'error',
          message: 'Món tự tham chiếu chính nó.',
        })
      }
      if (!ingredientSlugs.has(component.ingredientSlug)) {
        issues.push({
          slug: dish.dishSlug,
          field: 'components',
          severity: 'error',
          message: `Nguyên liệu "${component.ingredientSlug}" không có trong danh mục.`,
        })
      }
      if (!Number.isFinite(component.grams) || component.grams <= 0) {
        issues.push({
          slug: dish.dishSlug,
          field: 'components',
          severity: 'error',
          message: `Khối lượng của "${component.ingredientSlug}" phải lớn hơn 0.`,
        })
      }
    }
  }

  return issues
}

/**
 * Tính chỉ số trên 100 g của món từ thành phần.
 *
 * Đây là bản TypeScript của `dish_nutrients` + `recompute_dish_nutrients` trong SQL,
 * dùng để kiểm tra chéo: công cụ seed tính trước, CSDL tính lại, hai bên phải khớp.
 */
export function computeDishPer100g(
  dish: DishRecord,
  ingredients: ReadonlyMap<string, FoodRecord>,
): Omit<FoodRecord, 'slug' | 'nameVi' | 'kind' | 'category' | 'sourceRef' | 'aliases'> | null {
  let totalGrams = 0
  let kcal = 0
  let proteinG = 0
  let carbG = 0
  let fatG = 0
  let fiberG = 0
  let sodiumMg = 0

  for (const component of dish.components) {
    const ingredient = ingredients.get(component.ingredientSlug)
    if (ingredient === undefined) return null
    const factor = component.grams / 100
    totalGrams += component.grams
    kcal += ingredient.kcalPer100g * factor
    proteinG += ingredient.proteinG * factor
    carbG += ingredient.carbG * factor
    fatG += ingredient.fatG * factor
    fiberG += (ingredient.fiberG ?? 0) * factor
    sodiumMg += (ingredient.sodiumMg ?? 0) * factor
  }

  if (totalGrams <= 0) return null

  const per100 = (value: number): number => Math.round(((value * 100) / totalGrams) * 10) / 10

  return {
    servingGrams: Math.round(totalGrams),
    kcalPer100g: per100(kcal),
    proteinG: per100(proteinG),
    carbG: per100(carbG),
    fatG: per100(fatG),
    fiberG: per100(fiberG),
    sodiumMg: Math.round((sodiumMg * 100) / totalGrams),
  }
}
