import { describe, expect, it } from 'vitest'

import { VDD_ROWS } from '../data/vdd.generated'
import { emitFoodsSql } from '../emit-sql'
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

  it('bảng VDD thắng khi trùng TÊN: món cũ bị thay bằng món VDD cùng slug', () => {
    expect(dataset.replacedDishSlugs).toEqual(
      expect.arrayContaining(['bun-bo-hue', 'rau-muong-xao-toi', 'goi-cuon-tom-thit']),
    )
    for (const slug of dataset.replacedDishSlugs) {
      const food = dataset.all.find((item) => item.slug === slug)
      // Cùng slug: CSDL đã có hàng đó thì seed cập nhật tại chỗ thay vì để lại món cũ.
      expect(food?.sourceRef, slug).toContain('VDD')
      expect(dataset.breakdowns.get(slug)?.estimated, slug).toBe(true)
      // Thành phần cũ không còn trong seed, nếu không CSDL sẽ tính lại và ghi đè số VDD.
      expect(
        dataset.components.some((dish) => dish.dishSlug === slug),
        slug,
      ).toBe(false)
    }
    // Bún bò Huế mang số của bảng VDD: 478 kcal cho 500 g.
    const bun = dataset.all.find((item) => item.slug === 'bun-bo-hue')
    expect(bun?.servingGrams).toBe(500)
    expect(Math.round(((bun?.kcalPer100g ?? 0) * 500) / 100)).toBe(478)
  })

  it('chỉ trùng BÍ DANH thì món VDD vẫn vào, món cũ giữ lại nhưng mất bí danh đó', () => {
    // Trước đây "phở bò tái" bị bí danh của "Phở bò" nuốt mất nên ra số liệu cũ.
    const tai = dataset.all.find((item) => item.nameVi === 'Phở bò tái')
    expect(tai?.sourceRef).toContain('VDD')
    expect(tai?.servingGrams).toBe(450)
    expect(Math.round(((tai?.kcalPer100g ?? 0) * 450) / 100)).toBe(420)

    const generic = dataset.all.find((item) => item.slug === 'pho-bo')
    expect(generic?.sourceRef).not.toContain('VDD')
    expect(generic?.aliases ?? []).not.toContain('pho bo tai')
    expect(dataset.breakdowns.get('pho-bo')?.estimated).toBe(false)
  })

  it('không còn dòng VDD nào bị bỏ ngoài trường hợp trùng nguyên liệu', () => {
    expect(dataset.vddDuplicates).toEqual([])
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
    // "Bún chả" đã là tên một món cũ khác, nên không được thành bí danh của "Bún chả Hà Nội".
    expect(dataset.all.find((food) => food.slug === 'bun-cha-ha-noi')?.aliases ?? []).not.toContain(
      'Bún chả',
    )
  })

  it('seed ghi thành phần và cờ ước tính vào foods để AI đọc từ CSDL', () => {
    const sql = emitFoodsSql(dataset)
    expect(sql).toContain('components, components_estimated')
    // Mỗi món có thành phần thì có một giá trị jsonb.
    const dishCount = [...dataset.breakdowns.keys()].length
    expect(sql.match(/::jsonb/g)?.length).toBe(dishCount)
    // Phở bò chín (VDD) mang cờ ước tính, kèm đúng tên nguyên liệu.
    const line = sql.split('\n').find((row) => row.includes("'pho-bo-chin'"))
    expect(line).toContain('"name":"Bánh phở"')
    expect(line?.trimEnd().replace(/\),?$/, '')).toMatch(/, true$/)
  })

  it('không có lỗi số liệu vật lý nào', () => {
    const { food } = validateFullDataset()
    expect(food.errors, JSON.stringify(food.errors.slice(0, 5), null, 2)).toEqual([])
  })
})
