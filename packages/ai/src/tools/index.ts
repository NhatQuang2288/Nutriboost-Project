import type { MealType } from '@nutriboost/db'
import {
  type Goal,
  type SafetyAssessment,
  foodNameTokens,
  normalizeVi,
} from '@nutriboost/nutrition'
import { tool } from 'ai'
import { z } from 'zod'

import { type MealCatalogueEntry, type MealEstimator } from '../meal-estimator'
import { defaultMealBudget, findAvoidedSlugs, suggestMeals } from '../meal-suggester'
import { DEFAULT_MEALS_PER_DAY, buildPlan } from '../plan-builder'
import { GENERATIVE_COMPONENTS } from '../schemas'
import {
  buildWorkoutPlan,
  type WorkoutBlock,
  type WorkoutExerciseEntry,
  type WorkoutLevel,
} from '../workout-builder'

/**
 * Bộ công cụ của trợ lý Bơ.
 *
 * Ba nguyên tắc chi phối toàn bộ tệp này:
 *
 * 1. **Model không bao giờ sinh ra con số dinh dưỡng.**
 *    Với `log_meal`, model chỉ được cấp `foodId` và `grams`; calo, đạm, tinh bột, béo
 *    đều được tính lại từ danh mục ở đây. Model có bịa số cũng vô hiệu.
 *
 * 2. **Mọi đầu ra đều được kiểm tra bằng zod trước khi trả về.**
 *    Payload của tool chính là props của component generative UI. Nếu tool sinh ra
 *    payload sai, giao diện sẽ rơi về thẻ dự phòng — ta kiểm ngay tại nguồn để lỗi
 *    lộ ra ở test chứ không lộ ra trước mặt người dùng.
 *
 * 3. **Danh mục và dữ liệu người dùng được TIÊM VÀO, không truy vấn trực tiếp.**
 *    Nhờ vậy toàn bộ bộ tool kiểm thử được mà không cần CSDL hay khoá API.
 */

const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])

export interface AssistantTargets {
  bmrKcal: number
  tdeeKcal: number
  targetKcal: number
  proteinG: number
  carbG: number
  fatG: number
  floorsApplied: readonly string[]
}

export interface ProgressPoint {
  label: string
  value: number
}

export interface LoggedMealRequest {
  mealType: z.infer<typeof mealTypeSchema>
  rawInput: string | null
  items: {
    foodId: string
    displayName: string
    grams: number
    kcal: number
    proteinG: number
    carbG: number
    fatG: number
    /**
     * Ba chỉ số dưới đây có trong danh mục và trong `foods`, nhưng trước đây không được
     * chuyển tiếp khi ghi — nên mọi bữa ăn qua trợ lý đều hiện chất xơ và natri bằng 0.
     */
    fiberG?: number
    sugarG?: number
    sodiumMg?: number
  }[]
}

export interface LoggedMealResult {
  remainingKcal: number
}

export interface ToolContext {
  catalogue: readonly MealCatalogueEntry[]
  estimator: MealEstimator
  targets: AssistantTargets
  safety: SafetyAssessment
  /** Ngày hôm nay theo múi giờ người dùng, `YYYY-MM-DD`. */
  today: string
  /** Ghi nhật ký bữa ăn. Bỏ trống khi chưa nối CSDL. */
  logMeal?: (request: LoggedMealRequest) => Promise<LoggedMealResult>
  /** Đọc dữ liệu tiến độ. Bỏ trống khi chưa nối CSDL. */
  readProgress?: (days: number) => Promise<ProgressPoint[]>
  /** Số kcal còn lại hôm nay, đã tính sẵn. Dùng làm trần ngân sách khi gợi ý bữa. */
  remainingKcal?: number
  /** Hồ sơ tối thiểu để dựng lịch tập: mục tiêu và cân nặng (tính kcal đốt). */
  profile?: { goal: Goal; weightKg: number }
  /** Danh mục bài tập. Bỏ trống thì `generate_workout` từ chối, nói rõ lý do. */
  exercises?: readonly WorkoutExerciseEntry[]
}

