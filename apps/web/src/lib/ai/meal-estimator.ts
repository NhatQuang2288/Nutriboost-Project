import { createMealEstimator } from '@nutriboost/ai'
import { buildDataset } from '@nutriboost/seed'

/**
 * Bộ ước lượng bữa ăn, gắn với danh mục món thật.
 *
 * Logic nằm ở `@nutriboost/ai` (tầng AI, có bộ đánh giá riêng). Ở đây chỉ nạp danh mục
 * từ `@nutriboost/seed` và xuất ra ba hàm dùng trong route chat.
 *
 * Khi có CSDL thật, thay `buildDataset().all` bằng danh mục lấy từ `search_foods`
 * (pg_trgm) — phần còn lại không đổi.
 */

const CATALOGUE = buildDataset().all

const estimator = createMealEstimator(CATALOGUE)

export const estimateMeal = estimator.estimate
export const suggestFoods = estimator.suggest

/** Danh mục món đang dùng, để bộ công cụ AI tra cứu cùng một nguồn dữ liệu. */
export const MEAL_CATALOGUE = CATALOGUE

/** Chính bộ ước lượng này, dùng khi cần tiêm vào bộ công cụ. */
export const mealEstimator = estimator

export { detectServingMultiplier } from '@nutriboost/ai'
export type { EstimatedItem, MealCatalogueEntry, MealEstimate } from '@nutriboost/ai'
