import { DISHES, toDishFoodRecord } from './data/dishes'
import { INGREDIENTS } from './data/ingredients'
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
export type { DishDefinition } from './data/dishes'

export const INGREDIENT_BY_SLUG: ReadonlyMap<string, FoodRecord> = new Map(
  INGREDIENTS.map((item) => [item.slug, item]),
)

export interface BuiltDataset {
  /** Nguyên liệu thô, số liệu nhập từ bảng thành phần. */
  ingredients: readonly FoodRecord[]
  /** Món ăn, chỉ số tính ra từ thành phần. */
  dishes: readonly FoodRecord[]
  /** Toàn bộ bản ghi sẽ ghi vào bảng `foods`. */
  all: readonly FoodRecord[]
  /** Thành phần của từng món, để ghi vào bảng `dish_components`. */
  components: readonly DishRecord[]
}

/**
 * Dựng toàn bộ bản ghi thực phẩm từ hai nguồn: nguyên liệu và món.
 *
 * Món thiếu nguyên liệu sẽ bị **bỏ qua** ở đây và được báo là lỗi bởi
 * `validateFullDataset` — không bao giờ ghi vào CSDL một món không tính được calo.
 */
export function buildDataset(): BuiltDataset {
  const dishes: FoodRecord[] = []

  for (const dish of DISHES) {
    const record = toDishFoodRecord(dish, INGREDIENT_BY_SLUG)
    if (record !== null) {
      dishes.push(record)
    }
  }

  return {
    ingredients: INGREDIENTS,
    dishes,
    all: [...INGREDIENTS, ...dishes],
    components: DISHES,
  }
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
