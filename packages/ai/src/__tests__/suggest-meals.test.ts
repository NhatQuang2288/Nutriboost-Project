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

    it('nhãn bộ lọc luôn có dấu dù từ khoá đã bỏ dấu', () => {
      const result = run({ filters: { include: ['trung'], categories: ['bun'] }, limit: 8 })
      expect(result.appliedFilters).toEqual(expect.arrayContaining(['có trứng', 'nhóm bún']))
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

describe('suggestMeals — ngữ cảnh, khoảng dư và đa dạng', () => {
  const rank = (result: ReturnType<typeof suggestMeals>, slug: string) =>
    result.suggestions.findIndex((item) => item.slug === slug)

  it('ưu tiên mềm: món hợp ngữ cảnh lên trước nhưng món khác không bị loại', () => {
    const plain = run({ budgetKcal: 600, limit: 8 })
    const rainy = run({
      budgetKcal: 600,
      limit: 8,
      filters: { prefer: ['canh', 'pho'], preferLabel: 'món nước nóng' },
    })

    expect(rank(rainy, 'canh-ga')).toBeGreaterThanOrEqual(0)
    expect(rank(rainy, 'canh-ga')).toBeLessThan(
      rank(plain, 'canh-ga') === -1 ? 99 : rank(plain, 'canh-ga') + 1,
    )
    expect(rank(rainy, 'pho-bo-chin')).toBeLessThan(rank(plain, 'pho-bo-chin'))
    // Vẫn còn món không khớp ngữ cảnh: đây là ưu tiên, không phải bộ lọc.
    expect(rainy.suggestions.length).toBe(plain.suggestions.length)
    expect(names(rainy)).toContain('Cơm tấm sườn nướng')
    expect(rainy.appliedFilters).toContain('ưu tiên món nước nóng')
  })

  it('giảm cân nhắm thấp hơn ngân sách, giữ cân thì dùng sát ngân sách', () => {
    const lose = run({ goal: 'lose', budgetKcal: 600, limit: 8 })
    const maintain = run({ goal: 'maintain', budgetKcal: 600, limit: 8 })
    const kcalOf = (result: ReturnType<typeof suggestMeals>) =>
      result.suggestions.find((item) => item.slug === 'com-suon')!.kcal

    // Cơm tấm sườn co giãn thoải mái tới 600 kcal: khoảng dư chỉ do mục tiêu quyết định, không do trần khẩu phần.
    expect(kcalOf(lose)).toBeLessThanOrEqual(600 * 0.9)
    expect(kcalOf(maintain)).toBeGreaterThanOrEqual(600 * 0.95)
  })

  it('mỗi nhóm món tối đa hai món khi còn món ở nhóm khác', () => {
    const phoDish = (slug: string, kcal: number) => ({
      slug,
      nameVi: `Phở ${slug}`,
      kind: 'dish' as const,
      category: 'Món Phở',
      servingGrams: 400,
      kcalPer100g: kcal,
      proteinG: 8,
      carbG: 12,
      fatG: 2,
    })
    const catalogue = [
      phoDish('a', 120),
      phoDish('b', 119),
      phoDish('c', 118),
      phoDish('d', 117),
      ...FIXTURE_CATALOGUE,
    ]

    const result = suggestMeals({ catalogue, goal: 'maintain', budgetKcal: 480, limit: 5 })
    const phoCount = result.suggestions.filter((item) => item.category === 'Món Phở').length
    expect(phoCount).toBeLessThanOrEqual(2)
    expect(result.suggestions).toHaveLength(5)
  })

  it('chỉ có một nhóm thì vẫn đủ số lượng, không trả thiếu', () => {
    const only = FIXTURE_CATALOGUE.filter(
      (item) => item.category === 'Món Phở' || item.kind === 'ingredient',
    )
    const result = suggestMeals({ catalogue: only, goal: 'maintain', budgetKcal: 600, limit: 5 })
    expect(result.suggestions.map((item) => item.slug)).toEqual(
      expect.arrayContaining(['pho-bo-chin', 'pho-bo']),
    )
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
