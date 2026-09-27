import { createMealEstimator, type ToolContext } from '@nutriboost/ai'
import { EXERCISES, buildDataset } from '@nutriboost/seed'
import { describe, expect, it } from 'vitest'

import { buildFallbackReply } from './fallback-reply'

const CATALOGUE = buildDataset().all
const estimator = createMealEstimator(CATALOGUE)

const TOOLS: ToolContext = {
  catalogue: CATALOGUE,
  estimator,
  targets: {
    bmrKcal: 1400,
    tdeeKcal: 2000,
    targetKcal: 1700,
    proteinG: 100,
    carbG: 200,
    fatG: 50,
    floorsApplied: [],
  },
  safety: { level: 'ok', reasons: [], blockWeightLoss: false },
  today: '2026-09-28',
  remainingKcal: 800,
  profile: { goal: 'lose', weightKg: 60 },
  exercises: EXERCISES,
}

function reply(userText: string, localHour = 19) {
  return buildFallbackReply({
    userText,
    estimate: estimator.estimate(userText),
    remainingKcal: 800,
    localHour,
    tools: TOOLS,
  })
}

describe('buildFallbackReply — không có model vẫn hiểu ý định', () => {
  it('xin lịch tập thì nhận thẻ lịch tập', () => {
    const result = reply('Lên lịch tập tại nhà cho mình')
    expect(result.dataParts.map((part) => part.name)).toEqual(['workout_preview_week'])
    expect(result.text).toMatch(/lịch tập 3 buổi/)
  })

  it('xin thực đơn thì nhận thẻ thực đơn, một ngày nếu nói "hôm nay"', () => {
    const week = reply('Lên thực đơn cả tuần cho mình')
    expect(week.dataParts[0]?.name).toBe('plan_preview_week')
    expect((week.dataParts[0]?.data as { days: unknown[] }).days).toHaveLength(7)

    const today = reply('thực đơn hôm nay')
    expect((today.dataParts[0]?.data as { days: unknown[] }).days).toHaveLength(1)
  })

  it('hỏi "ăn gì" thì gợi ý món cho bữa theo giờ', () => {
    const result = reply('Giờ ăn gì đây?', 19)
    const card = result.dataParts[0]?.data as { mealType: string; options: unknown[] }
    expect(result.dataParts[0]?.name).toBe('meal_suggestions_card')
    expect(card.mealType).toBe('dinner')
    expect(card.options.length).toBeGreaterThan(0)
  })

  it('"bữa tối nhẹ" giữ ngân sách thấp', () => {
    const result = reply('Gợi ý cho mình bữa tối nhẹ')
    const card = result.dataParts[0]?.data as { budgetKcal: number }
    expect(card.budgetKcal).toBeLessThanOrEqual(400)
  })

  it('kể bữa ăn thì vẫn dựng thẻ xác nhận như trước', () => {
    const result = reply('Sáng nay mình ăn phở bò')
    expect(result.dataParts[0]?.name).toBe('meal_confirm_card')
    expect(result.text).toMatch(/Mình nhận ra 1 món/)
  })

  it('câu không hiểu thì nói rõ Bơ làm được gì', () => {
    const result = reply('xyz abc')
    expect(result.dataParts).toHaveLength(0)
    expect(result.text).toMatch(/xin thực đơn, lịch tập/)
  })
})
