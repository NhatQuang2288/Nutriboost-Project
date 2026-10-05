import { describe, expect, it } from 'vitest'

import { mealBudgetKcal, resolveSuggestGoal, suggestMeals } from '../suggest-meals'
import { FIXTURE_CATALOGUE } from './fixtures'

const run = (overrides: Partial<Parameters<typeof suggestMeals>[0]> = {}) =>
  suggestMeals({ catalogue: FIXTURE_CATALOGUE, goal: 'maintain', budgetKcal: 600, ...overrides })

const names = (result: ReturnType<typeof suggestMeals>) =>
  result.suggestions.map((item) => item.nameVi)

describe('suggestMeals', () => {
  it('chỉ gợi ý món, không gợi ý nguyên liệu thô', () => {
    const slugs = run({ limit: 8 }).suggestions.map((item) => item.slug)
    expect(slugs).not.toContain('thit-bo-nac')
    expect(slugs).not.toContain('pho-tuoi')
  })

  it('mọi món gợi ý đều vừa ngân sách kcal', () => {
    for (const budget of [150, 200, 300, 450, 667, 900]) {
      for (const item of run({ budgetKcal: budget, limit: 8 }).suggestions) {
        expect(item.kcal, `${item.nameVi} @ ${budget}`).toBeLessThanOrEqual(budget * 1.15)
      }
    }
  })

  it('con số kcal khớp khẩu phần đã co giãn: gram × số trên 100 g', () => {
    for (const item of run({ limit: 8 }).suggestions) {
      const entry = FIXTURE_CATALOGUE.find((candidate) => candidate.slug === item.slug)!
      expect(item.kcal).toBe(Math.round((entry.kcalPer100g * item.grams) / 100))
    }
  })

  it('giảm cân ưu tiên món nhẹ nhiều đạm, tăng cân ưu tiên món đậm đặc năng lượng', () => {
    const lose = run({ goal: 'lose', budgetKcal: 500 })
    const gain = run({ goal: 'gain', budgetKcal: 500 })
    expect(lose.suggestions[0]?.slug).not.toBe(gain.suggestions[0]?.slug)

    const density = (result: ReturnType<typeof suggestMeals>) =>
      result.suggestions.slice(0, 2).reduce((sum, item) => sum + item.kcal / item.grams, 0)
    expect(density(gain)).toBeGreaterThan(density(lose))
  })

  it('cùng đầu vào luôn cho cùng danh sách và cùng thứ tự', () => {
    expect(run({ goal: 'lose' })).toEqual(run({ goal: 'lose' }))
  })

  it('bỏ qua món đã gợi ý khi khách xin món khác', () => {
    const first = run({ limit: 3 }).suggestions.map((item) => item.slug)
    const next = run({ limit: 3, skipSlugs: first }).suggestions.map((item) => item.slug)
    expect(next.some((slug) => first.includes(slug))).toBe(false)
  })

  describe('lọc theo yêu cầu', () => {
    it('loại hải sản, kể cả món lươn không có chữ "cá"', () => {
      const result = run({ filters: { exclude: ['hải sản'] }, limit: 8 })
      expect(names(result)).not.toContain('Bún tôm')
      expect(names(result)).not.toContain('Miến lươn')
      expect(names(result)).toContain('Trứng xào cà chua')
    })

    it('"không ăn cá" không làm mất món cà chua', () => {
      const result = run({ filters: { exclude: ['ca'] }, limit: 8 })
      expect(names(result)).toContain('Trứng xào cà chua')
      expect(names(result)).not.toContain('Miến lươn')
    })

    it('từ khoá không dấu vẫn hiểu', () => {
      const result = run({ filters: { exclude: ['tom'] }, limit: 8 })
      expect(names(result)).not.toContain('Bún tôm')
    })

    it('món chay loại thịt, hải sản và lươn, giữ trứng', () => {
      const result = run({ filters: { vegetarian: true }, budgetKcal: 700, limit: 8 })
      expect(names(result)).toEqual(expect.arrayContaining(['Trứng xào cà chua', 'Xôi đậu xanh']))
      for (const banned of ['Canh gà rau củ', 'Cơm tấm sườn nướng', 'Bún tôm', 'Miến lươn']) {
        expect(names(result)).not.toContain(banned)
      }
      expect(result.notes.join(' ')).toMatch(/chay/)
    })

    it('trần kcal và đạm tối thiểu được tôn trọng', () => {
      const result = run({ filters: { maxKcal: 350, minProteinG: 15 }, budgetKcal: 700, limit: 8 })
      for (const item of result.suggestions) {
        expect(item.kcal).toBeLessThanOrEqual(350)
        expect(item.proteinG).toBeGreaterThanOrEqual(15)
      }
    })

    it('lọc theo nhóm món', () => {
      const result = run({ filters: { categories: ['bun'] }, limit: 8 })
      expect(result.suggestions.length).toBeGreaterThan(0)
      for (const item of result.suggestions) expect(item.category).toBe('Món Bún')
    })

    it('"có" yêu cầu mọi từ phải xuất hiện', () => {
      const result = run({ filters: { include: ['trứng'] }, limit: 8 })
      expect(names(result)).toEqual(['Trứng xào cà chua'])
    })

    it('bộ lọc quá chặt thì nói thật thay vì trả danh sách bừa', () => {
      const result = run({ filters: { exclude: ['hải sản'], include: ['tôm'] } })
      expect(result.suggestions).toEqual([])
      expect(result.notes.join(' ')).toMatch(/nới/)
    })

    it('liệt kê bộ lọc đã áp dụng để khách kiểm tra lại', () => {
      const result = run({ filters: { exclude: ['hải sản'], maxKcal: 500 } })
      expect(result.appliedFilters).toEqual(
        expect.arrayContaining(['không có hải sản', 'tối đa 500 kcal']),
      )
    })
  })

  it('gần hết hoặc đã hết kcal thì nâng lên món nhẹ và nói rõ', () => {
    const result = run({ budgetKcal: 20 })
    expect(result.budgetKcal).toBe(150)
    expect(result.notes[0]).toMatch(/món nhẹ/)
  })
})

