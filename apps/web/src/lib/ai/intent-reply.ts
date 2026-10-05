import {
  ASSISTANT,
  type ChatIntent,
  type MealCatalogueEntry,
  type SuggestGoal,
  buildDishDetail,
  mealBudgetKcal,
  resolveSuggestGoal,
  suggestMeals,
  toDishDetailCard,
  toSuggestionCard,
} from '@nutriboost/ai'
import type { SafetyAssessment } from '@nutriboost/nutrition'

/**
 * Câu trả lời tất định cho những ý định không phải "kể bữa ăn".
 *
 * Dùng ở đường dự phòng của route chat (chưa có khoá AI, hết hạn mức, model hỏng). Trước đây đường
 * đó coi mọi câu là một bữa ăn, nên hỏi "đề xuất món gì" nhận về "mình chưa nhận ra món nào".
 * Mọi con số ở đây do code tính — không có model — nên đúng ngay cả khi mất mạng.
 */

export interface IntentReplyContext {
  catalogue: readonly MealCatalogueEntry[]
  goal: SuggestGoal
  safety: Pick<SafetyAssessment, 'blockWeightLoss'>
  targetKcal: number
  consumedKcal: number
  remainingKcal: number
}

export interface IntentReply {
  text: string
  dataParts: { name: string; data: unknown }[]
  suggestions: string[]
}

const GOAL_LABEL: Readonly<Record<SuggestGoal, string>> = {
  lose: 'giảm cân',
  maintain: 'giữ cân',
  gain: 'tăng cân',
}

function finish(text: string): string {
  return `${text} ${ASSISTANT.signature}`
}

export function buildIntentReply(
  intent: ChatIntent,
  context: IntentReplyContext,
): IntentReply | null {
  if (intent.kind === 'remaining') {
    const { targetKcal, consumedKcal, remainingKcal } = context
    const text =
      remainingKcal >= 0
        ? `Hôm nay bạn còn ${remainingKcal} kcal (mục tiêu ${targetKcal} kcal, đã nạp ${consumedKcal} kcal).`
        : `Hôm nay bạn đã vượt mục tiêu ${-remainingKcal} kcal (mục tiêu ${targetKcal} kcal, đã nạp ${consumedKcal} kcal).`
    return {
      text: finish(text),
      dataParts: [],
      suggestions: ['Gợi ý bữa tối nhẹ', 'Gợi ý món nhiều đạm'],
    }
  }

  if (intent.kind === 'suggest') {
    const resolved = resolveSuggestGoal(intent.goal ?? context.goal, context.safety)
    const result = suggestMeals({
      catalogue: context.catalogue,
      goal: resolved.goal,
      budgetKcal: mealBudgetKcal({
        remainingKcal: context.remainingKcal,
        targetKcal: context.targetKcal,
        ...(intent.mealType === undefined ? {} : { mealType: intent.mealType }),
      }),
      filters: intent.filters,
    })

    const card = toSuggestionCard(
      resolved.goal,
      result,
      resolved.note === null ? [] : [resolved.note],
    )
    const text =
      result.suggestions.length > 0
        ? `Mình gợi ý ${result.suggestions.length} món vừa khoảng ${result.budgetKcal} kcal cho mục tiêu ${GOAL_LABEL[resolved.goal]}. ` +
          'Khẩu phần chỉ để tham khảo: bạn nói khối lượng thật, mình tính lại cho chính xác.'
        : (result.notes[result.notes.length - 1] ?? 'Mình chưa có món nào phù hợp.')

    return {
      text: finish(text),
      dataParts: [{ name: 'meal_suggestion_card', data: card }],
      suggestions: ['Gợi ý món nhiều đạm', 'Gợi ý món chay'],
    }
  }

  if (intent.kind === 'detail') {
    const entry = context.catalogue.find((item) => item.slug === intent.slug)
    if (entry === undefined) return null

    const result = buildDishDetail(entry, context.catalogue, {
      ...(intent.grams === undefined ? {} : { grams: intent.grams }),
    })
    if (!result.ok) {
      return { text: finish(result.reason), dataParts: [], suggestions: ['Gợi ý bữa tối nhẹ'] }
    }

    const { detail } = result
    const parts = [`${detail.nameVi}: khoảng ${detail.total.kcal} kcal cho ${detail.grams} g.`]
    if (detail.estimated) parts.push('Gram từng nguyên liệu là số ước tính.')
    if (!detail.customised) {
      parts.push('Khẩu phần này chỉ để tham khảo; bạn nói khối lượng thật, mình tính lại nhé.')
    }

    return {
      text: finish(parts.join(' ')),
      dataParts: [{ name: 'dish_detail_card', data: toDishDetailCard(detail) }],
      suggestions: ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?'],
    }
  }

  return null
}

/** Câu dài thường là một câu hỏi hay trò chuyện; gợi ý "có phải món X" chỉ hợp với tên món ngắn. */
const MAX_WORDS_FOR_CANDIDATES = 5

/**
 * Trả lời khi câu được coi là kể bữa ăn nhưng không khớp món nào.
 *
 * Trước đây chỉ nói "mình chưa nhận ra món nào" rồi bỏ khách đó. Nay có tên món gần đúng thì đưa
 * ra để khách chọn ("Cá bống" → "Cá bống kho tiêu"); không có thì nói rõ Bơ làm được những gì để
 * khách biết gõ gì tiếp, thay vì chỉ bảo "bạn chỉnh lại giúp mình".
 */
export function buildUnmatchedReply(
  text: string,
  candidates: readonly MealCatalogueEntry[],
  remainingKcal: number,
): IntentReply {
  const wordCount = text.trim().split(/\s+/).length
  const shown = wordCount <= MAX_WORDS_FOR_CANDIDATES ? candidates.slice(0, 4) : []

  if (shown.length > 0) {
    return {
      text: finish(
        `Mình chưa chắc bạn nói món nào. Có phải: ${shown.map((item) => item.nameVi).join(', ')}? ` +
          'Bạn chọn hoặc gõ rõ tên món giúp mình nhé.',
      ),
      dataParts: [
        {
          name: 'food_candidate_chips',
          data: {
            candidates: shown.map((item) => ({
              foodId: item.slug,
              nameVi: item.nameVi,
              servingName: item.servingName ?? null,
              servingGrams: item.servingGrams ?? null,
              kcalPer100g: item.kcalPer100g,
            })),
            promptText: 'Bạn ăn món nào?',
          },
        },
      ],
      suggestions: ['Gợi ý bữa tối nhẹ', 'Hôm nay mình còn bao nhiêu calo?'],
    }
  }

  return {
    text: finish(
      'Mình chưa hiểu câu này. Bạn có thể kể bữa ăn (“trưa nay mình ăn cơm tấm sườn”), ' +
        'nhờ gợi ý (“gợi ý món nhiều đạm”, “hôm nay muốn ăn thịt”) hoặc hỏi thành phần ' +
        `(“phở bò gồm nguyên liệu gì”). Hôm nay bạn còn ${remainingKcal} kcal.`,
    ),
    dataParts: [],
    suggestions: ['Gợi ý bữa tối nhẹ', 'Gợi ý món nhiều đạm'],
  }
}
