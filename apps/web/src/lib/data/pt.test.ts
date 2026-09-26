import { describe, expect, it } from 'vitest'

import { formatReminderDays } from './pt'

describe('formatReminderDays', () => {
  it('cả tuần thì viết "mỗi ngày"', () => {
    expect(formatReminderDays([0, 1, 2, 3, 4, 5, 6])).toBe('mỗi ngày')
  })

  it('thứ Hai tới thứ Sáu thì viết "các ngày trong tuần"', () => {
    expect(formatReminderDays([1, 2, 3, 4, 5])).toBe('các ngày trong tuần')
  })

  it('một vài ngày thì liệt kê, sắp xếp tăng dần', () => {
    // CSDL không bảo đảm thứ tự của mảng, nên hàm phải tự sắp.
    expect(formatReminderDays([5, 1, 3])).toBe('T2, T4, T6')
  })

  it('khử ngày trùng lặp', () => {
    // "T2, T2" là lỗi hiển thị, không phải thông tin.
    expect(formatReminderDays([1, 1, 3])).toBe('T2, T4')
  })

  it('bỏ qua giá trị ngoài 0..6 thay vì hiện "?"', () => {
    expect(formatReminderDays([1, 9, -2])).toBe('T2')
  })

  it('mảng rỗng thì nói thẳng là không có ngày nào', () => {
    expect(formatReminderDays([])).toBe('không ngày nào')
  })

  it('Chủ nhật là 0, đứng đầu tuần theo nếp Việt Nam', () => {
    expect(formatReminderDays([0, 1])).toBe('CN, T2')
  })
})