/** Tên component generative UI mà mỗi tool dựng ra. */
export const TOOL_TO_COMPONENT = {
  search_food: 'food_candidate_chips',
  estimate_meal: 'meal_confirm_card',
  log_meal: 'meal_logged_receipt',
  compute_targets: 'target_summary_card',
  get_progress: 'progress_chart_card',
  generate_plan: 'plan_preview_week',
  generate_workout: 'workout_preview_week',
  suggest_meals: 'meal_suggestions_card',
  lookup_food: 'nutrition_facts_card',
  show_safety_notice: 'safety_notice_card',
  ask_user_choice: 'choice_chips',
} as const

export type AssistantToolName = keyof typeof TOOL_TO_COMPONENT

export const ASSISTANT_TOOL_NAMES = Object.keys(TOOL_TO_COMPONENT) as AssistantToolName[]

/**
 * Kết quả khi công cụ không làm được việc được yêu cầu.
 *
 * Trả về chứ KHÔNG ném lỗi, và đây là chủ ý. AI SDK che nội dung lỗi trước khi nó tới
 * model, nên model không biết vì sao công cụ hỏng và sẽ tự bịa ra lý do. Đã xảy ra
 * thật: khi chưa nối cơ sở dữ liệu, Bơ nói với người dùng "lỗi hệ thống tạm thời,
 * bạn thử lại sau" — trong khi thử lại bao nhiêu lần cũng không được.
 *
 * Vì vậy: `message` phải nói thẳng sự thật, và model đọc được nguyên văn để nói lại.
 */
export interface ToolRefusal {
  refused: true
  /** Lý do nói thẳng cho model, kèm chỉ dẫn phải nói gì với người dùng. */
  message: string
}

/** Dựng kết quả từ chối. Không dùng cho lỗi lập trình — chỗ đó cứ để ném. */
export function toolRefusal(message: string): ToolRefusal {
  return { refused: true, message }
}

/** Phân biệt kết quả từ chối với payload giao diện. */
export function isToolRefusal(value: unknown): value is ToolRefusal {
  return (
    typeof value === 'object' && value !== null && (value as { refused?: unknown }).refused === true
  )
}

const WEEKDAY_LABELS_VI = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
] as const

/** Nhãn thứ trong tuần từ chuỗi `YYYY-MM-DD`, không phụ thuộc múi giờ máy chạy. */
export function weekdayLabelVi(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return WEEKDAY_LABELS_VI[index] ?? isoDate
}

