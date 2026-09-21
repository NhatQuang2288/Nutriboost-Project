import { describe, expect, it } from 'vitest'

import { localHourIn, mealTypeForHour } from './meal-time'

describe('mealTypeForHour', () => {
  it('chia bữa theo nếp ăn Việt Nam', () => {
    expect(mealTypeForHour(7)).toBe('breakfast')
    expect(mealTypeForHour(12)).toBe('lunch')
    expect(mealTypeForHour(16)).toBe('snack')
    expect(mealTypeForHour(19)).toBe('dinner')
    expect(mealTypeForHour(23)).toBe('snack')
  })

  it('các mốc biên thuộc về bữa đúng', () => {
    // Sai một mốc là bữa ăn rơi vào ô sai trên mọi màn hình thống kê.
    expect(mealTypeForHour(4)).toBe('breakfast')
    expect(mealTypeForHour(9)).toBe('breakfast')
    expect(mealTypeForHour(10)).toBe('lunch')
    expect(mealTypeForHour(14)).toBe('lunch')
    expect(mealTypeForHour(15)).toBe('snack')
    expect(mealTypeForHour(17)).toBe('dinner')
    expect(mealTypeForHour(20)).toBe('dinner')
    expect(mealTypeForHour(21)).toBe('snack')
  })

  it('mọi giờ trong ngày đều ra một bữa hợp lệ', () => {
    const slots = new Set(['breakfast', 'lunch', 'dinner', 'snack'])
    for (let hour = 0; hour < 24; hour += 1) {
      expect(slots.has(mealTypeForHour(hour))).toBe(true)
    }
  })

  it('giờ không hợp lệ rơi về snack thay vì làm vỡ luồng ghi', () => {
    expect(mealTypeForHour(Number.NaN)).toBe('snack')
    expect(mealTypeForHour(Number.POSITIVE_INFINITY)).toBe('snack')
  })
})

describe('localHourIn', () => {
  it('lấy giờ theo múi giờ, không theo giờ máy chủ', () => {
    // 05:00 UTC = 12:00 giờ Việt Nam — đây chính là ca dễ ghi sai bữa nhất.
    const moment = new Date('2026-09-19T05:00:00Z')

    expect(localHourIn('Asia/Ho_Chi_Minh', moment)).toBe(12)
    expect(localHourIn('UTC', moment)).toBe(5)
  })

  it('qua ngày mới vẫn trả giờ trong khoảng 0–23', () => {
    // 23:00 UTC = 06:00 hôm sau giờ Việt Nam.
    const moment = new Date('2026-09-19T23:00:00Z')
    const hour = localHourIn('Asia/Ho_Chi_Minh', moment)

    expect(hour).toBe(6)
    expect(hour).toBeGreaterThanOrEqual(0)
    expect(hour).toBeLessThan(24)
  })
})
