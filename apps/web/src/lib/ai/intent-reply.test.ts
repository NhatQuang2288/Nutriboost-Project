import { classifyIntent, parseGenerativePayload } from '@nutriboost/ai'
import { describe, expect, it } from 'vitest'

import { buildIntentReply, buildUnmatchedReply, type IntentReplyContext } from './intent-reply'
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

describe('đường dự phòng — nguyên liệu nền có kcal riêng', () => {
  it('"thành phần bún thang" tính được kcal của bún thay vì dấu "—"', () => {
    const card = reply('thành phần bún thang').dataParts[0]?.data as {
      total: { kcal: number }
      items: { name: string; grams: number; kcal: number | null }[]
    }
    const bun = card.items.find((item) => item.name === 'Bún tươi')

    expect(bun?.kcal).not.toBeNull()
    // 180 g × 110 kcal/100 g.
    expect(bun?.kcal).toBe(Math.round(bun!.grams * 1.1))
    // Tổng của món vẫn là số của cả món, không phải tổng các thành phần đã biết.
    expect(card.total.kcal).toBeGreaterThan(bun!.kcal!)
  })
})

describe('đường dự phòng — khách nêu gram từng nguyên liệu', () => {
  const run = (text: string) => reply(text, { userText: text })

  it('"bún thang bún 250g" chỉnh bún, không phải cả món', () => {
    const result = run('bún thang bún tươi 250g bao nhiêu calo')
    const card = result.dataParts[0]?.data as {
      grams: number
      customised: boolean
      items: { name: string; grams: number; adjusted: boolean }[]
    }
    const bun = card.items.find((item) => item.name === 'Bún tươi')

    expect(bun).toMatchObject({ grams: 250, adjusted: true })
    // Khối lượng cả món là tổng đã tính lại, không phải 250.
    expect(card.grams).toBeGreaterThan(250)
    expect(card.customised).toBe(true)
    expect(result.text).toMatch(/tính lại theo gram bạn nêu cho từng nguyên liệu/)
  })

  it('con số đứng cạnh tên món vẫn là khối lượng cả món', () => {
    const card = run('bún thang 300g bao nhiêu calo').dataParts[0]?.data as { grams: number }
    expect(card.grams).toBe(300)
  })

  it('nguyên liệu chưa có số liệu thì nói thẳng, không tính bừa', () => {
    const result = run('bún thang giò lụa 50g bao nhiêu calo')
    expect(result.dataParts).toEqual([])
    expect(result.text).toMatch(/Chưa có số dinh dưỡng riêng/)
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

describe('đường dự phòng — câu hỏi từng không được đáp ứng', () => {
  it('"Nay tôi muốn ăn thịt" nhận về món có thịt, không phải "chưa nhận ra món nào"', () => {
    const result = reply('Nay tôi muốn ăn thịt')
    expect(result.text).toMatch(/Mình gợi ý \d món/)
    const card = result.dataParts[0]?.data as {
      suggestions: { foodId: string; nameVi: string }[]
      appliedFilters: string[]
    }
    expect(card.appliedFilters).toContain('có thịt')
    expect(card.suggestions.length).toBeGreaterThan(0)
    const bySlug = new Map(MEAL_CATALOGUE.map((item) => [item.slug, item]))
    for (const item of card.suggestions) {
      const entry = bySlug.get(item.foodId)!
      const text = [
        entry.nameVi,
        entry.category ?? '',
        ...(entry.components ?? []).map((c) => c.name),
      ]
        .join(' ')
        .toLowerCase()
      expect(text, item.nameVi).toMatch(
        /thịt|bò|heo|lợn|gà|vịt|ngan|sườn|giò|chả|nem|lòng|xá xíu|lạp xưởng|ba chỉ|ba rọi|mọc|nạm|chân giò|bì\b/,
      )
    }
  })

  it('"muốn ăn đồ ngọt" cho món tráng miệng, không cho cải ngọt', () => {
    const card = reply('hôm nay muốn ăn đồ ngọt').dataParts[0]?.data as {
      suggestions: { nameVi: string }[]
    }
    expect(card.suggestions.length).toBeGreaterThan(0)
    expect(card.suggestions.map((item) => item.nameVi)).not.toContain('Cải ngọt')
  })
})

describe('đường dự phòng — câu "trời mưa" trong ảnh lỗi', () => {
  it('ưu tiên món nước nóng và nói rõ lý do, không phải cùng một danh sách cho mọi câu hỏi', () => {
    const rainy = reply('hôm nay trời mưa bạn có món ăn gì muốn đề xuất không')
    const plain = reply('bạn có đề xuất món ăn gì cho ngày hôm nay không')

    const rainyCard = rainy.dataParts[0]?.data as {
      suggestions: { foodId: string; nameVi: string; category: string | null }[]
      appliedFilters: string[]
    }
    const plainCard = plain.dataParts[0]?.data as { suggestions: { foodId: string }[] }

    expect(rainyCard.appliedFilters.join(' ')).toMatch(/ưu tiên món nước nóng/)
    // Có phản ứng với ngữ cảnh: danh sách khác hẳn danh sách của câu không nhắc thời tiết.
    expect(rainyCard.suggestions.map((item) => item.foodId)).not.toEqual(
      plainCard.suggestions.map((item) => item.foodId),
    )
    const soupy = rainyCard.suggestions.filter((item) =>
      /nước|lẩu|phở|bún|cháo|canh|miến|hủ tiếu|mỳ/i.test(`${item.nameVi} ${item.category ?? ''}`),
    )
    expect(soupy.length).toBeGreaterThanOrEqual(4)
  })

  it('không còn dồn cả danh sách vào cùng một nhóm món', () => {
    const card = reply('gợi ý món').dataParts[0]?.data as {
      suggestions: { category: string | null }[]
    }
    const counts = new Map<string, number>()
    for (const item of card.suggestions) {
      counts.set(item.category ?? '', (counts.get(item.category ?? '') ?? 0) + 1)
    }
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2)
  })
})

describe('"Phở" không còn bị ghi thẳng thành "Phở bò"', () => {
  it('hỏi lại với cả họ món phở, và tên món là nút bấm gửi lại được', () => {
    const estimate = mealEstimator.estimate('Phở')
    expect(estimate.items[0]?.foodId).toBeNull()

    const result = buildUnmatchedReply('Phở', mealEstimator.suggest('Phở', 4), 667)
    expect(result.text).toMatch(/Có phải: Phở bò, /)
    expect(result.suggestions).toHaveLength(4)
    expect(result.suggestions.every((name) => /^Phở/.test(name))).toBe(true)
    // Chạm vào một tên thì câu gửi lại khớp đúng món đó, không hỏi lại nữa.
    for (const name of result.suggestions) {
      expect(mealEstimator.estimate(name).items[0]?.foodId, name).not.toBeNull()
    }
  })
})

describe('buildUnmatchedReply', () => {
  it('"Cá bống" chưa đủ tên món thì đưa tên gần đúng để khách chọn', () => {
    const result = buildUnmatchedReply('Cá bống', mealEstimator.suggest('Cá bống', 4), 667)
    expect(result.text).toMatch(/Có phải: Cá bống kho tiêu/)
    expect(result.dataParts[0]?.name).toBe('food_candidate_chips')
    expect(parseGenerativePayload('food_candidate_chips', result.dataParts[0]?.data).ok).toBe(true)
  })

  it('câu dài không phải tên món thì không đoán, và nói rõ Bơ làm được gì', () => {
    const text = 'thịt gà có tốt cho người đang tập gym buổi tối không nhỉ'
    const result = buildUnmatchedReply(text, mealEstimator.suggest(text, 4), 667)
    expect(result.dataParts).toEqual([])
    expect(result.text).toMatch(/gợi ý món/)
    expect(result.text).toMatch(/còn 667 kcal/)
  })
})
