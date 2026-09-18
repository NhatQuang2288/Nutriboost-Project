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

const estimator = createMealEstimator(buildDataset().all)

export const estimateMeal = estimator.estimate
export const suggestFoods = estimator.suggest

export { detectServingMultiplier } from '@nutriboost/ai'
export type { EstimatedItem, MealCatalogueEntry, MealEstimate } from '@nutriboost/ai'
