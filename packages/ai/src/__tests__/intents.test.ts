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

describe('classifyIntent — ngữ cảnh thời tiết và "nhé"', () => {
  it('"trời mưa" là ưu tiên MỀM món nước nóng, không loại món nào', () => {
    const result = intent('hôm nay trời mưa bạn có món ăn gì muốn đề xuất không')
    expect(result.kind).toBe('suggest')
    expect(result).toMatchObject({
      filters: { prefer: expect.arrayContaining(['canh', 'pho', 'lau']) },
    })
    expect(result).not.toMatchObject({ filters: { categories: expect.anything() } })
    expect(result).not.toMatchObject({ filters: { include: expect.anything() } })
  })

  it('trời lạnh, rét cũng vậy; trời nóng thì ưu tiên món thanh mát', () => {
    expect(intent('trời lạnh quá gợi ý món đi')).toMatchObject({
      filters: { prefer: expect.arrayContaining(['canh']) },
    })
    expect(intent('trời nóng bức gợi ý món')).toMatchObject({
      filters: { prefer: expect.arrayContaining(['goi', 'cuon']) },
    })
  })

  it('"mua" không dấu (mua đồ) không bị hiểu là trời mưa', () => {
    expect(intent('mình mua cơm xong gợi ý món')).not.toHaveProperty('filters.prefer')
  })

  it('"nhé" cuối câu không phải "nhẹ": không tự đổi mục tiêu hay đặt trần kcal', () => {
    expect(intent('gợi ý món nhé')).toEqual({ kind: 'suggest', filters: {} })
    expect(intent('gợi ý món nhẹ')).toMatchObject({ goal: 'lose', filters: { maxKcal: 450 } })
  })
})

describe('classifyIntent — nói ý muốn ăn', () => {
  it('"nay tôi muốn ăn thịt" là nhờ tư vấn chứ không phải kể bữa ăn', () => {
    expect(intent('Nay tôi muốn ăn thịt')).toEqual({
      kind: 'suggest',
      filters: { include: ['thit'] },
    })
  })

  it('lấy thứ khách muốn thành bộ lọc "phải có"', () => {
    expect(intent('hôm nay mình muốn ăn phở bò nhé')).toMatchObject({
      kind: 'suggest',
      filters: { include: ['pho bo'] },
    })
    expect(intent('tôi muốn ăn cá và rau')).toMatchObject({ filters: { include: ['ca', 'rau'] } })
  })

  it('"hoặc" nghĩa là một trong các nhóm, không phải tất cả', () => {
    expect(intent('muốn ăn thịt hoặc cá')).toMatchObject({
      filters: { categories: ['thit', 'ca'] },
    })
  })

  it('thèm theo nhóm thì ánh xạ sang nhóm món, không dò chữ ("đồ ngọt" không phải "cải ngọt")', () => {
    expect(intent('hôm nay muốn ăn đồ ngọt')).toMatchObject({
      filters: { categories: ['trang mieng', 'an vat', 'che'] },
    })
  })

  it('chỉ nói "muốn ăn" thì gợi ý chung', () => {
    expect(intent('hôm nay tôi muốn ăn')).toEqual({ kind: 'suggest', filters: {} })
  })

  it('"thêm cơm" vẫn là ghi bữa ăn, không bị hiểu là muốn ăn', () => {
    expect(intent('mình ăn thêm một bát cơm trắng').kind).toBe('meal')
  })

  it('kết hợp được với yêu cầu loại trừ và mục tiêu', () => {
    expect(intent('muốn ăn thịt nhưng không ăn bò, để giảm cân')).toMatchObject({
      goal: 'lose',
      filters: { include: ['thit'], exclude: ['bo'] },
    })
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
