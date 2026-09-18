import { describe, expect, it } from 'vitest'

import { deriveClientStatus, explainClientAttention, weightDelta } from './pt-live'

/**
 * Ba hàm suy diễn mà PT nhìn thấy trực tiếp.
 *
 * Đây là chỗ dễ sai âm thầm nhất của console: một câu "cần chú ý" sai khiến PT gọi điện cho
 * khách không có vấn đề gì, và một trạng thái "đang theo" sai khiến PT bỏ quên người đã ba
 * tuần không ghi gì.
 */

const TODAY = '2026-09-18'

describe('deriveClientStatus', () => {
  const base = {
    linkStatus: 'active',
    onboarded: true,
    hasHealthProfile: true,
    lastLogDate: TODAY,
    today: TODAY,
  }

  it('khách vừa ghi hôm nay là đang theo', () => {
    expect(deriveClientStatus(base)).toBe('active')
  })

  it('lời mời chưa được nhận là đang thiết lập', () => {
    expect(deriveClientStatus({ ...base, linkStatus: 'pending' })).toBe('onboarding')
  })

  it('chưa hoàn tất hồ sơ là đang thiết lập', () => {
    expect(deriveClientStatus({ ...base, onboarded: false })).toBe('onboarding')
    expect(deriveClientStatus({ ...base, hasHealthProfile: false })).toBe('onboarding')
  })

  it('chưa từng ghi gì là cần chú ý', () => {
    // Khác hẳn "bỏ từ lâu": người chưa từng bắt đầu cần một cuộc gọi hướng dẫn, không phải
    // một lời nhắc.
    expect(deriveClientStatus({ ...base, lastLogDate: null })).toBe('at_risk')
  })

  it('đúng ba ngày không ghi thì bắt đầu cần chú ý', () => {
    // Biên là chỗ dễ lệch một ngày, và lệch một ngày ở đây là đổi hẳn kết luận.
    expect(deriveClientStatus({ ...base, lastLogDate: '2026-09-16' })).toBe('active')
    expect(deriveClientStatus({ ...base, lastLogDate: '2026-09-15' })).toBe('at_risk')
  })

  it('bỏ lâu thì vẫn là cần chú ý', () => {
    expect(deriveClientStatus({ ...base, lastLogDate: '2026-08-01' })).toBe('at_risk')
  })

  it('qua tháng vẫn đếm đúng số ngày', () => {
    // 01/09 → 18/09 là 17 ngày. Cộng trừ theo tháng là chỗ dễ sai nhất.
    expect(deriveClientStatus({ ...base, lastLogDate: '2026-09-01' })).toBe('at_risk')
  })
})

describe('explainClientAttention', () => {
  it('không có lý do nào cho khách đang theo', () => {
    expect(explainClientAttention('active', 6)).toBeNull()
  })

  it('nêu đúng chuyện chưa thiết lập xong', () => {
    expect(explainClientAttention('onboarding', 0)).toBe('Chưa hoàn tất thiết lập hồ sơ')
  })

  it('phân biệt chưa từng ghi với ghi ít', () => {
    // Hai tình huống này cần hai việc làm khác nhau, nên câu chữ phải khác nhau.
    expect(explainClientAttention('at_risk', 0)).toMatch(/Chưa ghi bữa nào/)
    expect(explainClientAttention('at_risk', 2)).toBe('Chỉ ghi 2/7 ngày gần đây')
  })
})

describe('weightDelta', () => {
  it('tính chênh lệch giữa lần đo đầu và lần đo cuối', () => {
    expect(
      weightDelta([
        { measuredOn: '2026-09-01', weightKg: 74 },
        { measuredOn: '2026-09-10', weightKg: 73.2 },
        { measuredOn: '2026-09-18', weightKg: 72.6 },
      ]),
    ).toBe(-1.4)
  })

  it('trả về 0 khi chưa đủ hai lần đo', () => {
    // Một điểm không phải một xu hướng, và hiện "+0 kg" còn tệ hơn không hiện gì.
    expect(weightDelta([])).toBe(0)
    expect(weightDelta([{ measuredOn: '2026-09-18', weightKg: 70 }])).toBe(0)
  })

  it('làm tròn một chữ số thập phân', () => {
    expect(
      weightDelta([
        { measuredOn: '2026-09-01', weightKg: 70.14 },
        { measuredOn: '2026-09-18', weightKg: 71.87 },
      ]),
    ).toBe(1.7)
  })

  it('nhận cả tăng cân', () => {
    expect(
      weightDelta([
        { measuredOn: '2026-09-01', weightKg: 55 },
        { measuredOn: '2026-09-18', weightKg: 56.5 },
      ]),
    ).toBe(1.5)
  })
})
