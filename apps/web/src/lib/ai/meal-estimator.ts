import { createMealEstimator } from '@nutriboost/ai'
import { buildCatalogue } from '@nutriboost/seed'

/**
 * Bộ ước lượng bữa ăn, gắn với danh mục món thật.
 *
 * Logic nằm ở `@nutriboost/ai` (tầng AI, có bộ đánh giá riêng). Ở đây chỉ nạp danh mục
 * từ `@nutriboost/seed` và xuất ra ba hàm dùng trong route chat.
 *
 * Đây là danh mục TRONG MÃ, dùng cho test và làm phương án dự phòng. Route chat đọc danh mục từ
 * Supabase qua `catalogue.ts` và chỉ rơi về đây khi chưa có CSDL hoặc CSDL chưa nạp lại seed.
 */

const CATALOGUE = buildCatalogue()

const estimator = createMealEstimator(CATALOGUE)

export const estimateMeal = estimator.estimate
export const suggestFoods = estimator.suggest

/** Danh mục món đang dùng, để bộ công cụ AI tra cứu cùng một nguồn dữ liệu. */
export const MEAL_CATALOGUE = CATALOGUE

/** Chính bộ ước lượng này, dùng khi cần tiêm vào bộ công cụ. */
export const mealEstimator = estimator

export { detectServingMultiplier } from '@nutriboost/ai'
export type { EstimatedItem, MealCatalogueEntry, MealEstimate } from '@nutriboost/ai'
