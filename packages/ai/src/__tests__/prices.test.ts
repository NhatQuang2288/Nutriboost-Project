import { describe, expect, it } from 'vitest'

import { MODEL_PRICES, isKnownModel, knownModels, priceFor } from '../prices'

describe('priceFor', () => {
  it('trả về mốc giá hiện hành cho model chất lượng', () => {
    const tier = priceFor('gemini-3.8-flash', new Date('2026-09-18T00:00:00Z'))
    expect(tier.inputPerMillion).toBe(0.75)
    expect(tier.outputPerMillion).toBe(3.75)
    expect(tier.cachedInputPerMillion).toBe(0.075)
  })

  it('đổi sang mốc giá mới đúng ngày hiệu lực', () => {
    const truocDo = priceFor('gemini-3.8-flash', new Date('2026-12-31T23:59:59Z'))
    const sauDo = priceFor('gemini-3.8-flash', new Date('2027-01-01T00:00:00Z'))

    expect(truocDo.outputPerMillion).toBe(3.75)
    // Giá tăng gấp đôi từ 01/01/2027 — đây là lý do bảng giá phải mã hoá ngày hiệu lực.
    expect(sauDo.outputPerMillion).toBe(7.5)
    expect(sauDo.outputPerMillion).toBe(truocDo.outputPerMillion * 2)
  })

  it('giữ nguyên giá cũ cho mốc thời gian trước khi bảng giá tồn tại', () => {
    const tier = priceFor('gemini-3.5-flash-lite', new Date('2020-01-01T00:00:00Z'))
    expect(tier.inputPerMillion).toBe(0.3)
  })

  it('báo lỗi rõ ràng khi model chưa có bảng giá', () => {
    expect(() => priceFor('gemini-khong-ton-tai')).toThrow(/Chưa có bảng giá/)
  })

  it('mọi model đều có ít nhất một mốc giá dương', () => {
    for (const model of knownModels()) {
      const tier = priceFor(model, new Date('2026-09-18T00:00:00Z'))
      expect(tier.inputPerMillion).toBeGreaterThan(0)
      expect(tier.outputPerMillion).toBeGreaterThan(0)
      expect(tier.cachedInputPerMillion).toBeLessThan(tier.inputPerMillion)
    }
  })

  it('các mốc giá được sắp xếp tăng dần theo thời gian', () => {
    for (const entry of Object.values(MODEL_PRICES)) {
      const times = entry.tiers.map((tier) => new Date(tier.effectiveFrom).getTime())
      const sorted = [...times].sort((a, b) => a - b)
      expect(times).toEqual(sorted)
    }
  })

  it('nhận diện model đã biết', () => {
    expect(isKnownModel('gemini-3.8-flash')).toBe(true)
    expect(isKnownModel('gpt-4')).toBe(false)
  })
})
