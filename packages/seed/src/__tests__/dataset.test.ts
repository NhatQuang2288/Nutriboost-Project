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

describe('danh mục đủ dùng', () => {
  const dataset = buildDataset()
  const kcalPerServing = (slug: string): number => {
    const food = dataset.all.find((item) => item.slug === slug)
    expect(food, `thiếu ${slug}`).toBeDefined()
    return ((food?.kcalPer100g ?? 0) * (food?.servingGrams ?? 0)) / 100
  }

  it('không có hai món trùng tên — thẻ gợi ý sẽ hiện hai dòng y hệt', () => {
    const names = dataset.all.map((item) => item.nameVi.toLowerCase())
    const duplicated = names.filter((name, index) => names.indexOf(name) !== index)
    expect(duplicated).toEqual([])
  })

  it('không có bí danh nào trỏ tới hai món khác nhau', () => {
    const owner = new Map<string, string>()
    const clashes: string[] = []
    for (const item of dataset.all) {
      for (const alias of item.aliases ?? []) {
        const key = alias.toLowerCase()
        const previous = owner.get(key)
        if (previous !== undefined && previous !== item.slug) {
          clashes.push(`"${alias}": ${previous} và ${item.slug}`)
        }
        owner.set(key, item.slug)
      }
    }
    expect(clashes).toEqual([])
  })

  it('có các món người Việt hay ghi mà trước đây thiếu', () => {
    for (const slug of [
      'tra-sua-tran-chau',
      'bun-rieu-cua',
      'bun-thit-nuong',
      'bun-dau-mam-tom',
      'banh-cuon',
      'banh-xeo',
      'mi-tom-trung',
      'nuoc-mia',
      'ga-ran',
    ]) {
      expect(
        dataset.all.some((item) => item.slug === slug),
        slug,
      ).toBe(true)
    }
  })

  it('một ly trà sữa trân châu nằm trong khoảng 250–450 kcal', () => {
    const kcal = kcalPerServing('tra-sua-tran-chau')
    expect(kcal).toBeGreaterThan(250)
    expect(kcal).toBeLessThan(450)
  })

  it('cháo có nước nấu — không đặc như gạo sống', () => {
    // Bản đầu thiếu nước nên cháo gà ra 231 kcal/100 g. Cháo thật khoảng 50–90 kcal/100 g.
    for (const slug of ['chao-ga', 'chao-ca-basa', 'chao-thit-bam']) {
      const food = dataset.all.find((item) => item.slug === slug)
      expect(food?.kcalPer100g, slug).toBeLessThan(100)
    }
  })

  it('xôi nấu từ gạo nếp có nước, khoảng 200–280 kcal/100 g', () => {
    for (const slug of ['xoi-ga', 'xoi-dau-phong', 'xoi-xeo']) {
      const food = dataset.all.find((item) => item.slug === slug)
      expect(food?.kcalPer100g, slug).toBeGreaterThan(200)
      expect(food?.kcalPer100g, slug).toBeLessThan(280)
    }
  })

  it('món nước có nước dùng, dưới 150 kcal/100 g', () => {
    const soups = DISHES.filter((dish) => dish.category === 'Món nước')
    for (const dish of soups) {
      const food = dataset.all.find((item) => item.slug === dish.dishSlug)
      expect(food?.kcalPer100g, dish.dishSlug).toBeLessThan(160)
    }
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
