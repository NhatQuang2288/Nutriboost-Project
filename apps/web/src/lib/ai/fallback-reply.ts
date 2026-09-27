import {
  ASSISTANT,
  GENERATIVE_COMPONENTS,
  buildMealSuggestionsCard,
  buildPlanCard,
  buildWorkoutCard,
  detectChatIntent,
  isToolRefusal,
  type DataPart,
  type MealEstimate,
  type ToolContext,
} from '@nutriboost/ai'

import { mealTypeForHour } from './meal-time'

/**
 * Câu trả lời của đường tất định — khi không có model (chưa có khoá, hết lượt, DeepSeek lỗi).
 *
 * Trước đây đường này chỉ biết ước lượng bữa ăn, nên mọi câu khác đều nhận "Mình chưa nhận ra
 * món nào". Nay nó hiểu thêm bốn ý định phổ biến và dựng đúng thẻ bằng CHÍNH các hàm mà công cụ
 * của model dùng — nên thực đơn ở đường này và đường AI là một.
 */

export interface FallbackReply {
  text: string
  dataParts: DataPart[]
  suggestions: string[]
}

export interface FallbackInput {
  userText: string
  estimate: MealEstimate
  remainingKcal: number
  /** Giờ địa phương 0–23, để đoán bữa khi người dùng không nói rõ. */
  localHour: number
  tools: ToolContext
}

const DEFAULT_SUGGESTIONS = ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?']

export function buildFallbackReply(input: FallbackInput): FallbackReply {
  const intent = detectChatIntent(input.userText)
  const tail = ASSISTANT.signature

  if (intent.kind === 'workout') {
    const card = buildWorkoutCard(input.tools, {})
    if (!isToolRefusal(card)) {
      return {
        text:
          `Đây là lịch tập ${card.sessions.length} buổi/tuần tại nhà cho người mới, ` +
          `đốt khoảng **${card.weeklyKcal} kcal** mỗi tuần. Bạn muốn đổi số buổi, thời lượng ` +
          `hay thêm dụng cụ thì nói mình nhé. ${tail}`,
        dataParts: [{ name: 'workout_preview_week', data: card }],
        suggestions: ['Mình có tạ đơn', 'Mỗi buổi chỉ 30 phút', 'Mình hay đau gối'],
      }
    }
  }

  if (intent.kind === 'plan') {
    const card = buildPlanCard(input.tools, { days: intent.days })
    return {
      text:
        `Mình dựng thực đơn ${intent.days === 1 ? 'một ngày' : `${card.days.length} ngày`} ` +
        `quanh mục tiêu **${input.tools.targets.targetKcal} kcal**/ngày. Đây là bản đề xuất, ` +
        `chưa lưu vào kế hoạch của bạn. ${tail}`,
      dataParts: [{ name: 'plan_preview_week', data: card }],
      suggestions: ['Thực đơn không có hải sản', 'Gợi ý bữa tối nhẹ'],
    }
  }

  if (intent.kind === 'suggest') {
    const mealType = intent.mealType ?? mealTypeForHour(input.localHour)
    const card = buildMealSuggestionsCard(input.tools, {
      mealType,
      ...(intent.light ? { budgetKcal: Math.min(400, Math.max(150, input.remainingKcal)) } : {}),
    })
    return {
      text:
        card.options.length === 0
          ? `Mình chưa tìm được món vừa **${card.budgetKcal} kcal** trong danh mục. ${tail}`
          : `Với khoảng **${card.budgetKcal} kcal** cho bữa này, bạn thử một trong mấy món dưới ` +
            `đây — mình ưu tiên món nhiều đạm. ${tail}`,
      dataParts: [{ name: 'meal_suggestions_card', data: card }],
      suggestions: ['Lên thực đơn cả tuần', 'Hôm nay mình còn bao nhiêu calo?'],
    }
  }

  if (intent.kind === 'targets') {
    const { bmrKcal, tdeeKcal, targetKcal, proteinG, carbG, fatG } = input.tools.targets
    const card = GENERATIVE_COMPONENTS.target_summary_card.parse({
      bmrKcal,
      tdeeKcal,
      targetKcal,
      macros: { kcal: targetKcal, proteinG, carbG, fatG },
      explanation:
        'BMR là năng lượng cơ thể cần khi nghỉ; TDEE cộng thêm phần vận động; mục tiêu điều chỉnh theo việc bạn muốn giảm, giữ hay tăng cân.',
    })
    return {
      text: `Mục tiêu của bạn là **${targetKcal} kcal** mỗi ngày, suy ra từ hồ sơ như thẻ dưới. ${tail}`,
      dataParts: [{ name: 'target_summary_card', data: card }],
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  return mealEstimateReply(input)
}

/** Nhánh cũ: đọc câu kể bữa ăn và dựng thẻ xác nhận. */
function mealEstimateReply(input: FallbackInput): FallbackReply {
  const { estimate, userText } = input
  const matched = estimate.items.filter((item) => item.foodId !== null)

  const dataParts: DataPart[] =
    matched.length > 0
      ? [
          {
            name: 'meal_confirm_card',
            data: {
              title: 'Mình hiểu bữa ăn như sau',
              rawInput: userText,
              items: estimate.items.map((item) => ({
                foodId: null,
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
            },
          },
        ]
      : []

  const missing = estimate.unmatched
  const text = [
    matched.length > 0
      ? `Mình nhận ra ${matched.length} món, tổng khoảng ${estimate.total.kcal} kcal.`
      : 'Mình chưa nhận ra món nào trong câu này. Bạn có thể kể bữa ăn, xin thực đơn, lịch tập hoặc hỏi "tối nay ăn gì".',
    missing.length > 0
      ? `Còn ${missing.length} phần mình chưa chắc: ${missing.join(', ')}. Bạn chỉnh lại giúp mình nhé.`
      : '',
    `Hôm nay bạn còn ${input.remainingKcal} kcal.`,
    ASSISTANT.signature,
  ]
    .filter((line) => line.length > 0)
    .join(' ')

  return { text, dataParts, suggestions: DEFAULT_SUGGESTIONS }
}
