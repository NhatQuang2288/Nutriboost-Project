import { classifyIntent, parseGenerativePayload } from '@nutriboost/ai'
import { describe, expect, it } from 'vitest'

import { buildIntentReply, type IntentReplyContext } from './intent-reply'
import { MEAL_CATALOGUE, mealEstimator } from './meal-estimator'

/**
 * Đường dự phòng của route chat chạy KHÔNG có model. Test này dùng danh mục thật (bảng VDD +
 * món cũ) để chứng minh câu hỏi từng nhận về "mình chưa nhận ra món nào" nay được trả lời.
 */

const context: IntentReplyContext = {
  catalogue: MEAL_CATALOGUE,
  goal: 'maintain',
  safety: { blockWeightLoss: false },
  targetKcal: 2010,
  consumedKcal: 1343,
  remainingKcal: 667,
}

const reply = (text: string, overrides: Partial<IntentReplyContext> = {}) => {
  const result = buildIntentReply(classifyIntent(text, mealEstimator), { ...context, ...overrides })
  if (result === null) throw new Error(`Không có câu trả lời cho: ${text}`)
  return result
}

describe('đường dự phòng — gợi ý món', () => {
  it('câu hỏi trong ảnh lỗi nay trả về thẻ gợi ý, không phải "chưa nhận ra món nào"', () => {
    const result = reply('bạn có đề xuất món ăn gì cho ngày hôm nay không')

    expect(result.text).not.toMatch(/chưa nhận ra/)
    expect(result.text).toMatch(/Mình gợi ý \d món vừa khoảng 667 kcal/)

    const card = result.dataParts.find((part) => part.name === 'meal_suggestion_card')
    expect(card).toBeDefined()
    expect(parseGenerativePayload('meal_suggestion_card', card?.data).ok).toBe(true)

    const { suggestions } = card?.data as { suggestions: { kcal: number }[] }
    expect(suggestions.length).toBeGreaterThan(0)
    for (const item of suggestions) expect(item.kcal).toBeLessThanOrEqual(667 * 1.15)
  })

  it('mục tiêu tăng cân và giảm cân cho ra danh sách khác nhau', () => {
    const slugs = (goal: 'lose' | 'gain') =>
      (
        reply('gợi ý món', { goal }).dataParts[0]?.data as { suggestions: { foodId: string }[] }
      ).suggestions.map((item) => item.foodId)
    expect(slugs('lose')).not.toEqual(slugs('gain'))
  })

  it('đánh giá an toàn chặn giảm cân thì không gợi ý như giảm cân', () => {
    const card = reply('gợi ý món để giảm cân', { safety: { blockWeightLoss: true } }).dataParts[0]
      ?.data as { goal: string }
    expect(card.goal).toBe('maintain')
  })

  it('không ăn hải sản thì không món nào có tôm, cá, mực…', () => {
    const card = reply('gợi ý món không ăn hải sản').dataParts[0]?.data as {
      suggestions: { nameVi: string; category: string | null }[]
    }
    expect(card.suggestions.length).toBeGreaterThan(0)
    for (const item of card.suggestions) {
      expect(`${item.nameVi} ${item.category ?? ''}`).not.toMatch(/\b(tôm|mực|cua|hải sản)\b/i)
    }
  })

  it('gần hết kcal thì nói rõ thay vì gợi ý món to', () => {
    const result = reply('gợi ý món', { remainingKcal: 30 })
    const card = result.dataParts[0]?.data as { budgetKcal: number; notes: string[] }
    expect(card.budgetKcal).toBe(150)
    expect(card.notes.join(' ')).toMatch(/món nhẹ/)
  })
})

describe('đường dự phòng — chi tiết món', () => {
  it('trả về nguyên liệu và dinh dưỡng, nói rõ gram là ước tính và khẩu phần chỉ tham khảo', () => {
    const result = reply('phở bò chín gồm nguyên liệu gì')
    const card = result.dataParts[0]
    expect(card?.name).toBe('dish_detail_card')
    expect(parseGenerativePayload('dish_detail_card', card?.data).ok).toBe(true)
    expect(result.text).toMatch(/ước tính/)
    expect(result.text).toMatch(/tham khảo/)
    expect((card?.data as { items: unknown[] }).items.length).toBeGreaterThan(1)
  })

  it('khối lượng khách cung cấp được dùng thay khẩu phần tham khảo', () => {
    const result = reply('phở bò chín 300g bao nhiêu calo')
    const card = result.dataParts[0]?.data as { grams: number; customised: boolean }
    expect(card.grams).toBe(300)
    expect(card.customised).toBe(true)
    expect(result.text).not.toMatch(/chỉ để tham khảo/)
  })
})

describe('đường dự phòng — còn bao nhiêu kcal', () => {
  it('trả lời bằng số thật, không coi là bữa ăn', () => {
    const result = reply('Hôm nay mình còn bao nhiêu calo?')
    expect(result.text).toMatch(/còn 667 kcal/)
    expect(result.dataParts).toEqual([])
  })

  it('đã vượt mục tiêu thì nói đã vượt', () => {
    expect(reply('hôm nay còn bao nhiêu kcal', { remainingKcal: -120 }).text).toMatch(
      /vượt mục tiêu 120 kcal/,
    )
  })
})

describe('kể bữa ăn không bị ảnh hưởng', () => {
  it('không có phản hồi riêng, để route rơi xuống bộ ước lượng bữa ăn', () => {
    expect(
      buildIntentReply(classifyIntent('sáng nay mình ăn phở bò', mealEstimator), context),
    ).toBeNull()
  })
})
