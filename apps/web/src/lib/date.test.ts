import { describe, expect, it } from 'vitest'

import { ageAt, formatIsoDate, localDateIn, localTimeLabel, weekdayLabel } from './date'

describe('formatIsoDate', () => {
  it('đổi sang nếp ngày của người Việt', () => {
    expect(formatIsoDate('2026-09-18')).toBe('18/09/2026')
    expect(formatIsoDate('2026-01-02')).toBe('02/01/2026')
  })

  it('bỏ phần giờ khi chuỗi là timestamptz', () => {
    // Cột `current_period_end` là `date`, nhưng PostgREST trả về kèm giờ ở một số cấu hình.
    expect(formatIsoDate('2026-09-18T00:00:00+07:00')).toBe('18/09/2026')
  })

  it('không phụ thuộc múi giờ của máy chạy', () => {
    // `new Date('2026-09-18')` là nửa đêm UTC. Ở múi giờ âm nó lùi thành 17/09, nên cắt chuỗi
    // là cách duy nhất luôn cho đúng ngày đã ghi.
    expect(formatIsoDate('2026-09-18')).toBe('18/09/2026')
  })

  it('trả về nguyên chuỗi khi không đúng định dạng', () => {
    expect(formatIsoDate('không phải ngày')).toBe('không phải ngày')
  })
})

describe('localDateIn', () => {
  it('lấy ngày theo múi giờ Việt Nam, không theo UTC', () => {
    // 22:30 UTC ngày 17/09 là 05:30 ngày 18/09 giờ Việt Nam. Dùng `toISOString().slice(0, 10)`
    // sẽ trả về nhầm ngày 17 — đúng khoảng thời gian người dùng hay ghi nhật ký bữa tối.
    const evening = new Date('2026-09-17T22:30:00Z')
    expect(localDateIn('Asia/Ho_Chi_Minh', evening)).toBe('2026-09-18')
  })
})

describe('localTimeLabel', () => {
  it('hiện giờ địa phương dạng 24 giờ', () => {
    expect(localTimeLabel('2026-09-18T00:05:00Z', 'Asia/Ho_Chi_Minh')).toBe('07:05')
  })
})

describe('weekdayLabel', () => {
  it('trả về thứ trong tuần bằng tiếng Việt', () => {
    expect(weekdayLabel(new Date('2026-09-18T03:00:00Z'), 'Asia/Ho_Chi_Minh')).toMatch(/thứ/i)
  })
})

describe('ageAt', () => {
  it('tính tuổi đầy đủ', () => {
    expect(ageAt(1994, new Date('2026-09-18T00:00:00Z'))).toBe(32)
  })

  it('không trả về số âm khi năm sinh ở tương lai', () => {
    expect(ageAt(2030, new Date('2026-09-18T00:00:00Z'))).toBe(0)
  })
})
