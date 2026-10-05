import { describe, expect, it } from 'vitest'

import { classifyIntent } from '../intents'
import { createMealEstimator } from '../meal-estimator'
import { FIXTURE_CATALOGUE } from './fixtures'

const estimator = createMealEstimator(FIXTURE_CATALOGUE)
const intent = (text: string) => classifyIntent(text, estimator)

describe('classifyIntent — gợi ý món', () => {
  it('câu hỏi gợi ý đã từng bị coi là bữa ăn "không nhận ra món nào"', () => {
    expect(intent('bạn có đề xuất món ăn gì cho ngày hôm nay không').kind).toBe('suggest')
    expect(intent('hôm nay nên ăn gì').kind).toBe('suggest')
    expect(intent('tư vấn giúp mình món nào hợp lý').kind).toBe('suggest')
  })

  it('nhận bữa trong ngày, và phân biệt "tối" với "tôi"', () => {
    expect(intent('gợi ý món cho bữa tối')).toMatchObject({ mealType: 'dinner' })
    expect(intent('gợi ý món cho bữa sáng')).toMatchObject({ mealType: 'breakfast' })
    expect(intent('gợi ý món bữa trưa')).toMatchObject({ mealType: 'lunch' })
    // "tôi" là đại từ, không phải buổi tối.
    expect(intent('cho tôi gợi ý món')).not.toHaveProperty('mealType')
  })

  it('nhận mục tiêu khách nói ra', () => {
    expect(intent('gợi ý món để giảm cân')).toMatchObject({ goal: 'lose' })
    expect(intent('gợi ý món để tăng cân')).toMatchObject({ goal: 'gain' })
    expect(intent('gợi ý món để giữ cân')).toMatchObject({ goal: 'maintain' })
  })

  it('"nhẹ" nghĩa là giảm cân và có trần kcal', () => {
    expect(intent('Gợi ý bữa tối nhẹ')).toMatchObject({
      mealType: 'dinner',
      goal: 'lose',
      filters: { maxKcal: 450 },
    })
  })

  it('đọc yêu cầu loại trừ, kể cả nhiều thứ và viết không dấu', () => {
    expect(intent('gợi ý món không ăn hải sản và tôm')).toMatchObject({
      filters: { exclude: ['hai san', 'tom'] },
    })
    expect(intent('goi y mon khong an ca')).toMatchObject({ filters: { exclude: ['ca'] } })
  })

  it('đọc trần kcal, đạm, béo, món chay và nhóm món', () => {
    expect(intent('gợi ý món dưới 400 kcal')).toMatchObject({ filters: { maxKcal: 400 } })
    expect(intent('gợi ý món nhiều đạm')).toMatchObject({ filters: { minProteinG: 20 } })
    expect(intent('gợi ý món ít béo')).toMatchObject({ filters: { maxFatG: 12 } })
    expect(intent('gợi ý món chay')).toMatchObject({ filters: { vegetarian: true } })
    expect(intent('gợi ý món bún')).toMatchObject({ filters: { categories: ['bun'] } })
  })

  it('"chạy bộ" không bị hiểu là món chay', () => {
    const result = intent('gợi ý món ăn sau khi chạy bộ')
    expect(result.kind).toBe('suggest')
    expect(result).not.toMatchObject({ filters: { vegetarian: true } })
  })
})

describe('classifyIntent — hỏi chi tiết món', () => {
  it('nhận câu hỏi nguyên liệu và dinh dưỡng của một món có trong danh mục', () => {
    expect(intent('phở bò chín gồm nguyên liệu gì')).toEqual({
      kind: 'detail',
      slug: 'pho-bo-chin',
    })
    expect(intent('thành phần dinh dưỡng của bún tôm')).toMatchObject({
      kind: 'detail',
      slug: 'bun-tom',
    })
  })

  it('đọc khối lượng khách cung cấp', () => {
    expect(intent('phở bò chín 300g bao nhiêu calo')).toEqual({
      kind: 'detail',
      slug: 'pho-bo-chin',
      grams: 300,
    })
    expect(intent('nguyên liệu phở bò chín 0,5 kg')).toMatchObject({ grams: 500 })
  })

  it('hỏi chi tiết nhưng không có món nào trong danh mục thì không đoán', () => {
    expect(intent('thành phần của món zzzzz').kind).toBe('meal')
  })
})

describe('classifyIntent — những câu khác', () => {
  it('hỏi còn bao nhiêu kcal không phải bữa ăn', () => {
    expect(intent('Hôm nay mình còn bao nhiêu calo?')).toEqual({ kind: 'remaining' })
  })

  it('kể bữa ăn vẫn là bữa ăn — không được làm hỏng luồng ghi nhật ký', () => {
    expect(intent('sáng nay mình ăn phở bò')).toEqual({ kind: 'meal' })
    expect(intent('trưa ăn cơm tấm sườn')).toEqual({ kind: 'meal' })
    expect(intent('2 bát phở bò chín')).toEqual({ kind: 'meal' })
  })
})
