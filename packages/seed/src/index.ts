import { normalizeVi } from '@nutriboost/nutrition'

import { DISHES, toDishFoodRecord } from './data/dishes'
import { INGREDIENTS } from './data/ingredients'
import { type DishComponentEstimate, buildVddDishes } from './data/vdd'
import {
  type DatasetValidationReport,
  type DishRecord,
  type FoodRecord,
  type ValidationIssue,
  computeDishPer100g,
  validateDataset,
  validateDishes,
} from './validate'

export * from './validate'
export { INGREDIENTS } from './data/ingredients'
export { DISHES, toDishFoodRecord } from './data/dishes'
export type { DishComponentEstimate } from './data/vdd'
export type { DishDefinition } from './data/dishes'

export const INGREDIENT_BY_SLUG: ReadonlyMap<string, FoodRecord> = new Map(
  INGREDIENTS.map((item) => [item.slug, item]),
)

/**
 * Thành phần của một món để hiển thị cho người dùng.
 *
 * `estimated = true` nghĩa là gram từng nguyên liệu là số ước tính (món lấy từ bảng VDD);
 * `false` nghĩa là món được định nghĩa bằng gram thật và số liệu của nó tính ra từ đó.
 */
export interface DishBreakdown {
  estimated: boolean
  components: readonly DishComponentEstimate[]
}

export interface BuiltDataset {
  /** Nguyên liệu thô, số liệu nhập từ bảng thành phần. */
  ingredients: readonly FoodRecord[]
  /** Món ăn, chỉ số tính ra từ thành phần. */
  dishes: readonly FoodRecord[]
  /** Toàn bộ bản ghi sẽ ghi vào bảng `foods`. */
  all: readonly FoodRecord[]
  /** Thành phần của từng món, để ghi vào bảng `dish_components`. */
  components: readonly DishRecord[]
  /** Thành phần hiển thị theo slug món, gồm cả món VDD (gram ước tính). */
  breakdowns: ReadonlyMap<string, DishBreakdown>
  /** Món trong bảng VDD bị bỏ vì trùng tên với món đã có — để người duyệt xem lại. */
  vddDuplicates: readonly { name: string; existingSlug: string }[]
}

/**
 * Dựng toàn bộ bản ghi thực phẩm từ hai nguồn: nguyên liệu và món.
 *
 * Món thiếu nguyên liệu sẽ bị **bỏ qua** ở đây và được báo là lỗi bởi
 * `validateFullDataset` — không bao giờ ghi vào CSDL một món không tính được calo.
 */
export function buildDataset(): BuiltDataset {
  const dishes: FoodRecord[] = []
  const breakdowns = new Map<string, DishBreakdown>()

  for (const dish of DISHES) {
    const record = toDishFoodRecord(dish, INGREDIENT_BY_SLUG)
    if (record !== null) {
      dishes.push(record)
      breakdowns.set(dish.dishSlug, {
        estimated: false,
        components: dish.components.map((component) => ({
          name:
            INGREDIENT_BY_SLUG.get(component.ingredientSlug)?.nameVi ?? component.ingredientSlug,
          grams: component.grams,
          ingredientSlug: component.ingredientSlug,
        })),
      })
    }
  }

  // Món cũ có gram thật nên được ưu tiên; món VDD trùng tên bị bỏ và được liệt kê lại.
  const known = [...INGREDIENTS, ...dishes]
  const ingredientByName = new Map<string, string>()
  for (const item of INGREDIENTS) {
    ingredientByName.set(normalizeVi(item.nameVi), item.slug)
    for (const alias of item.aliases ?? []) ingredientByName.set(normalizeVi(alias), item.slug)
  }
  const vdd = buildVddDishes(known, ingredientByName)

  const ingredients = [...INGREDIENTS]
  for (const item of vdd.dishes) {
    breakdowns.set(item.record.slug, { estimated: true, components: item.components })
    if (item.record.kind === 'ingredient') ingredients.push(item.record)
    else dishes.push(item.record)
  }

  return {
    ingredients,
    dishes,
    all: [...ingredients, ...dishes],
    components: DISHES,
    breakdowns,
    vddDuplicates: vdd.duplicates,
  }
}

/** Bản ghi danh mục kèm thành phần, dùng cho trợ lý tư vấn món. */
export type CatalogueEntry = FoodRecord & {
  components?: readonly DishComponentEstimate[]
  /** `true` khi gram từng nguyên liệu là số ước tính (món lấy từ bảng VDD). */
  componentsEstimated?: boolean
}

/**
 * Danh mục đầy đủ cho trợ lý: mọi bản ghi `foods`, món nào có thành phần thì kèm thành phần.
 *
 * Thành phần chỉ phục vụ hiển thị và chỉnh khối lượng; số dinh dưỡng của món luôn là số
 * trên 100 g trong chính bản ghi.
 */
export function buildCatalogue(): readonly CatalogueEntry[] {
  const dataset = buildDataset()
  return dataset.all.map((record) => {
    const breakdown = dataset.breakdowns.get(record.slug)
    return breakdown === undefined
      ? record
      : { ...record, components: breakdown.components, componentsEstimated: breakdown.estimated }
  })
}

export interface FullValidationReport {
  dataset: BuiltDataset
  food: DatasetValidationReport
  componentIssues: ValidationIssue[]
  /** Chỉ số tính từ thành phần, để đối chiếu chéo với CSDL. */
  computedDishPer100g: ReadonlyMap<string, ReturnType<typeof computeDishPer100g>>
}

export function validateFullDataset(): FullValidationReport {
  const dataset = buildDataset()
  const food = validateDataset(dataset.all)
  const componentIssues = validateDishes(DISHES, new Set(INGREDIENT_BY_SLUG.keys()))

  const computedDishPer100g = new Map<string, ReturnType<typeof computeDishPer100g>>()
  for (const dish of DISHES) {
    computedDishPer100g.set(dish.dishSlug, computeDishPer100g(dish, INGREDIENT_BY_SLUG))
  }

  return { dataset, food, componentIssues, computedDishPer100g }
}

export interface DatasetStats {
  ingredientCount: number
  dishCount: number
  totalCount: number
  errorCount: number
  warningCount: number
  /** Số dòng còn thiếu so với mục tiêu ~120 nguyên liệu + ~180 món trong docs/roles.md. */
  remainingToTarget: number
}

export const TARGET_INGREDIENTS = 120
export const TARGET_DISHES = 180

export function datasetStats(): DatasetStats {
  const report = validateFullDataset()
  const { dataset } = report

  return {
    ingredientCount: dataset.ingredients.length,
    dishCount: dataset.dishes.length,
    totalCount: dataset.all.length,
    errorCount: report.food.errors.length + report.componentIssues.length,
    warningCount: report.food.warnings.length,
    remainingToTarget:
      Math.max(0, TARGET_INGREDIENTS - dataset.ingredients.length) +
      Math.max(0, TARGET_DISHES - dataset.dishes.length),
  }
}

export {
  EXERCISES,
  EXERCISE_BY_SLUG,
  EXERCISE_SOURCE,
  type ExerciseRecord,
  type MuscleGroup,
  type Equipment,
  type ExerciseLevel,
  type InjuryArea,
  type Measure,
} from './data/exercises'