export function createAssistantTools(context: ToolContext) {
  const bySlug = new Map(context.catalogue.map((entry) => [entry.slug, entry]))

  return {
    /* ---------------------------------------------------------------------
     * Tra món — dùng khi chưa chắc người dùng muốn món nào
     * ------------------------------------------------------------------- */
    search_food: tool({
      description:
        'Tra món trong danh mục theo tên người dùng nói. Dùng khi câu nói chưa đủ rõ để chọn một món.',
      inputSchema: z.object({
        query: z.string().min(1).max(120).describe('Tên món hoặc cụm từ người dùng vừa nói'),
        limit: z.number().int().min(1).max(8).optional(),
      }),
      execute: async ({ query, limit }) => {
        const found = context.estimator.suggest(query, limit ?? 5)

        return GENERATIVE_COMPONENTS.food_candidate_chips.parse({
          candidates: found.map((entry) => ({
            foodId: entry.slug,
            nameVi: entry.nameVi,
            servingName: null,
            servingGrams: entry.servingGrams ?? null,
            kcalPer100g: entry.kcalPer100g,
          })),
          promptText:
            found.length === 0
              ? 'Mình chưa tìm thấy món nào khớp trong danh mục.'
              : 'Bạn chọn món nào?',
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Hiểu bữa ăn — dựng thẻ để người dùng duyệt
     * ------------------------------------------------------------------- */
    estimate_meal: tool({
      description:
        'Đọc câu người dùng kể về bữa ăn và dựng thẻ xác nhận. Luôn gọi công cụ này trước khi ghi nhật ký.',
      inputSchema: z.object({
        text: z.string().min(1).max(500).describe('Nguyên văn câu người dùng nói'),
      }),
      execute: async ({ text }) => {
        const estimate = context.estimator.estimate(text)

        return GENERATIVE_COMPONENTS.meal_confirm_card.parse({
          title: 'Mình hiểu bữa ăn như sau',
          rawInput: text,
          items: estimate.items.map((item) => ({
            foodId: item.foodId,
            displayName: item.displayName,
            grams: item.grams,
            kcal: item.nutrients.kcal,
            proteinG: item.nutrients.proteinG,
            carbG: item.nutrients.carbG,
            fatG: item.nutrients.fatG,
            confidence: item.confidence,
          })),
          total: {
            kcal: estimate.total.kcal,
            proteinG: estimate.total.proteinG,
            carbG: estimate.total.carbG,
            fatG: estimate.total.fatG,
          },
          needsConfirmation: estimate.needsConfirmation,
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Ghi nhật ký — model chỉ cấp id món và gram
     * ------------------------------------------------------------------- */
    log_meal: tool({
      description:
        'Ghi một bữa vào nhật ký. Chỉ gọi sau khi người dùng đã xác nhận thẻ bữa ăn. ' +
        'Chỉ truyền id món và số gram; KHÔNG truyền calo hay đa lượng.',
      inputSchema: z.object({
        mealType: mealTypeSchema,
        rawInput: z.string().max(500).optional(),
        items: z
          .array(
            z.object({
              foodId: z.string().min(1).max(64).describe('Slug hoặc UUID của món trong danh mục'),
              grams: z.number().min(1).max(3000),
            }),
          )
          .min(1)
          .max(20),
      }),
      execute: async ({ mealType, rawInput, items }) => {
        /*
         * Tính dinh dưỡng từ danh mục. Đây là điểm chặn model bịa con số.
         *
         * Món không có trong danh mục thì TỪ CHỐI chứ không ném: model cần đọc được lý
         * do để gọi lại `search_food` và tự sửa, thay vì nhận một lỗi đã bị che.
         */
        const unknown = items.filter((item) => !bySlug.has(item.foodId))
        if (unknown.length > 0) {
          return toolRefusal(
            `CHƯA ghi được: không có món nào tên ${unknown
              .map((item) => `"${item.foodId}"`)
              .join(', ')} trong danh mục. Hãy gọi search_food để tìm đúng món rồi thử lại. ` +
              'Đừng nói với người dùng là đã ghi.',
          )
        }

        const resolved = items.map((item) => {
          const food = bySlug.get(item.foodId)!
          const factor = item.grams / 100
          return {
            foodId: food.slug,
            displayName: food.nameVi,
            grams: item.grams,
            kcal: Math.round(food.kcalPer100g * factor),
            proteinG: round1(food.proteinG * factor),
            carbG: round1(food.carbG * factor),
            fatG: round1(food.fatG * factor),
            fiberG: round1((food.fiberG ?? 0) * factor),
            sugarG: round1((food.sugarG ?? 0) * factor),
            sodiumMg: Math.round((food.sodiumMg ?? 0) * factor),
          }
        })

        const totalKcal = resolved.reduce((sum, item) => sum + item.kcal, 0)

        if (context.logMeal === undefined) {
          return toolRefusal(
            'CHƯA ghi được: bản này chưa nối cơ sở dữ liệu nên tính năng ghi nhật ký ' +
              'chưa hoạt động. Bữa ăn CHƯA được lưu. Hãy nói thật với người dùng là chưa ' +
              'lưu được, và đừng bảo họ thử lại sau vì thử lại cũng không được.',
          )
        }

        /*
         * Bọc trong `try` vì tầng ứng dụng có thể ném lỗi khi ghi (mất mạng, RLS từ chối,
         * CSDL đầy). Không bọc thì lỗi đó bị AI SDK che và model tự bịa ra lý do — đúng lỗi
         * đã xảy ra một lần: Bơ nói "lỗi hệ thống tạm thời, bạn thử lại sau" trong khi thử
         * lại bao nhiêu lần cũng không được.
         */
        let result: LoggedMealResult
        try {
          result = await context.logMeal({
            mealType,
            rawInput: rawInput ?? null,
            items: resolved,
          })
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error)
          return toolRefusal(
            `CHƯA ghi được: cơ sở dữ liệu từ chối khi lưu bữa ăn (${detail}). ` +
              'Bữa ăn CHƯA được lưu. Hãy nói thật với người dùng là chưa lưu được.',
          )
        }

        return GENERATIVE_COMPONENTS.meal_logged_receipt.parse({
          mealType,
          total: {
            kcal: totalKcal,
            proteinG: round1(resolved.reduce((sum, item) => sum + item.proteinG, 0)),
            carbG: round1(resolved.reduce((sum, item) => sum + item.carbG, 0)),
            fatG: round1(resolved.reduce((sum, item) => sum + item.fatG, 0)),
          },
          remainingKcal: result.remainingKcal,
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Mục tiêu năng lượng — chỉ đọc số đã tính sẵn
     * ------------------------------------------------------------------- */
    compute_targets: tool({
      description:
        'Lấy mục tiêu năng lượng và đa lượng đã tính sẵn của người dùng. ' +
        'Dùng khi người dùng hỏi vì sao mục tiêu là như vậy. KHÔNG tự tính lại.',
      inputSchema: z.object({}),
      execute: async () => {
        const { bmrKcal, tdeeKcal, targetKcal, proteinG, carbG, fatG, floorsApplied } =
          context.targets

        return GENERATIVE_COMPONENTS.target_summary_card.parse({
          bmrKcal,
          tdeeKcal,
          targetKcal,
          macros: { kcal: targetKcal, proteinG, carbG, fatG },
          explanation: explainTargets(floorsApplied),
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Tiến độ
     * ------------------------------------------------------------------- */
    get_progress: tool({
      description: 'Lấy dữ liệu tiến độ theo ngày để vẽ biểu đồ. Không tự bịa số liệu.',
      inputSchema: z.object({
        days: z.number().int().min(7).max(90).optional(),
      }),
      execute: async ({ days }) => {
        const range = days ?? 7
        const points = context.readProgress === undefined ? [] : await context.readProgress(range)
        const values = points.map((point) => point.value)
        const first = values[0]
        const last = values[values.length - 1]

        return GENERATIVE_COMPONENTS.progress_chart_card.parse({
          rangeLabel: `${range} ngày gần nhất`,
          points,
          unit: 'kcal',
          trendLabel:
            first === undefined || last === undefined
              ? 'Chưa đủ dữ liệu để nói xu hướng'
              : last >= first
                ? 'Xu hướng tăng so với đầu kỳ'
                : 'Xu hướng giảm so với đầu kỳ',
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Thực đơn — dựng tất định, model chỉ chọn tham số
     * ------------------------------------------------------------------- */
    generate_plan: tool({
      description:
        'Dựng thực đơn 1–7 ngày khớp mục tiêu kcal và đạm của người dùng. ' +
        'Dùng khi người dùng xin thực đơn, kế hoạch ăn, "tuần này ăn gì". ' +
        'Món và calo được tính bằng code; bạn chỉ chọn số ngày, các bữa và món cần tránh.',
      inputSchema: planInputSchema,
      execute: async (input) => buildPlanCard(context, input),
    }),

    /* ---------------------------------------------------------------------
     * Lịch tập — dựng tất định từ danh mục bài tập có MET
     * ------------------------------------------------------------------- */
    generate_workout: tool({
      description:
        'Dựng lịch tập tuần theo mục tiêu của người dùng, kèm kcal đốt ước tính (theo MET). ' +
        'Dùng khi người dùng xin lịch tập, bài tập, "tập gì để giảm mỡ". Nếu người dùng chưa nói ' +
        'số buổi, thời lượng hay dụng cụ thì cứ dùng mặc định và nói rõ là có thể chỉnh.',
      inputSchema: workoutInputSchema,
      execute: async (input) => buildWorkoutCard(context, input),
    }),

    /* ---------------------------------------------------------------------
     * Gợi ý món cho một bữa — "tối nay ăn gì?"
     * ------------------------------------------------------------------- */
    suggest_meals: tool({
      description:
        'Gợi ý 1–5 món cho MỘT bữa, vừa ngân sách kcal còn lại của người dùng và ưu tiên món giàu đạm. ' +
        'Dùng khi người dùng hỏi "ăn gì", "gợi ý bữa tối", "bữa nhẹ". Bỏ trống `budgetKcal` để hệ ' +
        'thống tự tính theo số kcal còn lại; chỉ đặt khi người dùng nói rõ ("dưới 400 kcal", "nhẹ").',
      inputSchema: suggestInputSchema,
      execute: async (input) => buildMealSuggestionsCard(context, input),
    }),

    /* ---------------------------------------------------------------------
     * Tra dinh dưỡng một món — "phở bao nhiêu calo?"
     * ------------------------------------------------------------------- */
    lookup_food: tool({
      description:
        'Tra calo và đa lượng của MỘT món cho một khẩu phần (hoặc số gram cho trước). ' +
        'Dùng khi người dùng hỏi "X bao nhiêu calo", "X có nhiều đạm không" mà KHÔNG kể là đã ăn. ' +
        'Đã ăn rồi thì dùng estimate_meal.',
      inputSchema: lookupInputSchema,
      execute: async (input) => buildNutritionFactsCard(context, input),
    }),

    /* ---------------------------------------------------------------------
     * Cảnh báo an toàn — chỉ dựng khi thật sự có điều cần nói
     * ------------------------------------------------------------------- */
    show_safety_notice: tool({
      description:
        'Hiện thẻ cảnh báo an toàn từ hồ sơ sức khoẻ đã đánh giá. ' +
        'Chỉ gọi khi hồ sơ có điểm cần lưu ý; nếu không có gì, công cụ sẽ từ chối.',
      inputSchema: z.object({}),
      execute: async () => {
        if (context.safety.level === 'ok' || context.safety.reasons.length === 0) {
          return toolRefusal(
            'Không có gì để cảnh báo: hồ sơ này không có điểm nào cần lưu ý. ' +
              'Hãy trả lời bình thường, đừng nhắc tới cảnh báo an toàn.',
          )
        }

        return GENERATIVE_COMPONENTS.safety_notice_card.parse({
          severity: context.safety.level,
          reasons: [...context.safety.reasons],
        })
      },
    }),

    /* ---------------------------------------------------------------------
     * Hỏi lựa chọn — tool phía CLIENT, không có `execute`
     *
     * Model dựng câu hỏi và các lựa chọn; giao diện hiển thị chip và gọi
     * `addToolOutput` khi người dùng chọn. Không có `execute` nên AI SDK
     * tự hiểu đây là tool phía client.
     * ------------------------------------------------------------------- */
    ask_user_choice: tool({
      description:
        'Hỏi người dùng chọn một trong vài phương án, thay vì đoán. ' +
        'Dùng khi câu trả lời phụ thuộc vào sở thích mà bạn không thể suy ra.',
      inputSchema: z.object({
        question: z.string().min(1).max(160),
        options: z
          .array(
            z.object({
              value: z.string().min(1).max(60),
              label: z.string().min(1).max(60),
            }),
          )
          .min(2)
          .max(6),
      }),
    }),
  }
}

export type AssistantTools = ReturnType<typeof createAssistantTools>

/* ===========================================================================
 * Dựng thẻ — hàm thuần, dùng chung cho công cụ và cho đường dự phòng không có AI
 *
 * Tách ra khỏi `execute` để route chat gọi thẳng được khi DeepSeek không trả lời: người dùng
 * xin thực đơn thì vẫn phải nhận thực đơn, dù model có hỏng.
 * ========================================================================= */

export const planInputSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Ngày bắt đầu, `YYYY-MM-DD`. Mặc định là hôm nay'),
  days: z.number().int().min(1).max(7).optional().describe('Số ngày, mặc định 7'),
  meals: z
    .array(mealTypeSchema)
    .min(1)
    .max(4)
    .optional()
    .describe('Các bữa mỗi ngày. Mặc định sáng, trưa, tối, phụ'),
  avoid: z
    .array(z.string().min(1).max(40))
    .max(10)
    .optional()
    .describe('Món, nguyên liệu hoặc nhóm cần tránh, ví dụ "hải sản", "thịt bò", "đồ chiên"'),
})

export type PlanToolInput = z.infer<typeof planInputSchema>

export function buildPlanCard(context: ToolContext, input: PlanToolInput) {
  const excluded = findAvoidedSlugs(context.catalogue, input.avoid ?? [])
  const plan = buildPlan({
    weekStart: input.weekStart ?? context.today,
    targets: context.targets,
    catalogue: context.catalogue,
    mealsPerDay: input.meals ?? DEFAULT_MEALS_PER_DAY,
    excludedSlugs: [...excluded],
    days: input.days ?? 7,
  })

  const notes = [...plan.notes]
  if (excluded.size > 0) {
    notes.unshift(`Đã bỏ ${excluded.size} món trùng với yêu cầu tránh của bạn.`)
  }

  return GENERATIVE_COMPONENTS.plan_preview_week.parse({
    weekStart: plan.weekStart,
    targetKcal: context.targets.targetKcal,
    days: plan.days.map((day) => ({
      dayLabel: weekdayLabelVi(day.date),
      totalKcal: day.totalKcal,
      meals: day.meals.flatMap((meal) =>
        meal.items.map((item) => ({
          mealType: meal.mealType,
          displayName: item.nameVi,
          kcal: item.kcal,
        })),
      ),
    })),
    notes: notes.slice(0, 6),
  })
}

const LEVEL_LABELS: Readonly<Record<WorkoutLevel, string>> = {
  beginner: 'Người mới tập',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
}

export const workoutInputSchema = z.object({
  daysPerWeek: z.number().int().min(2).max(6).optional().describe('Số buổi mỗi tuần, mặc định 3'),
  sessionMinutes: z
    .number()
    .int()
    .min(15)
    .max(120)
    .optional()
    .describe('Thời lượng mỗi buổi, phút. Mặc định 45'),
  level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Trình độ. Mặc định người mới tập'),
  equipment: z
    .array(z.enum(['dumbbell', 'barbell', 'machine', 'band', 'cardio_machine']))
    .max(5)
    .optional()
    .describe('Dụng cụ có sẵn. Bỏ trống = chỉ tập với trọng lượng cơ thể, tại nhà'),
  injuries: z
    .array(z.enum(['knee', 'lower_back', 'shoulder', 'wrist', 'ankle']))
    .max(5)
    .optional()
    .describe('Vùng đang đau hoặc chấn thương cần tránh'),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export type WorkoutToolInput = z.infer<typeof workoutInputSchema>

export function buildWorkoutCard(context: ToolContext, input: WorkoutToolInput) {
  if (context.exercises === undefined || context.exercises.length === 0) {
    return toolRefusal(
      'CHƯA dựng được lịch tập: bản này chưa nạp danh mục bài tập. Hãy nói thật với người dùng ' +
        'và gợi ý họ mở màn Lịch tập. Đừng tự liệt kê bài tập kèm số calo.',
    )
  }
  if (context.profile === undefined) {
    return toolRefusal(
      'CHƯA dựng được lịch tập: chưa có cân nặng và mục tiêu của người dùng nên không tính được ' +
        'kcal đốt. Hãy mời người dùng hoàn tất hồ sơ trước.',
    )
  }

  const level = input.level ?? 'beginner'
  const plan = buildWorkoutPlan({
    weekStart: input.weekStart ?? context.today,
    goal: context.profile.goal,
    level,
    daysPerWeek: input.daysPerWeek ?? 3,
    sessionMinutes: input.sessionMinutes ?? 45,
    weightKg: context.profile.weightKg,
    equipment: input.equipment ?? [],
    injuries: input.injuries ?? [],
    exercises: context.exercises,
  })

  if (plan.sessions.length === 0) {
    return toolRefusal(
      `CHƯA dựng được lịch tập: ${plan.notes.join(' ')} Hãy nói lại đúng lý do này với người dùng.`,
    )
  }

  return GENERATIVE_COMPONENTS.workout_preview_week.parse({
    weekStart: plan.weekStart,
    levelLabel: LEVEL_LABELS[level],
    sessions: plan.sessions.map((session) => ({
      dayLabel: weekdayLabelVi(session.date),
      focus: session.focus,
      totalMinutes: session.totalMinutes,
      estimatedKcal: session.estimatedKcal,
      blocks: session.blocks.slice(0, 12).map((block) => ({
        nameVi: block.nameVi,
        dose: describeDose(block),
      })),
    })),
    weeklyKcal: plan.weeklyKcal,
    weeklyMinutes: plan.weeklyMinutes,
    notes: plan.notes.slice(0, 6),
  })
}

/** Chuỗi liều tập để hiển thị: `3 × 12–15`, `3 × 40 giây`, `2 phút`. */
export function describeDose(block: WorkoutBlock): string {
  if (block.sets <= 1 && block.seconds !== null) {
    return block.seconds % 60 === 0 ? `${block.seconds / 60} phút` : `${block.seconds} giây`
  }
  if (block.reps !== null) return `${block.sets} × ${block.reps}`
  if (block.seconds !== null) return `${block.sets} × ${block.seconds} giây`
  return `${block.sets} hiệp`
}

export const suggestInputSchema = z.object({
  mealType: mealTypeSchema.describe('Bữa cần gợi ý'),
  budgetKcal: z
    .number()
    .int()
    .min(100)
    .max(1500)
    .optional()
    .describe('Ngân sách kcal cho bữa. Bỏ trống để hệ thống tự tính theo số kcal còn lại'),
  count: z.number().int().min(1).max(5).optional(),
  avoid: z.array(z.string().min(1).max(40)).max(10).optional(),
})

export type SuggestToolInput = z.infer<typeof suggestInputSchema>

export function buildMealSuggestionsCard(context: ToolContext, input: SuggestToolInput) {
  const mealType: MealType = input.mealType
  const budgetKcal =
    input.budgetKcal ??
    defaultMealBudget(mealType, context.targets.targetKcal, context.remainingKcal ?? null)

  const { options, excludedCount } = suggestMeals({
    catalogue: context.catalogue,
    mealType,
    budgetKcal,
    count: input.count ?? 3,
    avoid: input.avoid ?? [],
    seed: `${context.today}:${mealType}`,
  })

  const notes: string[] = []
  if (excludedCount > 0) notes.push(`Đã bỏ ${excludedCount} món trùng với yêu cầu tránh.`)
  if (options.length === 0) notes.push('Không có món nào trong danh mục vừa ngân sách này.')
  if (context.remainingKcal !== undefined && context.remainingKcal < 150) {
    notes.push('Hôm nay bạn đã gần chạm mục tiêu, nên chọn món nhẹ và nhiều rau.')
  }

  return GENERATIVE_COMPONENTS.meal_suggestions_card.parse({
    mealType,
    budgetKcal,
    options: options.map((item) => ({
      foodId: item.slug,
      displayName: item.nameVi,
      grams: item.grams,
      kcal: item.kcal,
      proteinG: item.proteinG,
      carbG: item.carbG,
      fatG: item.fatG,
    })),
    note: notes.length === 0 ? null : notes.join(' '),
  })
}

export const lookupInputSchema = z.object({
  query: z.string().min(1).max(120).describe('Tên món, ví dụ "phở bò", "bánh mì thịt"'),
  grams: z
    .number()
    .min(1)
    .max(3000)
    .optional()
    .describe('Số gram nếu người dùng nói rõ; bỏ trống để dùng một khẩu phần chuẩn'),
})

export type LookupToolInput = z.infer<typeof lookupInputSchema>

export function buildNutritionFactsCard(context: ToolContext, input: LookupToolInput) {
  const [food] = context.estimator.suggest(input.query, 1)
  if (food === undefined) {
    return toolRefusal(
      `Không tìm thấy món nào khớp "${input.query}" trong danh mục. Hãy nói thật là danh mục ` +
        'chưa có món này và KHÔNG tự đưa ra con số calo.',
    )
  }

  /*
   * Tra gần đúng luôn trả về MỘT món nào đó — "trà sữa" ra "Sữa chua trái cây". Trả thẻ đó thì
   * Bơ khẳng định sai một con số calo. Nên chỉ nhận khi mọi từ trong câu hỏi có mặt trong tên.
   */
  if (!namesContainAllTokens(input.query, food)) {
    return toolRefusal(
      `Danh mục chưa có đúng món "${input.query}"; món gần nhất là "${food.nameVi}" nhưng đó là ` +
        'món khác. Hãy nói thật là chưa có số liệu cho món này, có thể hỏi người dùng có phải ' +
        `ý họ là "${food.nameVi}" không. KHÔNG tự đưa ra con số calo.`,
    )
  }

  const grams = Math.round(input.grams ?? food.servingGrams ?? 100)
  const factor = grams / 100
  const portionLabel =
    input.grams === undefined && food.servingGrams !== undefined
      ? `1 khẩu phần (${grams} g)`
      : `${grams} g`

  return GENERATIVE_COMPONENTS.nutrition_facts_card.parse({
    foodId: food.slug,
    nameVi: food.nameVi,
    grams,
    portionLabel,
    kcal: Math.round(food.kcalPer100g * factor),
    proteinG: round1(food.proteinG * factor),
    carbG: round1(food.carbG * factor),
    fatG: round1(food.fatG * factor),
    fiberG: round1((food.fiberG ?? 0) * factor),
    sodiumMg: Math.round((food.sodiumMg ?? 0) * factor),
  })
}

/** Mọi từ tên món (đã chuẩn hoá) trong câu hỏi đều có trong tên hoặc bí danh của món. */
function namesContainAllTokens(query: string, food: MealCatalogueEntry): boolean {
  // Bỏ số lượng và đơn vị ("1 tô phở" → "phở") trước khi so, giống bộ ước lượng bữa ăn.
  const tokens = foodNameTokens(query)
  if (tokens.length === 0) return false
  return [food.nameVi, ...(food.aliases ?? [])].some((name) => {
    const nameTokens = new Set(normalizeVi(name).split(' '))
    return tokens.every((token) => nameTokens.has(token))
  })
}

/** Câu giải thích vì sao mục tiêu bị điều chỉnh, dùng cho thẻ mục tiêu. */
function explainTargets(floorsApplied: readonly string[]): string {
  if (floorsApplied.length === 0) {
    return 'Mục tiêu tính bằng phương trình Mifflin–St Jeor từ hồ sơ của bạn, không có điều chỉnh an toàn nào.'
  }
  return `Mục tiêu đã được điều chỉnh để an toàn: ${floorsApplied.join(', ')}.`
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
