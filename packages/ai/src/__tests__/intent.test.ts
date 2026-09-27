import { describe, expect, it } from 'vitest'

import { detectChatIntent } from '../intent'

describe('detectChatIntent', () => {
  it.each([
    ['Lên lịch tập cho mình', 'workout'],
    ['tap gi de giam mo', 'workout'],
    ['Lên thực đơn cả tuần cho mình', 'plan'],
    ['thuc don giam can', 'plan'],
    ['Tối nay ăn gì?', 'suggest'],
    ['Gợi ý cho mình bữa tối nhẹ', 'suggest'],
    ['Giải thích TDEE của mình', 'targets'],
    ['Sáng nay mình ăn phở bò', 'other'],
  ])('"%s" → %s', (text, kind) => {
    expect(detectChatIntent(text).kind).toBe(kind)
  })

  it('thực đơn "hôm nay" là thực đơn một ngày', () => {
    expect(detectChatIntent('thực đơn hôm nay')).toEqual({ kind: 'plan', days: 1 })
    expect(detectChatIntent('thực đơn tuần này')).toEqual({ kind: 'plan', days: 7 })
  })

  it('nhận ra bữa và ý "nhẹ" trong câu gợi ý', () => {
    expect(detectChatIntent('gợi ý bữa tối nhẹ')).toEqual({
      kind: 'suggest',
      mealType: 'dinner',
      light: true,
    })
    expect(detectChatIntent('ăn gì bây giờ')).toEqual({
      kind: 'suggest',
      mealType: null,
      light: false,
    })
  })
})
