import { describe, expect, it } from 'vitest'

import {
  ageAt,
  ageFromIsoDate,
  formatIsoDate,
  localDateIn,
  localTimeLabel,
  relativeTimeVi,
  weekdayLabel,
} from './date'

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

describe('ageFromIsoDate', () => {
  const today = '2026-09-18'

  it('tính đúng khi đã qua sinh nhật trong năm nay', () => {
    expect(ageFromIsoDate('1996-03-01', today)).toBe(30)
  })

  it('chưa trừ tuổi khi chưa tới sinh nhật', () => {
    // Sinh ngày 20/12: ngày 18/09 vẫn chưa đủ tuổi. Chỉ lấy hiệu hai năm sẽ ra 30, sai.
    expect(ageFromIsoDate('1996-12-20', today)).toBe(29)
  })

  it('đúng vào chính ngày sinh nhật', () => {
    expect(ageFromIsoDate('1996-09-18', today)).toBe(30)
  })

  it('đúng một ngày trước sinh nhật', () => {
    expect(ageFromIsoDate('1996-09-19', today)).toBe(29)
  })

  it('trả về 0 khi chuỗi không đọc được', () => {
    expect(ageFromIsoDate('không phải ngày', today)).toBe(0)
  })
})

describe('relativeTimeVi', () => {
  const now = new Date('2026-09-18T12:00:00Z')

  it('trả về null khi không có mốc thời gian', () => {
    // Nơi gọi tự quyết định câu chữ: "chưa từng hoạt động" khác "hoạt động cách đây rất lâu".
    expect(relativeTimeVi(null, now)).toBeNull()
  })

  it('dưới một phút là "vừa xong"', () => {
    expect(relativeTimeVi('2026-09-18T11:59:30Z', now)).toBe('Vừa xong')
  })

  it('đếm bằng phút rồi bằng giờ', () => {
    expect(relativeTimeVi('2026-09-18T11:30:00Z', now)).toBe('30 phút trước')
    expect(relativeTimeVi('2026-09-18T09:00:00Z', now)).toBe('3 giờ trước')
  })

  it('đếm bằng ngày', () => {
    expect(relativeTimeVi('2026-09-15T12:00:00Z', now)).toBe('3 ngày trước')
  })

  it('quá 30 ngày thì hiện ngày cụ thể', () => {
    // Ở khoảng cách đó người đọc cần biết ngày nào, không phải số ngày.
    expect(relativeTimeVi('2026-07-01T12:00:00Z', now)).toBe('01/07/2026')
  })

  it('mốc ở tương lai không thành "sắp tới"', () => {
    // Đồng hồ máy chủ và máy khách lệch nhau là chuyện thường.
    expect(relativeTimeVi('2026-09-18T12:05:00Z', now)).toBe('Vừa xong')
  })

  it('chuỗi không đọc được trả về null thay vì NaN', () => {
    expect(relativeTimeVi('hôm qua', now)).toBeNull()
  })
})
