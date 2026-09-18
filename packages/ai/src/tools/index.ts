import { type SafetyAssessment } from '@nutriboost/nutrition'
import { tool } from 'ai'
import { z } from 'zod'

import { type MealCatalogueEntry, type MealEstimator } from '../meal-estimator'
import { buildPlan } from '../plan-builder'
import { GENERATIVE_COMPONENTS } from '../schemas'

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
}

/** Tên component generative UI mà mỗi tool dựng ra. */
export const TOOL_TO_COMPONENT = {
  search_food: 'food_candidate_chips',
  estimate_meal: 'meal_confirm_card',
  log_meal: 'meal_logged_receipt',
  compute_targets: 'target_summary_card',
  get_progress: 'progress_chart_card',
  generate_plan: 'plan_preview_week',
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

        const result = await context.logMeal({
          mealType,
          rawInput: rawInput ?? null,
          items: resolved,
        })

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
     * Kế hoạch tuần — dựng tất định, không cần model
     * ------------------------------------------------------------------- */
    generate_plan: tool({
      description:
        'Dựng thực đơn 7 ngày từ danh mục và mục tiêu năng lượng. ' +
        'Kế hoạch được tính bằng code, không phải do model tự nghĩ ra.',
      inputSchema: z.object({
        weekStart: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('Ngày bắt đầu tuần, mặc định là hôm nay'),
      }),
      execute: async ({ weekStart }) => {
        const plan = buildPlan({
          weekStart: weekStart ?? context.today,
          targets: context.targets,
          catalogue: context.catalogue,
        })

        return GENERATIVE_COMPONENTS.plan_preview_week.parse({
          weekStart: plan.weekStart,
          days: plan.days.map((day) => ({
            dayLabel: weekdayLabelVi(day.date),
            meals: day.meals.flatMap((meal) =>
              meal.items.map((item) => ({
                mealType: meal.mealType,
                displayName: item.nameVi,
                kcal: item.kcal,
              })),
            ),
          })),
        })
      },
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
