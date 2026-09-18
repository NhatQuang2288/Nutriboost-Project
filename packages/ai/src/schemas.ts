import { z } from 'zod'

/* =========================================================================
 * Schema cho đầu ra của model.
 *
 * Mọi phản hồi của model đều phải qua zod trước khi chạm vào hệ thống.
 * Đây là lớp phòng thủ thứ hai: lớp thứ nhất là `responseSchema` gửi cho Gemini,
 * nhưng model vẫn có thể trả sai, nên luôn kiểm tra lại.
 * ======================================================================= */

const uuid = z.string().uuid()

const mealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])

const severity = z.enum(['info', 'warning', 'refer'])

/* ---------------------------------------------------------------------------
 * Hiểu bữa ăn
 * ------------------------------------------------------------------------- */

/**
 * Một món model nhận ra trong câu người dùng nói.
 *
 * `foodId` BẮT BUỘC nằm trong danh sách ứng viên được đưa vào prompt.
 * Nếu model bịa một id không có trong danh sách, tầng gọi phải loại bỏ mục đó —
 * xem `validateMealEstimate`.
 */
export const parsedMealItemSchema = z.object({
  /** Id món trong CSDL, hoặc null khi không món nào trong danh sách khớp. */
  foodId: uuid.nullable(),
  /** Tên món viết lại bằng tiếng Việt có dấu, để hiển thị. */
  displayName: z.string().min(1).max(120),
  /** Khối lượng ước lượng, gram. */
  grams: z.number().min(0).max(3000),
  /** Độ tự tin 0–1. Dưới 0,6 thì bắt buộc người dùng xác nhận. */
  confidence: z.number().min(0).max(1),
  /** Cơ sở của khối lượng: khẩu phần chuẩn, người dùng nói rõ, hay model suy ra. */
  quantityBasis: z.enum(['serving', 'explicit', 'inferred']),
})

export const parsedMealSchema = z.object({
  items: z.array(parsedMealItemSchema).max(30),
  /** Phần model không khớp được với món nào — dùng để bổ sung dữ liệu sau. */
  unmatched: z.array(z.string().min(1).max(120)).max(20),
  /** Bữa nào trong ngày, nếu suy ra được từ ngữ cảnh. */
  mealType: mealType.nullable(),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().max(200).nullable(),
})

export type ParsedMeal = z.infer<typeof parsedMealSchema>
export type ParsedMealItem = z.infer<typeof parsedMealItemSchema>

/* ---------------------------------------------------------------------------
 * Kế hoạch tuần
 * ------------------------------------------------------------------------- */

export const planDraftItemSchema = z.object({
  /** 0 = ngày đầu tuần. */
  dayOffset: z.number().int().min(0).max(6),
  mealType,
  foodId: uuid,
  displayName: z.string().min(1).max(120),
  grams: z.number().min(1).max(2000),
  /** Lý do ngắn gọn, hiển thị được cho người dùng. Tối đa 140 ký tự. */
  rationale: z.string().max(140),
})

export const planDraftSchema = z.object({
  items: z.array(planDraftItemSchema).min(1).max(70),
  summary: z.string().max(300),
})

export type PlanDraft = z.infer<typeof planDraftSchema>
export type PlanDraftItem = z.infer<typeof planDraftItemSchema>

/* ---------------------------------------------------------------------------
 * Insight hằng ngày
 * ------------------------------------------------------------------------- */

export const dailyInsightSchema = z.object({
  /** Một câu quan sát, tối đa 90 ký tự để không vỡ bố cục thẻ. */
  headline: z.string().min(1).max(90),
  /** Đúng MỘT hành động cụ thể, làm được ngay hôm nay. */
  action: z.string().min(1).max(140),
  severity,
})

export type DailyInsight = z.infer<typeof dailyInsightSchema>

/* ---------------------------------------------------------------------------
 * Tiêu đề hội thoại
 * ------------------------------------------------------------------------- */

export const threadTitleSchema = z.object({
  /** Tiêu đề tiếng Việt, tối đa 6 từ. */
  title: z.string().min(1).max(60),
})

/* ---------------------------------------------------------------------------
 * Generative UI — sổ đăng ký component
 *
 * ĐÂY LÀ HÀNG RÀO AN NINH.
 * Model chỉ được yêu cầu dựng những component có tên trong danh sách này, và
 * props phải khớp schema tương ứng. Tên lạ → card dự phòng, không render gì tuỳ ý.
 * Không có `eval`, không dynamic import theo tên do model sinh.
 * ------------------------------------------------------------------------- */

export const foodCandidateSchema = z.object({
  foodId: uuid,
  nameVi: z.string().min(1).max(120),
  servingName: z.string().max(60).nullable(),
  servingGrams: z.number().min(1).max(2000).nullable(),
  kcalPer100g: z.number().min(0).max(1000),
})

export const mealConfirmItemSchema = z.object({
  foodId: uuid.nullable(),
  displayName: z.string().min(1).max(120),
  grams: z.number().min(0).max(3000),
  kcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(500),
  confidence: z.number().min(0).max(1),
})

