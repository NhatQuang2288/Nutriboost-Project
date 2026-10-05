import { describe, expect, it } from 'vitest'

import { buildDishDetail, sumKnownItems } from '../dish-math'
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

  it('chỉ nguyên liệu có số trên 100 g mới có kcal riêng; còn lại là null, không bịa', () => {
    const result = detail('pho-bo-chin')
    expect(result.items.find((item) => item.name === 'Bánh phở')?.nutrients?.kcal).toBe(286)
    expect(result.items.find((item) => item.name === 'Thịt bò chín')?.nutrients).toBeNull()
    // Tổng của món là số của cả món, không phải tổng các thành phần đã biết.
    expect(sumKnownItems(result.items).kcal).toBeLessThan(result.total.kcal)
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

  it('TỪ CHỐI khi nguyên liệu chưa có số liệu riêng, thay vì đoán', () => {
    const result = buildDishDetail(entry('pho-bo-chin'), FIXTURE_CATALOGUE, {
      componentGrams: { 'Thịt bò chín': 100 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/Chưa có số dinh dưỡng riêng/)
      expect(result.reason).toMatch(/cả món/)
    }
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
