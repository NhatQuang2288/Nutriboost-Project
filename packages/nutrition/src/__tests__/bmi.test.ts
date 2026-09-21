import { describe, expect, it } from 'vitest'

import { bmi, classifyBmi, computeBmi, healthyWeightRangeKg } from '../bmi'

describe('bmi', () => {
  it('tính đúng chỉ số BMI và làm tròn 1 chữ số', () => {
    // 70 / 1,70² = 24,2214… → 24,2
    expect(bmi(70, 170)).toBe(24.2)
    // 50 / 1,55² = 20,8116… → 20,8
    expect(bmi(50, 155)).toBe(20.8)
  })

  it('từ chối dữ liệu không hợp lệ', () => {
    expect(() => bmi(0, 170)).toThrow(RangeError)
    expect(() => bmi(70, 0)).toThrow(RangeError)
    expect(() => bmi(Number.NaN, 170)).toThrow(RangeError)
  })

  describe('phân loại theo chuẩn châu Á (mặc định)', () => {
    it.each([
      [17, 'underweight'],
      [18.5, 'normal'],
      [22.9, 'normal'],
      [23, 'at_risk'],
      [24.9, 'at_risk'],
      [25, 'obese_1'],
      [29.9, 'obese_1'],
      [30, 'obese_2'],
    ] as const)('BMI %s → %s', (value, expected) => {
      expect(classifyBmi(value, 'asia')).toBe(expected)
    })
  })

  describe('phân loại theo chuẩn WHO', () => {
    it.each([
      [17, 'underweight'],
      [24.9, 'normal'],
      [25, 'overweight'],
      [30, 'obese_1'],
      [35, 'obese_2'],
    ] as const)('BMI %s → %s', (value, expected) => {
      expect(classifyBmi(value, 'who')).toBe(expected)
    })
  })

  it('người Việt được phân loại nghiêm hơn ở cùng một chỉ số', () => {
    // Ở BMI 24, chuẩn châu Á đã cảnh báo còn chuẩn WHO vẫn coi là bình thường.
    expect(classifyBmi(24, 'asia')).toBe('at_risk')
    expect(classifyBmi(24, 'who')).toBe('normal')
  })

  it('trả về kết quả kèm nhãn tiếng Việt', () => {
    const result = computeBmi(70, 170)
    expect(result).toEqual({
      bmi: 24.2,
      category: 'at_risk',
      standard: 'asia',
      label: 'Thừa cân (nguy cơ)',
    })
  })

  it('tính khoảng cân nặng khoẻ mạnh theo chiều cao', () => {
    // 1,70² × 18,5 = 53,5 ; 1,70² × 23 = 66,5
    expect(healthyWeightRangeKg(170, 'asia')).toEqual({ minKg: 53.5, maxKg: 66.5 })
  })
})