export const macroSummarySchema = z.object({
  kcal: z.number().min(0),
  proteinG: z.number().min(0),
  carbG: z.number().min(0),
  fatG: z.number().min(0),
})

export const GENERATIVE_COMPONENTS = {
  food_candidate_chips: z.object({
    candidates: z.array(foodCandidateSchema).min(1).max(8),
    promptText: z.string().max(120),
  }),

  meal_confirm_card: z.object({
    title: z.string().max(80),
    rawInput: z.string().max(500),
    items: z.array(mealConfirmItemSchema).min(1).max(20),
    total: macroSummarySchema,
    needsConfirmation: z.boolean(),
  }),

  meal_logged_receipt: z.object({
    mealType,
    total: macroSummarySchema,
    remainingKcal: z.number(),
  }),

  target_summary_card: z.object({
    bmrKcal: z.number().min(0),
    tdeeKcal: z.number().min(0),
    targetKcal: z.number().min(0),
    macros: macroSummarySchema,
    explanation: z.string().max(300),
  }),

  progress_chart_card: z.object({
    rangeLabel: z.string().max(40),
    points: z.array(z.object({ label: z.string().max(20), value: z.number() })).max(60),
    unit: z.string().max(20),
    trendLabel: z.string().max(60),
  }),

  plan_preview_week: z.object({
    weekStart: z.string().max(10),
    days: z
      .array(
        z.object({
          dayLabel: z.string().max(20),
          meals: z
            .array(
              z.object({
                mealType,
                displayName: z.string().max(120),
                kcal: z.number().min(0),
              }),
            )
            .max(6),
        }),
      )
      .max(7),
  }),

  safety_notice_card: z.object({
    severity,
    reasons: z.array(z.string().max(200)).min(1).max(6),
  }),

  choice_chips: z.object({
    question: z.string().max(160),
    options: z
      .array(z.object({ value: z.string().max(60), label: z.string().max(60) }))
      .min(2)
      .max(6),
  }),
} as const

export type GenerativeComponentName = keyof typeof GENERATIVE_COMPONENTS

export const GENERATIVE_COMPONENT_NAMES = Object.keys(
  GENERATIVE_COMPONENTS,
) as GenerativeComponentName[]

export type GenerativePayload = {
  [K in GenerativeComponentName]: {
    component: K
    props: z.infer<(typeof GENERATIVE_COMPONENTS)[K]>
  }
}[GenerativeComponentName]

export type GenerativeParseResult =
  { ok: true; payload: GenerativePayload } | { ok: false; reason: string; componentName: string }

/**
 * Kiểm tra một yêu cầu dựng giao diện do model sinh ra.
 *
 * Trả về `{ ok: false }` thay vì ném lỗi: giao diện phải render card dự phòng
 * chứ không được vỡ khi model trả về thứ lạ.
 */
export function parseGenerativePayload(
  componentName: string,
  props: unknown,
): GenerativeParseResult {
  if (!Object.prototype.hasOwnProperty.call(GENERATIVE_COMPONENTS, componentName)) {
    return {
      ok: false,
      componentName,
      reason: `Component "${componentName}" không có trong sổ đăng ký.`,
    }
  }

  const name = componentName as GenerativeComponentName
  const schema = GENERATIVE_COMPONENTS[name]
  const result = schema.safeParse(props)

  if (!result.success) {
    return {
      ok: false,
      componentName,
      reason: `Props không hợp lệ cho "${componentName}": ${result.error.issues[0]?.message ?? 'không rõ'}`,
    }
  }

  return {
    ok: true,
    payload: { component: name, props: result.data } as GenerativePayload,
  }
}

/* ---------------------------------------------------------------------------
 * Hậu kiểm đầu ra của model
 * ------------------------------------------------------------------------- */

export interface MealEstimateValidation {
  accepted: ParsedMealItem[]
  /** Mục bị loại vì trỏ tới `foodId` không có trong danh sách ứng viên. */
  rejectedHallucinatedIds: string[]
}

/**
 * Loại bỏ mục mà model bịa `foodId`.
 *
 * Đây là điểm chặn quan trọng nhất chống ảo giác: model chỉ được chọn trong danh
 * sách ứng viên đã đưa vào prompt. Bất kỳ id nào ngoài danh sách đều bị loại,
 * kể cả khi phần còn lại của mục trông hợp lý.
 */
export function validateMealEstimate(
  parsed: ParsedMeal,
  candidateFoodIds: readonly string[],
): MealEstimateValidation {
  const allowed = new Set(candidateFoodIds)
  const accepted: ParsedMealItem[] = []
  const rejectedHallucinatedIds: string[] = []

  for (const item of parsed.items) {
    if (item.foodId === null) {
      // Không khớp món nào: vẫn giữ để người dùng nhập tay, không tính là ảo giác.
      accepted.push(item)
      continue
    }
    if (allowed.has(item.foodId)) {
      accepted.push(item)
    } else {
      rejectedHallucinatedIds.push(item.foodId)
    }
  }

  return { accepted, rejectedHallucinatedIds }
}
