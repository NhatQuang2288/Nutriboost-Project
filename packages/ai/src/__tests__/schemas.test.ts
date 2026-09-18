import { describe, expect, it } from 'vitest'

import {
  GENERATIVE_COMPONENT_NAMES,
  parseGenerativePayload,
  validateMealEstimate,
  type ParsedMeal,
} from '../schemas'

const FOOD_A = '11111111-1111-4111-8111-111111111111'
const FOOD_B = '22222222-2222-4222-8222-222222222222'
const FOOD_LA = '33333333-3333-4333-8333-333333333333'

describe('sổ đăng ký generative UI', () => {
  it('có đủ tám thành phần theo đặc tả trợ lý', () => {
    expect(GENERATIVE_COMPONENT_NAMES).toHaveLength(8)
    expect(GENERATIVE_COMPONENT_NAMES).toContain('meal_confirm_card')
    expect(GENERATIVE_COMPONENT_NAMES).toContain('safety_notice_card')
  })

  it('từ chối tên thành phần không có trong sổ đăng ký', () => {
    const result = parseGenerativePayload('evil_component', { anything: true })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('không có trong sổ đăng ký')
    }
  })

  it('từ chối tên rỗng', () => {
    expect(parseGenerativePayload('', {}).ok).toBe(false)
  })

  it('nhận props hợp lệ và trả về payload đã kiểm tra', () => {
    const result = parseGenerativePayload('choice_chips', {
      question: 'Bạn muốn ăn gì cho bữa tối?',
      options: [
        { value: 'nhe', label: 'Món nhẹ' },
        { value: 'dam', label: 'Nhiều đạm' },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.component).toBe('choice_chips')
    }
  })

  it('từ chối props sai kiểu', () => {
    const result = parseGenerativePayload('choice_chips', {
      question: 'Chọn đi',
      options: [{ value: 'a', label: 'A' }],
    })
    // Cần ít nhất 2 lựa chọn.
    expect(result.ok).toBe(false)
  })

  it('từ chối props thiếu trường bắt buộc', () => {
    expect(parseGenerativePayload('meal_confirm_card', { title: 'Bữa sáng' }).ok).toBe(false)
  })

  it('chấp nhận thẻ an toàn với nhiều lý do', () => {
    const result = parseGenerativePayload('safety_notice_card', {
      severity: 'refer',
      reasons: ['BMI ở mức béo phì độ II — nên được bác sĩ đánh giá trước.'],
    })
    expect(result.ok).toBe(true)
  })
})

describe('validateMealEstimate', () => {
  const base: ParsedMeal = {
    items: [
      {
        foodId: FOOD_A,
        displayName: 'Phở bò',
        grams: 500,
        confidence: 0.9,
        quantityBasis: 'serving',
      },
      {
        foodId: FOOD_B,
        displayName: 'Cà phê sữa đá',
        grams: 200,
        confidence: 0.7,
        quantityBasis: 'serving',
      },
    ],
    unmatched: [],
    mealType: 'breakfast',
    needsClarification: false,
    clarifyingQuestion: null,
  }

  it('giữ mọi mục có foodId nằm trong danh sách ứng viên', () => {
    const result = validateMealEstimate(base, [FOOD_A, FOOD_B])
    expect(result.accepted).toHaveLength(2)
    expect(result.rejectedHallucinatedIds).toEqual([])
  })

  it('loại mục có foodId bịa ra ngoài danh sách', () => {
    const result = validateMealEstimate(base, [FOOD_A])
    expect(result.accepted).toHaveLength(1)
    expect(result.accepted[0]?.foodId).toBe(FOOD_A)
    expect(result.rejectedHallucinatedIds).toEqual([FOOD_B])
  })

  it('giữ mục foodId null để người dùng nhập tay', () => {
    const withNull: ParsedMeal = {
      ...base,
      items: [{ ...base.items[0]!, foodId: null, displayName: 'Món lạ' }],
    }
    const result = validateMealEstimate(withNull, [])
    expect(result.accepted).toHaveLength(1)
    expect(result.rejectedHallucinatedIds).toEqual([])
  })

  it('loại sạch khi model bịa toàn bộ id', () => {
    const result = validateMealEstimate(base, [FOOD_LA])
    expect(result.accepted).toHaveLength(0)
    expect(result.rejectedHallucinatedIds).toHaveLength(2)
  })
})
