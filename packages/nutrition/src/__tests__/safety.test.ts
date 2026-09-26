import { describe, expect, it } from 'vitest'

import { classifyBmi } from '../bmi'
import { REFERRAL_SENTENCE, assessSafety } from '../safety'

describe('assessSafety', () => {
  it('không có yếu tố nào thì mức là ok', () => {
    const result = assessSafety({ bmi: 22, age: 30, goal: 'maintain', medicalFlags: [] })
    expect(result.level).toBe('ok')
    expect(result.reasons).toEqual([])
    expect(result.blockWeightLoss).toBe(false)
  })

  it('chuyển hướng chuyên gia khi dưới 18 tuổi', () => {
    const result = assessSafety({ bmi: 21, age: 16, goal: 'maintain', medicalFlags: [] })
    expect(result.level).toBe('refer')
    expect(result.reasons.join(' ')).toContain('dưới 18 tuổi')
  })

  it('chuyển hướng và khoá giảm cân khi mang thai', () => {
    const result = assessSafety({
      bmi: 24,
      age: 28,
      goal: 'lose',
      medicalFlags: ['pregnancy'],
    })
    expect(result.level).toBe('refer')
    expect(result.blockWeightLoss).toBe(true)
  })

  it('chuyển hướng khi có tiền sử rối loạn ăn uống', () => {
    const result = assessSafety({
      bmi: 24,
      age: 22,
      goal: 'maintain',
      medicalFlags: ['eating_disorder'],
    })
    expect(result.level).toBe('refer')
    expect(result.reasons.join(' ')).toContain('rối loạn ăn uống')
  })

  it('một bệnh nền mạn tính chỉ ở mức thận trọng', () => {
    const result = assessSafety({
      bmi: 23,
      age: 45,
      goal: 'maintain',
      medicalFlags: ['diabetes'],
    })
    expect(result.level).toBe('caution')
    expect(result.blockWeightLoss).toBe(false)
  })

  it('từ hai bệnh nền trở lên thì chuyển hướng', () => {
    const result = assessSafety({
      bmi: 23,
      age: 60,
      goal: 'maintain',
      medicalFlags: ['diabetes', 'gout'],
    })
    expect(result.level).toBe('refer')
  })

  it('khoá giảm cân khi BMI dưới ngưỡng thiếu cân', () => {
    const maintain = assessSafety({ bmi: 17, age: 25, goal: 'maintain', medicalFlags: [] })
    expect(maintain.level).toBe('caution')
    expect(maintain.blockWeightLoss).toBe(true)

    const lose = assessSafety({ bmi: 17, age: 25, goal: 'lose', medicalFlags: [] })
    expect(lose.level).toBe('refer')
  })

  it('cảnh báo ở mức béo phì độ I và chuyển hướng ở độ II', () => {
    expect(assessSafety({ bmi: 26, age: 35, goal: 'lose', medicalFlags: [] }).level).toBe('caution')
    expect(assessSafety({ bmi: 32, age: 35, goal: 'lose', medicalFlags: [] }).level).toBe('refer')
  })

  it('không suy giảm mức khi có nhiều lý do nhẹ', () => {
    const result = assessSafety({
      bmi: 26,
      age: 50,
      goal: 'lose',
      medicalFlags: ['hypertension'],
    })
    expect(result.level).toBe('caution')
    expect(result.reasons.length).toBeGreaterThanOrEqual(2)
  })

  it('câu chuyển hướng nêu rõ không thay thế tư vấn y khoa', () => {
    expect(REFERRAL_SENTENCE).toContain('không thay thế tư vấn y khoa')
  })
})

describe('ngưỡng an toàn khớp bảng phân loại BMI', () => {
  // Hai hằng số trong safety.ts được viết tường minh để tránh lỗi suy ra từ mảng dải.
  // Test này giữ chúng không lệch khỏi BMI_BANDS.
  it('mốc chuyển hướng trùng với điểm bắt đầu béo phì độ II', () => {
    expect(classifyBmi(30, 'asia')).toBe('obese_2')
    expect(classifyBmi(29.9, 'asia')).toBe('obese_1')
    expect(assessSafety({ bmi: 30, age: 35, goal: 'lose', medicalFlags: [] }).level).toBe('refer')
  })

  it('mốc thận trọng trùng với điểm bắt đầu béo phì độ I', () => {
    expect(classifyBmi(25, 'asia')).toBe('obese_1')
    expect(classifyBmi(24.9, 'asia')).toBe('at_risk')
    expect(assessSafety({ bmi: 25, age: 35, goal: 'lose', medicalFlags: [] }).level).toBe('caution')
  })
})
