import { describe, expect, it } from 'vitest'

import {
  ACTIVITY_CODES,
  ACTIVITY_LABELS_VI,
  MET_VALUES,
  activityLog,
  isActivityCode,
  kcalBurnedForActivity,
  kcalBurnedForMet,
  totalKcalBurned,
} from '../met'
import {
  SERVING_MULTIPLIERS,
  gramsForKcal,
  gramsFromServing,
  scaleNutrients,
  sumNutrients,
} from '../scale'

describe('kcalBurnedForMet', () => {
  it('khớp công thức MET × 3,5 × kg / 200 × phút', () => {
    // 3,5 × 3,5 × 70 / 200 × 30 = 128,625 → 129
    expect(kcalBurnedForMet(3.5, 70, 30)).toBe(129)
  })

  it('tính theo từng bộ môn', () => {
    // Chạy bộ MET 9,8: 9,8 × 3,5 × 70 / 200 × 30 = 360,15 → 360
    expect(kcalBurnedForActivity('running', 70, 30)).toBe(360)
    expect(kcalBurnedForActivity('yoga', 70, 30)).toBe(92)
  })

  it('từ chối đầu vào không hợp lệ', () => {
    expect(() => kcalBurnedForMet(0, 70, 30)).toThrow(RangeError)
    expect(() => kcalBurnedForMet(3.5, 0, 30)).toThrow(RangeError)
    expect(() => kcalBurnedForMet(3.5, 70, 0)).toThrow(RangeError)
  })
})

describe('danh mục hoạt động', () => {
  it('mọi mã đều có MET dương và nhãn tiếng Việt', () => {
    for (const code of ACTIVITY_CODES) {
      expect(MET_VALUES[code]).toBeGreaterThan(0)
      expect(ACTIVITY_LABELS_VI[code].length).toBeGreaterThan(0)
    }
  })

  it('nhận diện đúng mã hoạt động', () => {
    expect(isActivityCode('running')).toBe(true)
    expect(isActivityCode('bay_luon')).toBe(false)
  })

  it('activityLog trả về đủ trường để ghi CSDL', () => {
    expect(activityLog('cycling', 70, 45)).toEqual({
      code: 'cycling',
      minutes: 45,
      met: 7.5,
      kcal: 413,
    })
  })

  it('cộng dồn kcal tiêu hao', () => {
    expect(totalKcalBurned([{ kcal: 100 }, { kcal: 250 }])).toBe(350)
  })
})

describe('scaleNutrients', () => {
  it('quy đổi chỉ số trên 100 g theo khối lượng ăn', () => {
    const result = scaleNutrients(
      { kcal: 100, proteinG: 5, carbG: 10, fatG: 2, fiberG: 1, sugarG: 3, sodiumMg: 200 },
      150,
    )
    expect(result).toEqual({
      kcal: 150,
      proteinG: 7.5,
      carbG: 15,
      fatG: 3,
      fiberG: 1.5,
      sugarG: 4.5,
      sodiumMg: 300,
    })
  })

  it('coi chỉ số thiếu là 0', () => {
    const result = scaleNutrients({ kcal: 50, proteinG: 1, carbG: 1, fatG: 1 }, 200)
    expect(result.fiberG).toBe(0)
    expect(result.sugarG).toBe(0)
    expect(result.sodiumMg).toBe(0)
  })

  it('cho phép khối lượng 0 nhưng không cho âm', () => {
    expect(scaleNutrients({ kcal: 100, proteinG: 1, carbG: 1, fatG: 1 }, 0).kcal).toBe(0)
    expect(() => scaleNutrients({ kcal: 100, proteinG: 1, carbG: 1, fatG: 1 }, -1)).toThrow(
      RangeError,
    )
  })
})

describe('sumNutrients', () => {
  it('cộng dồn nhiều mục trong một bữa', () => {
    const total = sumNutrients([
      { kcal: 150, proteinG: 7.5, carbG: 15, fatG: 3, fiberG: 1, sugarG: 2, sodiumMg: 100 },
      { kcal: 200, proteinG: 10, carbG: 20, fatG: 5, fiberG: 2, sugarG: 3, sodiumMg: 250 },
    ])
    expect(total).toEqual({
      kcal: 350,
      proteinG: 17.5,
      carbG: 35,
      fatG: 8,
      fiberG: 3,
      sugarG: 5,
      sodiumMg: 350,
    })
  })

  it('trả về 0 cho danh sách rỗng', () => {
    expect(sumNutrients([]).kcal).toBe(0)
  })
})

describe('khẩu phần', () => {
  it('tính gram để đạt mục tiêu kcal', () => {
    expect(gramsForKcal({ kcal: 100, proteinG: 1, carbG: 1, fatG: 1 }, 250)).toBe(250)
  })

  it('trả về 0 khi món không có năng lượng', () => {
    expect(gramsForKcal({ kcal: 0, proteinG: 0, carbG: 0, fatG: 0 }, 250)).toBe(0)
  })

  it('chỉ cho phép các bội số khẩu phần rời rạc', () => {
    expect(SERVING_MULTIPLIERS).toEqual([0.5, 1, 1.5, 2])
    expect(gramsFromServing(300, 1.5)).toBe(450)
    expect(gramsFromServing(250, 0.5)).toBe(125)
  })
})
