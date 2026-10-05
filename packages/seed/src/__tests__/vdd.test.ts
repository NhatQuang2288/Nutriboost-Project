import { describe, expect, it } from 'vitest'

import { VDD_ROWS } from '../data/vdd.generated'
import { buildDataset, validateFullDataset } from '../index'

describe('bảng VDD', () => {
  const dataset = buildDataset()

  it('mọi dòng của tệp hoặc vào danh mục hoặc được liệt kê là trùng', () => {
    const vddCount =
      dataset.all.filter((food) => food.sourceRef.includes('VDD')).length +
      dataset.vddDuplicates.length
    expect(vddCount).toBe(VDD_ROWS.length)
  })

  it('slug không trùng trong toàn danh mục', () => {
    const slugs = dataset.all.map((food) => food.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('món cũ được ưu tiên khi trùng tên với món VDD', () => {
    expect(dataset.all.some((food) => food.slug === 'pho-bo')).toBe(true)
    expect(dataset.vddDuplicates.map((item) => item.name)).toContain('Bún bò Huế')
  })

  it('đổi khẩu phần sang trên 100 g đúng công thức giá trị × 100 / khối lượng', () => {
    const food = dataset.all.find((item) => item.nameVi === 'Phở bò chín')
    // Bảng VDD: 450 g, 435 kcal, đạm 18,5 g.
    expect(food?.servingGrams).toBe(450)
    expect(food?.kcalPer100g).toBeCloseTo(96.7, 1)
    expect(food?.proteinG).toBeCloseTo(4.1, 1)
    // Khôi phục lại số của cả khẩu phần phải về đúng số gốc (sai số làm tròn 1 chữ số).
    expect(((food?.kcalPer100g ?? 0) * 450) / 100).toBeCloseTo(435, 0)
  })

  it('ô đạm hoặc bột đường để trống được hiểu là 0, không phải thiếu', () => {
    const oil = dataset.all.find((item) => item.nameVi === 'Dầu ăn thực vật')
    expect(oil?.proteinG).toBe(0)
  })

  it('tổng gram thành phần khớp khối lượng khẩu phần của món', () => {
    for (const food of dataset.all) {
      if (!food.sourceRef.includes('VDD')) continue
      const breakdown = dataset.breakdowns.get(food.slug)
      expect(breakdown, `${food.slug} thiếu thành phần`).toBeDefined()
      expect(breakdown?.estimated).toBe(true)
      const total = (breakdown?.components ?? []).reduce((sum, item) => sum + item.grams, 0)
      expect(Math.abs(total - (food.servingGrams ?? 0)), food.slug).toBeLessThanOrEqual(1)
    }
  })

  it('món cũ giữ gram thật, không bị đánh dấu ước tính', () => {
    expect(dataset.breakdowns.get('pho-bo')?.estimated).toBe(false)
  })

  it('thành phần chỉ được gán nguyên liệu khi tên đồng nghĩa, không đoán', () => {
    const all = [...dataset.breakdowns.values()].flatMap((item) => item.components)
    const slugs = new Set(dataset.all.map((food) => food.slug))

    // Slug được gán phải trỏ tới nguyên liệu có thật.
    for (const item of all) {
      if (item.ingredientSlug !== undefined) expect(slugs.has(item.ingredientSlug)).toBe(true)
    }
    // Tên chung chung như "Rau", "Nước dùng" không được gán bừa cho một nguyên liệu cụ thể.
    for (const item of all.filter((entry) => ['Rau', 'Nước dùng'].includes(entry.name))) {
      expect(item.ingredientSlug, item.name).toBeUndefined()
    }
    // Cặp đồng nghĩa có kiểm soát vẫn khớp.
    expect(all.some((item) => item.name === 'Bánh phở' && item.ingredientSlug === 'pho-tuoi')).toBe(
      true,
    )
  })

  it('bí danh tự sinh không quá ngắn và không kéo nhầm sang món khác', () => {
    const seen = new Map<string, string>()
    for (const food of dataset.all) {
      const isVdd = food.sourceRef.includes('VDD')
      for (const alias of food.aliases ?? []) {
        // "Than", "Na", "Thơm", "Lạc" từng suýt thành bí danh: một chữ là quá dễ trùng.
        // Bí danh viết tay của món cũ (như "cơm") do người soạn chủ ý nên không áp quy tắc này.
        if (isVdd) {
          expect(
            alias.trim().split(/\s+/).length,
            `${food.slug}: "${alias}"`,
          ).toBeGreaterThanOrEqual(2)
        }
        const owner = seen.get(alias)
        if (owner !== undefined) {
          const other = dataset.all.find((item) => item.slug === owner)
          expect(
            isVdd || other?.sourceRef.includes('VDD') === true,
            `bí danh "${alias}" trùng giữa ${owner} và ${food.slug}`,
          ).toBe(false)
        }
        seen.set(alias, food.slug)
      }
    }
    // Bỏ địa danh cuối tên: giữ khi duy nhất, bỏ khi mơ hồ.
    expect(dataset.all.find((food) => food.slug === 'cao-lau-hoi-an')?.aliases).toContain('Cao lầu')
    expect(dataset.all.find((food) => food.slug === 'bun-bo-hue')?.aliases ?? []).not.toContain(
      'Bún bò',
    )
  })

  it('không có lỗi số liệu vật lý nào', () => {
    const { food } = validateFullDataset()
    expect(food.errors, JSON.stringify(food.errors.slice(0, 5), null, 2)).toEqual([])
  })
})
