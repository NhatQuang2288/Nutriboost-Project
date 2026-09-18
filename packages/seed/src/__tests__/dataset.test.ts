import { describe, expect, it } from 'vitest'

import {
  INGREDIENT_BY_SLUG,
  TARGET_DISHES,
  TARGET_INGREDIENTS,
  buildDataset,
  computeDishPer100g,
  datasetStats,
  validateFullDataset,
} from '../index'
import { DISHES } from '../data/dishes'
import { INGREDIENTS } from '../data/ingredients'

describe('bảng nguyên liệu', () => {
  it('không có lỗi số liệu nào', () => {
    const { food } = validateFullDataset()
    // Lỗi ở đây nghĩa là số liệu vi phạm ràng buộc vật lý — phải sửa trước khi ghi CSDL.
    expect(food.errors, JSON.stringify(food.errors, null, 2)).toEqual([])
  })

  it('mọi nguyên liệu đều có nguồn số liệu', () => {
    for (const item of INGREDIENTS) {
      expect(item.sourceRef.trim().length, `${item.slug} thiếu nguồn`).toBeGreaterThan(0)
    }
  })

  it('slug không trùng', () => {
    const slugs = INGREDIENTS.map((item) => item.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('khẩu phần luôn có cả tên lẫn khối lượng', () => {
    for (const item of INGREDIENTS) {
      const hasName = item.servingName !== undefined
      const hasGrams = item.servingGrams !== undefined
      expect(hasName, `${item.slug} lệch khai báo khẩu phần`).toBe(hasGrams)
    }
  })
})

describe('món ăn', () => {
  it('mọi món quy về được nguyên liệu có thật', () => {
    const { componentIssues } = validateFullDataset()
    expect(componentIssues, JSON.stringify(componentIssues, null, 2)).toEqual([])
  })

  it('chỉ số món được tính từ thành phần, không nhập tay', () => {
    for (const dish of DISHES) {
      const computed = computeDishPer100g(dish, INGREDIENT_BY_SLUG)
      expect(computed, `${dish.dishSlug} không tính được`).not.toBeNull()
      // Khối lượng khẩu phần phải bằng tổng khối lượng thành phần.
      const total = dish.components.reduce((sum, component) => sum + component.grams, 0)
      expect(computed?.servingGrams).toBe(Math.round(total))
    }
  })

  it('phở bò có chỉ số nằm trong khoảng hợp lý', () => {
    const pho = DISHES.find((dish) => dish.dishSlug === 'pho-bo')
    expect(pho).toBeDefined()
    const per100 = computeDishPer100g(pho!, INGREDIENT_BY_SLUG)
    expect(per100).not.toBeNull()
    // Một tô phở bò thực tế rơi vào khoảng 400–600 kcal.
    const totalKcal = ((per100?.kcalPer100g ?? 0) * (per100?.servingGrams ?? 0)) / 100
    expect(totalKcal).toBeGreaterThan(350)
    expect(totalKcal).toBeLessThan(650)
  })

  it('sữa chua chuối nhẹ hơn cơm tấm sườn', () => {
    const nhe = DISHES.find((dish) => dish.dishSlug === 'sua-chua-chuoi')!
    const nang = DISHES.find((dish) => dish.dishSlug === 'com-tam-suon')!
    const kcal = (dish: typeof nhe): number => {
      const per100 = computeDishPer100g(dish, INGREDIENT_BY_SLUG)
      return ((per100?.kcalPer100g ?? 0) * (per100?.servingGrams ?? 0)) / 100
    }
    expect(kcal(nhe)).toBeLessThan(kcal(nang))
  })
})

describe('bộ dữ liệu', () => {
  it('dựng được và không có lỗi', () => {
    const report = validateFullDataset()
    expect(report.food.isValid).toBe(true)
  })

  it('món tính ra được đưa vào bộ bản ghi', () => {
    const dataset = buildDataset()
    expect(dataset.dishes.length).toBe(DISHES.length)
    expect(dataset.all.length).toBe(INGREDIENTS.length + DISHES.length)
  })

  it('báo đúng số dòng còn thiếu so với mục tiêu', () => {
    const stats = datasetStats()
    expect(stats.errorCount).toBe(0)
    expect(stats.remainingToTarget).toBe(
      TARGET_INGREDIENTS - stats.ingredientCount + (TARGET_DISHES - stats.dishCount),
    )
    expect(stats.remainingToTarget).toBeGreaterThan(0)
  })

  it('không có cảnh báo nào nghiêm trọng về năng lượng', () => {
    const { food } = validateFullDataset()
    const energyWarnings = food.warnings.filter((issue) => issue.field === 'kcalPer100g')
    // Nếu cảnh báo này xuất hiện, số liệu năng lượng và đa lượng đang mâu thuẫn.
    expect(energyWarnings, JSON.stringify(energyWarnings, null, 2)).toEqual([])
  })
})
