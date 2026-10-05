import { describe, expect, it } from 'vitest'

import { buildDishDetail, parseComponentGrams, sumKnownItems } from '../dish-math'
import { FIXTURE_CATALOGUE } from './fixtures'

const entry = (slug: string) => FIXTURE_CATALOGUE.find((item) => item.slug === slug)!
const detail = (slug: string, request = {}) => {
  const result = buildDishDetail(entry(slug), FIXTURE_CATALOGUE, request)
  if (!result.ok) throw new Error(result.reason)
  return result.detail
}

describe('buildDishDetail — cả món', () => {
  it('mặc định là khẩu phần tham khảo và không bị coi là khách đã chỉnh', () => {
    const result = detail('pho-bo-chin')
    expect(result.grams).toBe(450)
    expect(result.referenceGrams).toBe(450)
    expect(result.customised).toBe(false)
    // 97 kcal/100 g × 450 g.
    expect(result.total.kcal).toBe(Math.round(0.97 * 450))
  })

  it('khối lượng khách cung cấp co giãn tuyến tính cả tổng lẫn gram từng nguyên liệu', () => {
    const half = detail('pho-bo-chin', { grams: 225 })
    expect(half.customised).toBe(true)
    expect(half.total.kcal).toBe(Math.round(0.97 * 225))
    expect(half.items.find((item) => item.name === 'Bánh phở')?.grams).toBe(100)
    expect(half.items.find((item) => item.name === 'Thịt bò chín')?.grams).toBe(30)
  })

  it('nguyên liệu có số trên 100 g tính chính xác; chưa có thì là phần chia, và tổng vẫn là số cả món', () => {
    const result = detail('pho-bo-chin')
    const pho = result.items.find((item) => item.name === 'Bánh phở')!
    const beef = result.items.find((item) => item.name === 'Thịt bò chín')!

    // 200 g × 143 kcal/100 g.
    expect(pho.nutrients?.kcal).toBe(286)
    expect(pho.share).toBe(false)
    expect(beef.share).toBe(true)
    // Phần có số riêng nhỏ hơn tổng của món; phần còn lại là thứ được chia.
    expect(sumKnownItems(result.items.filter((item) => !item.share)).kcal).toBeLessThan(
      result.total.kcal,
    )
    expect(result.total.kcal).toBe(Math.round(0.97 * 450))
  })

  it('đánh dấu gram ước tính theo nguồn của món', () => {
    expect(detail('pho-bo-chin').estimated).toBe(true)
    expect(detail('pho-bo').estimated).toBe(false)
  })

  it('từ chối khối lượng không hợp lệ', () => {
    for (const grams of [0, -5, Number.NaN]) {
      expect(buildDishDetail(entry('pho-bo-chin'), FIXTURE_CATALOGUE, { grams }).ok).toBe(false)
    }
  })
})