describe('mealBudgetKcal', () => {
  it('có chỉ định bữa thì lấy phần của bữa đó, không vượt số kcal còn lại', () => {
    expect(mealBudgetKcal({ remainingKcal: 2000, targetKcal: 2000, mealType: 'breakfast' })).toBe(
      500,
    )
    expect(mealBudgetKcal({ remainingKcal: 300, targetKcal: 2000, mealType: 'lunch' })).toBe(300)
  })

  it('không chỉ định bữa thì tối đa 45 % mục tiêu để không thành một bữa khổng lồ', () => {
    expect(mealBudgetKcal({ remainingKcal: 1500, targetKcal: 2000 })).toBe(900)
    expect(mealBudgetKcal({ remainingKcal: 667, targetKcal: 2000 })).toBe(667)
  })

  it('số kcal còn lại âm thì ngân sách bằng 0', () => {
    expect(mealBudgetKcal({ remainingKcal: -50, targetKcal: 2000 })).toBe(0)
  })
})

describe('resolveSuggestGoal', () => {
  it('không để khách "giảm cân" khi đánh giá an toàn chặn giảm cân', () => {
    const result = resolveSuggestGoal('lose', { blockWeightLoss: true })
    expect(result.goal).toBe('maintain')
    expect(result.note).toMatch(/giữ cân/)
  })

  it('giữ nguyên mục tiêu khi được phép', () => {
    expect(resolveSuggestGoal('lose', { blockWeightLoss: false })).toEqual({
      goal: 'lose',
      note: null,
    })
    expect(resolveSuggestGoal('gain', { blockWeightLoss: true })).toEqual({
      goal: 'gain',
      note: null,
    })
  })
})
