/**
 * `@nutriboost/ai` — AI Gateway và mọi thứ liên quan tới model.
 *
 * Quy tắc kiến trúc: đây là CỬA DUY NHẤT gọi model. ESLint chặn việc import `ai`
 * hay `@ai-sdk/google` ở bất kỳ gói nào khác.
 *
 * Ba bất biến của gói này:
 *   1. Không con số dinh dưỡng nào do model sinh ra — chúng đến từ `@nutriboost/nutrition`.
 *   2. Mọi lời gọi đều đi qua `createAiGateway`, nên luôn có hạn mức, cache và nhật ký chi phí.
 *   3. Đầu ra của model luôn được kiểm tra lại bằng zod trước khi dùng.
 */

export * from './identity'
export * from './prices'
export * from './models'
export * from './cost'
export * from './env'
export * from './schemas'
export * from './guardrails'
export * from './meal-estimator'
export * from './store'
export * from './client'
export * from './gateway'
export * from './prompts'
export * from './chat'
