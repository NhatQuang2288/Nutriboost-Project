import { z } from 'zod'

/* =========================================================================
 * Schema miền dùng chung giữa server, client và định nghĩa tool của AI.
 *
 * Quy ước: mọi dữ liệu đi vào hệ thống đều phải qua một schema ở đây.
 * Không nhận `any`, không tin dữ liệu từ model.
 * ======================================================================= */

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
export const logSourceSchema = z.enum([
  'ai_chat',
  'quick_chip',
  'repeat',
  'manual',
  'photo',
  'voice',
])
export const matchMethodSchema = z.enum(['exact', 'trigram', 'ai', 'user'])
export const planItemStatusSchema = z.enum(['suggested', 'accepted', 'swapped', 'skipped'])
export const chatRoleSchema = z.enum(['user', 'assistant', 'system', 'tool'])
export const aiPurposeSchema = z.enum([
  'parse_meal',
  'estimate_meal',
  'generate_plan',
  'chat',
  'insight',
  'title',
])
export const aiCallStatusSchema = z.enum(['ok', 'error', 'rate_limited', 'blocked', 'timeout'])

/** Vùng ngày `YYYY-MM-DD`. */
export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Phải theo định dạng YYYY-MM-DD')

export const healthProfileInputSchema = z.object({
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.number().min(80).max(250),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  targetWeightKg: z.number().min(20).max(400).nullable().optional(),
  rateKgPerWeek: z.number().min(0).max(1).default(0.5),
  dietaryPrefs: z.array(z.string().min(1).max(60)).max(30).default([]),
  allergies: z.array(z.string().min(1).max(60)).max(30).default([]),
  medicalFlags: z
    .array(
      z.enum([
        'diabetes',
        'hypertension',
        'heart_disease',
        'kidney_disease',
        'liver_disease',
        'pregnancy',
        'breastfeeding',
        'eating_disorder',
        'gout',
        'thyroid',
      ]),
    )
    .max(10)
    .default([]),
})

export const bodyMetricInputSchema = z.object({
  measuredOn: localDateSchema,
  weightKg: z.number().min(20).max(400),
  waistCm: z.number().min(30).max(300).nullable().optional(),
})

/** Một mục trong bữa ăn, đã được xác nhận bởi người dùng hoặc tool. */
export const mealItemInputSchema = z.object({
  foodId: z.string().uuid().nullable(),
  displayName: z.string().min(1).max(120),
  grams: z.number().min(0).max(3000),
  matchMethod: matchMethodSchema.default('user'),
  matchScore: z.number().min(0).max(1).nullable().optional(),
})

export const createMealLogSchema = z.object({
  eatenAt: z.string().datetime({ offset: true }),
  mealType: mealTypeSchema,
  source: logSourceSchema.default('manual'),
  rawInput: z.string().max(1000).nullable().optional(),
  aiCallId: z.string().uuid().nullable().optional(),
  aiConfidence: z.number().min(0).max(1).nullable().optional(),
  items: z.array(mealItemInputSchema).min(1).max(30),
})

export const createActivityLogSchema = z.object({
  performedAt: z.string().datetime({ offset: true }),
  activityCode: z.enum([
    'walking',
    'brisk_walking',
    'running',
    'cycling',
    'swimming',
    'strength',
    'yoga',
    'badminton',
    'football',
    'housework',
  ]),
  minutes: z.number().int().min(1).max(1440),
})

export const planItemInputSchema = z.object({
  planDate: localDateSchema,
  mealType: mealTypeSchema,
  foodId: z.string().uuid().nullable(),
  displayName: z.string().min(1).max(120),
  grams: z.number().min(1).max(3000),
  rationale: z.string().max(300).nullable().optional(),
})

export const createPlanSchema = z.object({
  weekStart: localDateSchema,
  items: z.array(planItemInputSchema).min(1).max(70),
})

export const createThreadSchema = z.object({
  title: z.string().min(1).max(120).default('Cuộc trò chuyện mới'),
})

export const aiChatRequestSchema = z.object({
  threadId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(2000),
  /** Ngữ cảnh màn hình, để trợ lý trả lời đúng chỗ người dùng đang đứng. */
  screen: z.string().max(60).optional(),
})

export const aiInsightRequestSchema = z.object({
  localDate: localDateSchema,
})

export type HealthProfileInput = z.infer<typeof healthProfileInputSchema>
export type BodyMetricInput = z.infer<typeof bodyMetricInputSchema>
export type CreateMealLogInput = z.infer<typeof createMealLogSchema>
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>
export type MealItemInput = z.infer<typeof mealItemInputSchema>