describe('buildDishDetail — chỉnh từng nguyên liệu', () => {
  it('tổng mới = tổng tham khảo + chênh lệch của đúng nguyên liệu đã đổi', () => {
    const base = detail('pho-bo')
    const adjusted = detail('pho-bo', { componentGrams: { 'Thịt bò nạc': 120 } })

    // +40 g thịt bò nạc × 118 kcal/100 g = +47 kcal.
    expect(adjusted.total.kcal - base.total.kcal).toBe(47)
    expect(adjusted.grams).toBe(base.grams + 40)
    expect(adjusted.customised).toBe(true)
    expect(adjusted.items.find((item) => item.name === 'Thịt bò nạc')).toMatchObject({
      grams: 120,
      adjusted: true,
    })
    expect(adjusted.items.find((item) => item.name === 'Bánh phở tươi')?.adjusted).toBe(false)
  })

  it('bớt nguyên liệu thì tổng giảm và không bao giờ âm', () => {
    const base = detail('pho-bo')
    const less = detail('pho-bo', { componentGrams: { 'Bánh phở tươi': 0 } })
    expect(less.total.kcal).toBeLessThan(base.total.kcal)
    expect(less.total.kcal).toBeGreaterThanOrEqual(0)
  })

  it('nhận tên ngắn khi chỉ có một ứng viên', () => {
    const result = detail('pho-bo', { componentGrams: { 'thịt bò': 100 } })
    expect(result.items.find((item) => item.adjusted)?.name).toBe('Thịt bò nạc')
  })

  it('nguyên liệu CHƯA có số riêng vẫn sửa được, theo phần còn lại của món chia theo khối lượng', () => {
    const base = detail('pho-bo-chin')
    const more = detail('pho-bo-chin', { componentGrams: { 'Thịt bò chín': 120 } }) // 60 → 120 g

    const beef = more.items.find((item) => item.name === 'Thịt bò chín')!
    expect(beef.share).toBe(true)
    expect(beef.adjusted).toBe(true)
    expect(beef.nutrients?.kcal).toBeGreaterThan(0)
    // Thêm 60 g vào nhóm 3 nguyên liệu chưa có số (60 + 175 + 15 = 250 g): tổng phải tăng.
    expect(more.total.kcal).toBeGreaterThan(base.total.kcal)
    expect(more.grams).toBe(base.grams + 60)
  })

  it('phần chia theo tỉ lệ cộng với phần có số riêng đúng bằng tổng của cả món', () => {
    const result = detail('pho-bo-chin')
    const sum = result.items.reduce((total, item) => total + (item.nutrients?.kcal ?? 0), 0)
    // Lệch tối đa vài kcal do làm tròn từng dòng.
    expect(Math.abs(sum - result.total.kcal)).toBeLessThanOrEqual(2)
  })

  it('nguyên liệu có số riêng thì share = false, chưa có thì share = true', () => {
    const result = detail('pho-bo-chin')
    expect(result.items.find((item) => item.name === 'Bánh phở')?.share).toBe(false)
    expect(result.items.find((item) => item.name === 'Thịt bò chín')?.share).toBe(true)
  })

  it('đổi gram một nguyên liệu share thì mọi nguyên liệu khác giữ nguyên số của chúng', () => {
    const base = detail('pho-bo-chin')
    const more = detail('pho-bo-chin', { componentGrams: { 'Thịt bò chín': 120 } })
    for (const name of ['Bánh phở', 'Nước dùng xương', 'Hành, rau thơm']) {
      expect(more.items.find((item) => item.name === name)?.nutrients?.kcal, name).toBe(
        base.items.find((item) => item.name === name)?.nutrients?.kcal,
      )
    }
  })

  it('cả món co giãn thì phần share co giãn theo', () => {
    const half = detail('pho-bo-chin', { grams: 225 })
    const base = detail('pho-bo-chin')
    const baseBeef = base.items.find((item) => item.name === 'Thịt bò chín')!.nutrients!.kcal
    const halfBeef = half.items.find((item) => item.name === 'Thịt bò chín')!.nutrients!.kcal
    expect(halfBeef).toBeCloseTo(baseBeef / 2, 0)
  })

  it('không còn gì để chia thì từ chối chứ không bịa: nguyên liệu có số riêng đã bằng cả món', () => {
    // Món 100 g, 100 kcal; "Gạo" có số riêng 200 kcal/100 g chiếm hết 100 g → phần còn lại bằng 0.
    const gao = {
      slug: 'gao',
      nameVi: 'Gạo',
      kind: 'ingredient' as const,
      kcalPer100g: 200,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    }
    const mon = {
      slug: 'mon',
      nameVi: 'Món thử',
      kind: 'dish' as const,
      servingGrams: 100,
      kcalPer100g: 100,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      components: [
        { name: 'Gạo', grams: 50, ingredientSlug: 'gao' },
        { name: 'Nước', grams: 50 },
      ],
    }
    const base = buildDishDetail(mon, [gao, mon], {})
    expect(base.ok && base.detail.items.find((item) => item.name === 'Nước')?.nutrients).toBeNull()

    const result = buildDishDetail(mon, [gao, mon], { componentGrams: { Nước: 80 } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/Không chia được kcal/)
  })

  it('từ chối nguyên liệu không có trong món và liệt kê những nguyên liệu có', () => {
    const result = buildDishDetail(entry('pho-bo'), FIXTURE_CATALOGUE, {
      componentGrams: { 'Cá hồi': 50 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/Bánh phở tươi/)
  })

  it('không cho trộn chỉnh cả món với chỉnh từng nguyên liệu', () => {
    const result = buildDishDetail(entry('pho-bo'), FIXTURE_CATALOGUE, {
      grams: 400,
      componentGrams: { 'Thịt bò nạc': 100 },
    })
    expect(result.ok).toBe(false)
  })

  it('món chưa có danh sách nguyên liệu thì nói rõ và đề nghị khối lượng cả món', () => {
    const bare = { ...entry('pho-bo'), components: undefined }
    const result = buildDishDetail(bare, FIXTURE_CATALOGUE, {
      componentGrams: { 'Thịt bò nạc': 100 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/khối lượng cả món/)
  })
})

describe('parseComponentGrams — đọc gram từng nguyên liệu từ câu khách nói', () => {
  const pho = entry('pho-bo')
  const parse = (text: string, target = pho) =>
    parseComponentGrams(text, target.components ?? [], target.nameVi)

  it('"thịt bò 120g" thành gram của nguyên liệu trong món, khoá là tên nguyên liệu của món', () => {
    expect(parse('phở bò thịt bò 120g')).toEqual({ 'Thịt bò nạc': 120 })
    expect(parse('120 g thịt bò')).toEqual({ 'Thịt bò nạc': 120 })
    expect(parse('thịt bò là 120g')).toEqual({ 'Thịt bò nạc': 120 })
  })

  it('đọc được nhiều nguyên liệu, số thập phân và kg', () => {
    expect(parse('thịt bò 120g, bánh phở 300 g')).toEqual({
      'Thịt bò nạc': 120,
      'Bánh phở tươi': 300,
    })
    expect(parse('bánh phở 0,3kg')).toEqual({ 'Bánh phở tươi': 300 })
  })

  it('con số đứng cạnh TÊN MÓN là khối lượng cả món, không phải nguyên liệu', () => {
    expect(parse('phở bò 400g')).toEqual({})
    // Món "Phở bò chín" có nguyên liệu "Bánh phở": tên món không được bị hiểu thành nguyên liệu.
    const chin = entry('pho-bo-chin')
    expect(parse('phở bò chín 450g', chin)).toEqual({})
  })

  it('nguyên liệu không có trong món thì bỏ qua, không đoán', () => {
    expect(parse('cá hồi 100g')).toEqual({})
    expect(parse('gợi ý món 300g')).toEqual({})
  })

  it('câu không có con số thì không có gì', () => {
    expect(parse('thịt bò nhiều hơn một chút')).toEqual({})
  })

  it('món không có danh sách nguyên liệu thì không đọc được gì', () => {
    expect(parseComponentGrams('thịt bò 100g', [], 'Phở bò')).toEqual({})
  })
})
