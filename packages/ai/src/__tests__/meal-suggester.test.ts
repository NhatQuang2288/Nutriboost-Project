import { describe, expect, it } from 'vitest'

import type { MealCatalogueEntry } from '../meal-estimator'
import { defaultMealBudget, findAvoidedSlugs, suggestMeals } from '../meal-suggester'

const dish = (
  slug: string,
  nameVi: string,
  kcalPer100g: number,
  proteinG: number,
  servingGrams = 300,
): MealCatalogueEntry => ({
  slug,
  nameVi,
  kind: 'dish',
  servingGrams,
  kcalPer100g,
  proteinG,
  carbG: 15,
  fatG: 3,
})

const CATALOGUE: readonly MealCatalogueEntry[] = [
  dish('pho-bo', 'Phở bò', 137, 7.2),
  dish('com-ga', 'Cơm gà', 160, 9),
  dish('bun-cha-ca', 'Bún chả cá', 140, 8),
  dish('ca-phe-sua-da', 'Cà phê sữa đá', 80, 1, 200),
  dish('canh-chua-tom', 'Canh chua tôm', 45, 5),
  dish('xoi-ngot', 'Xôi ngọt', 230, 3),
  {
    slug: 'thit-bo',
    nameVi: 'Thịt bò',
    kind: 'ingredient',
    kcalPer100g: 250,
    proteinG: 26,
    carbG: 0,
    fatG: 15,
  },
]

describe('suggestMeals', () => {
  it('chỉ gợi ý món, không gợi ý nguyên liệu thô', () => {
    const { options } = suggestMeals({ catalogue: CATALOGUE, mealType: 'lunch', budgetKcal: 450 })
    expect(options.map((option) => option.slug)).not.toContain('thit-bo')
  })

  it('mọi gợi ý đều nằm trong ±35 % ngân sách', () => {
    const { options } = suggestMeals({
      catalogue: CATALOGUE,
      mealType: 'dinner',
      budgetKcal: 450,
      count: 5,
    })
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(Math.abs(option.kcal - 450) / 450).toBeLessThanOrEqual(0.35)
    }
  })

  it('ưu tiên món giàu đạm khi kcal ngang nhau', () => {
    const { options } = suggestMeals({ catalogue: CATALOGUE, mealType: 'lunch', budgetKcal: 450 })
    // Cơm gà có tỉ lệ năng lượng từ đạm cao hơn xôi ngọt.
    const slugs = options.map((option) => option.slug)
    if (slugs.includes('xoi-ngot')) {
      expect(slugs.indexOf('com-ga')).toBeLessThan(slugs.indexOf('xoi-ngot'))
    }
  })

  it('không gợi ý hai món trùng tên', () => {
    const catalogue = [...CATALOGUE, dish('com-ga-2', 'Cơm gà', 158, 9)]
    const { options } = suggestMeals({ catalogue, mealType: 'lunch', budgetKcal: 450, count: 5 })
    const names = options.map((option) => option.nameVi)
    expect(new Set(names).size).toBe(names.length)
  })

  it('cùng hạt giống cho cùng kết quả', () => {
    const input = { catalogue: CATALOGUE, mealType: 'lunch' as const, budgetKcal: 450, seed: 'a' }
    expect(suggestMeals(input)).toEqual(suggestMeals(input))
  })

  it('đếm số món bị loại vì trùng danh sách tránh', () => {
    const result = suggestMeals({
      catalogue: CATALOGUE,
      mealType: 'lunch',
      budgetKcal: 450,
      avoid: ['phở'],
    })
    expect(result.excludedCount).toBe(1)
    expect(result.options.map((option) => option.slug)).not.toContain('pho-bo')
  })
})

describe('findAvoidedSlugs', () => {
  it('"cá" có dấu không bắt nhầm "cà phê"', () => {
    const slugs = findAvoidedSlugs(CATALOGUE, ['cá'])
    expect([...slugs]).toEqual(['bun-cha-ca'])
  })

  it('mở rộng nhóm "hải sản" thành từng loại', () => {
    const slugs = findAvoidedSlugs(CATALOGUE, ['hai san'])
    expect(slugs.has('canh-chua-tom')).toBe(true)
    expect(slugs.has('bun-cha-ca')).toBe(true)
    expect(slugs.has('ca-phe-sua-da')).toBe(false)
    expect(slugs.has('pho-bo')).toBe(false)
  })

  it('khớp theo từ nguyên vẹn, không khớp giữa từ', () => {
    // "bo" không được khớp vào "bún" hay "bò" bị dính chữ khác.
    const slugs = findAvoidedSlugs(CATALOGUE, ['bò'])
    expect([...slugs].sort()).toEqual(['pho-bo', 'thit-bo'])
  })

  it('"thịt bò" loại cả món bò không ghi chữ "thịt"', () => {
    const slugs = findAvoidedSlugs(CATALOGUE, ['thịt bò'])
    expect([...slugs].sort()).toEqual(['pho-bo', 'thit-bo'])
    expect([...findAvoidedSlugs(CATALOGUE, ['thit bo'])].sort()).toEqual(['pho-bo', 'thit-bo'])
  })

  it('danh sách rỗng thì không loại gì', () => {
    expect(findAvoidedSlugs(CATALOGUE, []).size).toBe(0)
  })
})

describe('defaultMealBudget', () => {
  it('lấy phần của bữa trong mục tiêu ngày', () => {
    expect(defaultMealBudget('lunch', 2000, null)).toBe(700)
  })

  it('không vượt quá số kcal còn lại', () => {
    expect(defaultMealBudget('lunch', 2000, 400)).toBe(400)
  })

  it('vẫn còn sàn 150 kcal khi đã vượt mục tiêu', () => {
    expect(defaultMealBudget('dinner', 2000, -200)).toBe(150)
  })
})
