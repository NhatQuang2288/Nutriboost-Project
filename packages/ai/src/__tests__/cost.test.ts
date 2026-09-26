import { describe, expect, it } from 'vitest'

import {
  addUsage,
  cacheHitRate,
  computeCacheStorageCostUsd,
  computeCostUsd,
  formatUsd,
} from '../cost'

/**
 * Chi phí, theo bảng giá DeepSeek.
 *
 * Thứ Ba 22/09/2026, 02:00 UTC — trong khung cao điểm 01:00–04:00.
 * `deepseek-flash` cao điểm: vào 0,3 · ra 1,2 · cache 0,006 USD mỗi 1M token.
 */
const PEAK = new Date('2026-09-22T02:00:00Z')
/** Cùng ngày, 12:00 UTC — thấp điểm, đúng bằng một nửa giá. */
const OFF_PEAK = new Date('2026-09-22T12:00:00Z')

describe('computeCostUsd', () => {
  it('tính đúng khi không có cache', () => {
    // (1000 × 0,3 + 500 × 1,2) / 1e6 = 0,0009
    const cost = computeCostUsd(
      'deepseek-flash',
      { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 },
      PEAK,
    )
    expect(cost).toBe(0.0009)
  })

  it('trừ token cache khỏi phần tính giá đầy đủ', () => {
    // Không cache 200 × 0,3 + cache 800 × 0,006 + ra 500 × 1,2 = 664,8 / 1e6
    const cost = computeCostUsd(
      'deepseek-flash',
      { inputTokens: 1000, outputTokens: 500, cachedTokens: 800 },
      PEAK,
    )
    expect(cost).toBe(0.000665)
  })

  it('cache làm giảm chi phí thật', () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
    const khongCache = computeCostUsd('deepseek-flash', usage, PEAK)
    const coCache = computeCostUsd('deepseek-flash', { ...usage, cachedTokens: 1000 }, PEAK)
    expect(coCache).toBeLessThan(khongCache)
  })

  it('giờ thấp điểm rẻ đúng bằng một nửa giờ cao điểm', () => {
    /*
     * Đây là điểm khác Gemini rõ nhất. DeepSeek tính một nửa giá ngoài hai khung cao điểm, và
     * phần lớn thời gian trong ngày là thấp điểm — nên nếu bỏ qua chuyện giờ giấc thì
     * `ai_calls.cost_usd` bị thổi lên gần gấp đôi, và phân tích biên trong docs/PRICING.md
     * mất giá trị.
     */
    /*
     * Chọn token tròn để phép so sánh không phụ thuộc làm tròn: `computeCostUsd` làm tròn 6
     * chữ số để khớp cột `numeric(10,6)`, nên với số lẻ thì "gấp đôi" chỉ đúng trong phạm vi
     * một đơn vị ở chữ số cuối — và một test như vậy sẽ đỏ vì lý do không liên quan tới logic.
     *
     * Cao điểm: 1M vào không cache × 0,3 + 1M cache × 0,006 + 1M ra × 1,2 = 1,506 USD
     * Thấp điểm: đúng một nửa = 0,753 USD
     */
    const usage = { inputTokens: 2_000_000, outputTokens: 1_000_000, cachedTokens: 1_000_000 }
    const caoDiem = computeCostUsd('deepseek-flash', usage, PEAK)
    const thapDiem = computeCostUsd('deepseek-flash', usage, OFF_PEAK)

    expect(caoDiem).toBe(1.506)
    expect(thapDiem).toBe(0.753)
    expect(thapDiem * 2).toBeCloseTo(caoDiem, 10)
  })

  it('cuối tuần tính giá thấp điểm dù đúng khung giờ cao điểm', () => {
    // Thứ Bảy 26/09/2026, 02:00 UTC.
    const weekend = new Date('2026-09-26T02:00:00Z')
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }

    expect(computeCostUsd('deepseek-flash', usage, weekend)).toBe(
      computeCostUsd('deepseek-flash', usage, OFF_PEAK),
    )
  })

  it('model chất lượng đắt hơn model nhanh', () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
    expect(computeCostUsd('deepseek-v4-pro', usage, PEAK)).toBeGreaterThan(
      computeCostUsd('deepseek-flash', usage, PEAK),
    )
    // Và vẫn đắt hơn ở thấp điểm: hai mức giá chênh nhau chứ không triệt tiêu nhau.
    expect(computeCostUsd('deepseek-v4-pro', usage, OFF_PEAK)).toBeGreaterThan(
      computeCostUsd('deepseek-flash', usage, OFF_PEAK),
    )
  })

  it('làm tròn 6 chữ số thập phân để khớp cột numeric(10,6)', () => {
    const cost = computeCostUsd(
      'deepseek-flash',
      { inputTokens: 137, outputTokens: 29, cachedTokens: 3 },
      PEAK,
    )
    expect(Number.isInteger(cost * 1_000_000)).toBe(true)
  })

  it('bỏ qua token âm hoặc không hữu hạn', () => {
    const cost = computeCostUsd(
      'deepseek-flash',
      { inputTokens: -100, outputTokens: Number.NaN, cachedTokens: -5 },
      PEAK,
    )
    expect(cost).toBe(0)
  })

  it('không tính âm khi cache lớn hơn tổng đầu vào', () => {
    const cost = computeCostUsd(
      'deepseek-flash',
      { inputTokens: 100, outputTokens: 0, cachedTokens: 500 },
      PEAK,
    )
    expect(cost).toBeGreaterThanOrEqual(0)
  })
})

describe('computeCacheStorageCostUsd', () => {
  it('bằng 0 vì DeepSeek không thu phí lưu cache', () => {
    // Khác Gemini: Gemini tính tiền lưu cache theo giờ. DeepSeek lưu KV cache miễn phí và chỉ
    // thu ở token đọc lại. Giữ nguyên cách tính của Gemini ở đây là cộng thêm một khoản không
    // tồn tại vào nhật ký chi phí.
    expect(computeCacheStorageCostUsd('deepseek-flash', 1_000_000, 2, PEAK)).toBe(0)
  })

  it('bằng 0 khi không có token hoặc không có giờ', () => {
    expect(computeCacheStorageCostUsd('deepseek-flash', 0, 5, PEAK)).toBe(0)
    expect(computeCacheStorageCostUsd('deepseek-flash', 1000, 0, PEAK)).toBe(0)
  })
})

describe('tiện ích', () => {
  it('cộng dồn usage', () => {
    expect(
      addUsage(
        { inputTokens: 10, outputTokens: 5, cachedTokens: 2 },
        { inputTokens: 20, outputTokens: 8, cachedTokens: 3 },
      ),
    ).toEqual({ inputTokens: 30, outputTokens: 13, cachedTokens: 5 })
  })

  it('tính tỉ lệ trúng cache', () => {
    expect(cacheHitRate({ inputTokens: 1000, outputTokens: 0, cachedTokens: 800 })).toBeCloseTo(0.8)
    expect(cacheHitRate({ inputTokens: 0, outputTokens: 0, cachedTokens: 0 })).toBe(0)
  })

  it('kẹp tỉ lệ trúng cache ở 1', () => {
    expect(cacheHitRate({ inputTokens: 100, outputTokens: 0, cachedTokens: 500 })).toBe(1)
  })

  it('định dạng USD theo độ lớn', () => {
    expect(formatUsd(0.0004)).toBe('$0.0004')
    expect(formatUsd(0.42)).toBe('$0.42')
  })
})
