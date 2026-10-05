import { describe, expect, it } from 'vitest'

import { computeDishCard } from './dish-card'
import { MEAL_CATALOGUE } from './meal-estimator'

/**
 * Phép tính phía máy chủ mà thẻ chi tiết món gọi mỗi khi khách sửa khối lượng. Dùng danh mục thật
 * (bảng VDD + món cũ) để chứng minh khách sửa được trên chính những món họ thấy.
 */

const ok = (input: unknown) => {
  const result = computeDishCard(MEAL_CATALOGUE, input)
  if (!result.ok) throw new Error(result.message)
  return result.card
}

describe('computeDishCard — sửa khối lượng cả món', () => {
  it('co giãn tuyến tính theo gram khách nêu, cho món VDD', () => {
    const base = ok({ foodId: 'bun-thang' })
    const half = ok({ foodId: 'bun-thang', grams: base.grams / 2 })

    expect(half.customised).toBe(true)
    expect(half.grams).toBe(base.grams / 2)
    expect(half.total.kcal).toBeCloseTo(base.total.kcal / 2, -0.5)
    expect(half.items.find((item) => item.name === 'Bún tươi')?.grams).toBe(
      (base.items.find((item) => item.name === 'Bún tươi')?.grams ?? 0) / 2,
    )
  })
})

describe('computeDishCard — sửa gram từng nguyên liệu', () => {
  it('bún (có số trên 100 g) sửa được và tổng của món tính lại đúng phần chênh', () => {
    const base = ok({ foodId: 'bun-thang' })
    const baseBun = base.items.find((item) => item.name === 'Bún tươi')!
    const more = ok({ foodId: 'bun-thang', componentGrams: { 'Bún tươi': baseBun.grams + 100 } })

    // +100 g bún × 110 kcal/100 g = +110 kcal.
    expect(more.total.kcal - base.total.kcal).toBe(110)
    expect(more.grams).toBe(base.grams + 100)
    expect(more.items.find((item) => item.name === 'Bún tươi')).toMatchObject({
      grams: baseBun.grams + 100,
      adjusted: true,
    })
  })

  it('món cũ có gram thật: sửa được thịt bò, và đúng với tính tay', () => {
    const base = ok({ foodId: 'pho-bo' })
    const more = ok({ foodId: 'pho-bo', componentGrams: { 'Thịt bò nạc': 120 } })
    // Thêm 40 g thịt bò nạc (118 kcal/100 g) = +47 kcal.
    expect(more.total.kcal - base.total.kcal).toBe(47)
  })

  it('nguyên liệu chưa có số liệu riêng: nói thẳng lý do, không đoán', () => {
    const result = computeDishCard(MEAL_CATALOGUE, {
      foodId: 'bun-thang',
      componentGrams: { 'Giò lụa': 100 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/Chưa có số dinh dưỡng riêng cho "Giò lụa"/)
  })
})

describe('computeDishCard — đầu vào xấu', () => {
  it.each([
    [{ foodId: 'khong-co-mon-nay' }, /Không tìm thấy món/],
    [{ foodId: 'bun-thang', grams: 0 }, /./],
    [{ foodId: 'bun-thang', grams: -5 }, /./],
    [{ foodId: 'bun-thang', grams: 99_999 }, /./],
    [{ foodId: 'bun-thang', componentGrams: { 'Bún tươi': -1 } }, /./],
    [{ grams: 100 }, /./],
    ['không phải object', /./],
  ])('từ chối %j', (input, message) => {
    const result = computeDishCard(MEAL_CATALOGUE, input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(message)
  })

  it('không cho trộn chỉnh cả món với chỉnh từng nguyên liệu', () => {
    const result = computeDishCard(MEAL_CATALOGUE, {
      foodId: 'bun-thang',
      grams: 300,
      componentGrams: { 'Bún tươi': 200 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/HOẶC/)
  })
})
