import { describe, expect, it } from 'vitest'

import {
  addUsage,
  cacheHitRate,
  computeCacheStorageCostUsd,
  computeCostUsd,
  formatUsd,
} from '../cost'

const AT = new Date('2026-09-18T00:00:00Z')

describe('computeCostUsd', () => {
  it('tính đúng khi không có cache', () => {
    // (1000 × 0,75 + 500 × 3,75) / 1e6 = 0,002625
    const cost = computeCostUsd(
      'gemini-3.8-flash',
      { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 },
      AT,
    )
    expect(cost).toBe(0.002625)
  })

  it('trừ token cache khỏi phần tính giá đầy đủ', () => {
    // Phần không cache 200 × 0,75 + cache 800 × 0,075 + ra 500 × 3,75 = 2 085 / 1e6
    const cost = computeCostUsd(
      'gemini-3.8-flash',
      { inputTokens: 1000, outputTokens: 500, cachedTokens: 800 },
      AT,
    )
    expect(cost).toBe(0.002085)
  })

  it('cache làm giảm chi phí thật', () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
    const khongCache = computeCostUsd('gemini-3.8-flash', usage, AT)
    const coCache = computeCostUsd('gemini-3.8-flash', { ...usage, cachedTokens: 1000 }, AT)
    expect(coCache).toBeLessThan(khongCache)
  })

  it('dùng bảng giá của model rẻ hơn cho model rẻ', () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
    const chatLuong = computeCostUsd('gemini-3.8-flash', usage, AT)
    const nhanh = computeCostUsd('gemini-3.5-flash-lite', usage, AT)
    const reNhat = computeCostUsd('gemini-3.1-flash-lite', usage, AT)

    expect(nhanh).toBeLessThan(chatLuong)
    expect(reNhat).toBeLessThan(nhanh)
  })

  it('đổi theo mốc giá: cùng lượt gọi, chi phí khác nhau sau 01/01/2027', () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 }
    const truoc = computeCostUsd('gemini-3.8-flash', usage, new Date('2026-12-31T00:00:00Z'))
    const sau = computeCostUsd('gemini-3.8-flash', usage, new Date('2027-01-01T00:00:00Z'))
    expect(sau).toBeCloseTo(truoc * 2, 6)
  })

  it('làm tròn 6 chữ số thập phân để khớp cột numeric(10,6)', () => {
    const cost = computeCostUsd(
      'gemini-3.5-flash-lite',
      { inputTokens: 137, outputTokens: 29, cachedTokens: 3 },
      AT,
    )
    expect(Number.isInteger(cost * 1_000_000)).toBe(true)
  })

  it('bỏ qua token âm hoặc không hữu hạn', () => {
    const cost = computeCostUsd(
      'gemini-3.5-flash-lite',
      { inputTokens: -100, outputTokens: Number.NaN, cachedTokens: -5 },
      AT,
    )
    expect(cost).toBe(0)
  })

  it('không tính âm khi cache lớn hơn tổng đầu vào', () => {
    const cost = computeCostUsd(
      'gemini-3.5-flash-lite',
      { inputTokens: 100, outputTokens: 0, cachedTokens: 500 },
      AT,
    )
    expect(cost).toBeGreaterThanOrEqual(0)
  })
})

describe('computeCacheStorageCostUsd', () => {
  it('tính chi phí lưu cache theo giờ', () => {
    // 1 000 000 token × 0,5 USD/1M/giờ × 2 giờ = 1 USD
    expect(computeCacheStorageCostUsd('gemini-3.8-flash', 1_000_000, 2, AT)).toBe(1)
  })

  it('bằng 0 khi không có token hoặc không có giờ', () => {
    expect(computeCacheStorageCostUsd('gemini-3.8-flash', 0, 5, AT)).toBe(0)
    expect(computeCacheStorageCostUsd('gemini-3.8-flash', 1000, 0, AT)).toBe(0)
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
