import { describe, expect, it } from 'vitest'

import { MODEL_PRICES, isKnownModel, isOffPeak, knownModels, priceFor, rateFor } from '../prices'

/**
 * Bảng giá DeepSeek.
 *
 * Điểm khác Gemini đáng chú ý nhất: DeepSeek tính **một nửa giá** ngoài giờ cao điểm, nên một
 * mốc giá có hai mức chứ không phải một con số. Bỏ sót chuyện đó làm `ai_calls.cost_usd` lệch
 * tới gấp đôi.
 */

/** Thứ Ba 22/09/2026, 02:00 UTC — nằm trong khung cao điểm 01:00–04:00. */
const PEAK = new Date('2026-09-22T02:00:00Z')
/** Thứ Ba 22/09/2026, 12:00 UTC — ngoài mọi khung cao điểm. */
const OFF_PEAK = new Date('2026-09-22T12:00:00Z')
/** Thứ Bảy 26/09/2026, 02:00 UTC — trong khung giờ cao điểm nhưng là cuối tuần. */
const WEEKEND = new Date('2026-09-26T02:00:00Z')

describe('isOffPeak', () => {
  it('giờ cao điểm trong ngày thường KHÔNG phải thấp điểm', () => {
    expect(isOffPeak(PEAK)).toBe(false)
  })

  it('buổi trưa ngày thường là thấp điểm', () => {
    expect(isOffPeak(OFF_PEAK)).toBe(true)
  })

  it('cả ngày cuối tuần là thấp điểm, kể cả trong khung giờ cao điểm', () => {
    // Tài liệu DeepSeek nói rõ: ngoài hai khung cao điểm thì mọi giờ là thấp điểm, và cuối
    // tuần được tính trọn ngày.
    expect(isOffPeak(WEEKEND)).toBe(true)
    expect(isOffPeak(new Date('2026-09-27T02:00:00Z'))).toBe(true) // Chủ nhật
  })

  it('đúng hai khung cao điểm 01:00–04:00 và 06:00–10:00 UTC', () => {
    for (const hour of [1, 2, 3, 6, 7, 8, 9]) {
      expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, hour, 0, 0))), `${hour}:00`).toBe(false)
    }
    for (const hour of [0, 4, 5, 10, 11, 12, 23]) {
      expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, hour, 0, 0))), `${hour}:00`).toBe(true)
    }
  })

  it('biên của khung được tính đúng', () => {
    // 04:00 đã ra khỏi khung 01:00–04:00, 10:00 đã ra khỏi khung 06:00–10:00. Lệch một phút
    // ở đây là đổi hẳn mức giá.
    expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, 3, 59, 59)))).toBe(false)
    expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, 4, 0, 0)))).toBe(true)
    expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, 9, 59, 59)))).toBe(false)
    expect(isOffPeak(new Date(Date.UTC(2026, 8, 22, 10, 0, 0)))).toBe(true)
  })
})

describe('priceFor', () => {
  it('trả về mốc giá của model nhanh', () => {
    const tier = priceFor('deepseek-flash', PEAK)
    expect(tier.peak.outputPerMillion).toBe(1.2)
    expect(tier.offPeak?.outputPerMillion).toBe(0.6)
  })

  it('trả về mốc giá của model chất lượng', () => {
    const tier = priceFor('deepseek-v4-pro', PEAK)
    expect(tier.peak.inputPerMillion).toBe(1.32)
    expect(tier.peak.outputPerMillion).toBe(3.96)
  })

  it('báo lỗi rõ ràng khi model chưa có bảng giá', () => {
    expect(() => priceFor('model-khong-ton-tai')).toThrow(/Chưa có bảng giá/)
  })

  it('mọi model đều có mốc giá dương và cache rẻ hơn đầu vào thường', () => {
    for (const model of knownModels()) {
      const tier = priceFor(model, PEAK)
      expect(tier.peak.inputPerMillion, model).toBeGreaterThan(0)
      expect(tier.peak.outputPerMillion, model).toBeGreaterThan(0)
      expect(tier.peak.cachedInputPerMillion, model).toBeLessThan(tier.peak.inputPerMillion)
    }
  })

  it('các mốc giá được sắp xếp tăng dần theo thời gian', () => {
    for (const entry of Object.values(MODEL_PRICES)) {
      const times = entry.tiers.map((tier) => new Date(tier.effectiveFrom).getTime())
      expect(times).toEqual([...times].sort((a, b) => a - b))
    }
  })

  it('chỉ có model DeepSeek trong bảng', () => {
    // Bảng này chỉ dùng cho lời gọi MỚI. Chi phí lời gọi cũ đã nằm trong `ai_calls.cost_usd`
    // tại thời điểm gọi, nên giữ model cũ ở đây chỉ làm người đọc tưởng chúng còn được dùng.
    expect(knownModels().every((model) => model.startsWith('deepseek-'))).toBe(true)
    expect(isKnownModel('deepseek-flash')).toBe(true)
    expect(isKnownModel('gemini-3.8-flash')).toBe(false)
  })
})

describe('rateFor', () => {
  it('dùng giá cao điểm trong khung cao điểm', () => {
    expect(rateFor('deepseek-flash', PEAK).outputPerMillion).toBe(1.2)
  })

  it('dùng giá thấp điểm ngoài khung, đúng bằng một nửa', () => {
    const peak = rateFor('deepseek-flash', PEAK)
    const off = rateFor('deepseek-flash', OFF_PEAK)

    expect(off.outputPerMillion).toBe(0.6)
    expect(off.outputPerMillion).toBeCloseTo(peak.outputPerMillion / 2, 10)
    expect(off.inputPerMillion).toBeCloseTo(peak.inputPerMillion / 2, 10)
    expect(off.cachedInputPerMillion).toBeCloseTo(peak.cachedInputPerMillion / 2, 10)
  })

  it('model chất lượng đắt hơn model nhanh ở cả hai mức giá', () => {
    expect(rateFor('deepseek-v4-pro', PEAK).outputPerMillion).toBeGreaterThan(
      rateFor('deepseek-flash', PEAK).outputPerMillion,
    )
    expect(rateFor('deepseek-v4-pro', OFF_PEAK).outputPerMillion).toBeGreaterThan(
      rateFor('deepseek-flash', OFF_PEAK).outputPerMillion,
    )
  })
})

describe('cấu trúc bảng giá', () => {
  it('mọi mốc đều có ngày hiệu lực đọc được', () => {
    for (const [model, entry] of Object.entries(MODEL_PRICES)) {
      expect(entry.model, model).toBe(model)
      expect(entry.tiers.length, model).toBeGreaterThan(0)
      for (const tier of entry.tiers) {
        expect(Number.isNaN(Date.parse(tier.effectiveFrom)), `${model} ${tier.effectiveFrom}`).toBe(
          false,
        )
      }
    }
  })

  it('DeepSeek không thu phí lưu cache, nên đơn giá đó bằng 0', () => {
    // Gemini tính tiền lưu cache theo giờ, DeepSeek thì không. Giữ nguyên mức của Gemini ở đây
    // sẽ cộng thêm một khoản chi phí không tồn tại.
    for (const model of knownModels()) {
      expect(priceFor(model, PEAK).peak.cacheStoragePerMillionHour, model).toBe(0)
    }
  })
})
