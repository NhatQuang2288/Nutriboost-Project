import { describe, expect, it } from 'vitest'

import {
  FALLBACK_REMINDER_MESSAGES,
  QUIET_HOURS_END,
  QUIET_HOURS_START,
  SEND_WINDOW_MINUTES,
  buildReminderMessagePrompt,
  decideReminder,
  defaultReminderRules,
  isQuietHour,
  localNow,
  maxRemindersPerDay,
  minutesOfDay,
  type LocalNow,
  type ReminderRule,
} from '../reminders'

/** 2026-09-21 là thứ Hai. 05:30 UTC = 12:30 giờ Việt Nam. */
const MONDAY_NOON_VN = new Date('2026-09-21T05:30:00Z')

const RULE: ReminderRule = {
  kind: 'log_meal',
  time: '12:30',
  days: [1, 2, 3, 4, 5],
  enabled: true,
}

const NOW: LocalNow = { date: '2026-09-21', time: '12:30', weekday: 1 }

describe('minutesOfDay', () => {
  it('đổi giờ hợp lệ sang phút', () => {
    expect(minutesOfDay('00:00')).toBe(0)
    expect(minutesOfDay('12:30')).toBe(750)
    expect(minutesOfDay('23:59')).toBe(1439)
  })

  it('chấp nhận giờ một chữ số', () => {
    expect(minutesOfDay('7:05')).toBe(425)
  })

  it('trả null cho giá trị không hợp lệ', () => {
    for (const bad of ['', '25:00', '12:60', 'abc', '12', '12:5']) {
      expect(minutesOfDay(bad), `phải từ chối "${bad}"`).toBeNull()
    }
  })
})

describe('isQuietHour', () => {
  it('im lặng từ 21:30 tới 06:30', () => {
    expect(isQuietHour(QUIET_HOURS_START)).toBe(true)
    expect(isQuietHour(QUIET_HOURS_END - 1)).toBe(true)
    expect(isQuietHour(QUIET_HOURS_END)).toBe(false)
    expect(isQuietHour(QUIET_HOURS_START - 1)).toBe(false)
  })

  it('không im lặng vào ban ngày', () => {
    expect(isQuietHour(12 * 60)).toBe(false)
    expect(isQuietHour(18 * 60)).toBe(false)
  })
})

describe('localNow', () => {
  it('đọc đúng giờ địa phương theo múi giờ truyền vào', () => {
    const vn = localNow('Asia/Ho_Chi_Minh', MONDAY_NOON_VN)
    expect(vn.date).toBe('2026-09-21')
    expect(vn.time).toBe('12:30')
    expect(vn.weekday).toBe(1)
  })

  it('KHÔNG phụ thuộc múi giờ của máy chạy', () => {
    const utc = localNow('UTC', MONDAY_NOON_VN)
    expect(utc.time).toBe('05:30')
    expect(utc.date).toBe('2026-09-21')
  })

  it('đổi ngày đúng khi lệch múi giờ qua nửa đêm', () => {
    // 21:00 UTC ngày 20 = 04:00 ngày 21 giờ Việt Nam.
    const now = localNow('Asia/Ho_Chi_Minh', new Date('2026-09-20T21:00:00Z'))
    expect(now.date).toBe('2026-09-21')
    expect(now.time).toBe('04:00')
  })

  it('trả đúng thứ trong tuần', () => {
    expect(localNow('Asia/Ho_Chi_Minh', MONDAY_NOON_VN).weekday).toBe(1)
    // 2026-09-27 là Chủ nhật.
    expect(localNow('Asia/Ho_Chi_Minh', new Date('2026-09-27T05:00:00Z')).weekday).toBe(0)
  })
})

describe('decideReminder', () => {
  it('gửi khi đúng ngày, đúng giờ', () => {
    expect(decideReminder(RULE, NOW, false)).toEqual({ send: true, reason: 'đến giờ gửi' })
  })

  it('không gửi khi luật đang tắt', () => {
    expect(decideReminder({ ...RULE, enabled: false }, NOW, false)).toEqual({
      send: false,
      reason: 'đang tắt',
    })
  })

  it('không gửi sai ngày trong tuần', () => {
    // Chủ nhật không nằm trong `days`.
    const sunday: LocalNow = { ...NOW, weekday: 0 }
    expect(decideReminder(RULE, sunday, false).reason).toBe('không phải ngày gửi')
  })

  it('không gửi trùng trong cùng ngày', () => {
    expect(decideReminder(RULE, NOW, true).reason).toBe('đã gửi hôm nay')
  })

  it('không gửi trong giờ yên tĩnh', () => {
    const late: LocalNow = { ...NOW, time: '22:00' }
    expect(decideReminder({ ...RULE, time: '22:00' }, late, false).reason).toBe(
      'trong giờ yên tĩnh',
    )
  })

  it('không gửi khi chưa tới khung giờ', () => {
    const early: LocalNow = { ...NOW, time: '11:00' }
    expect(decideReminder(RULE, early, false).reason).toBe('chưa tới giờ')
  })

  it('không gửi khi đã quá khung giờ', () => {
    const late: LocalNow = { ...NOW, time: '14:00' }
    expect(decideReminder(RULE, late, false).reason).toBe('đã quá khung giờ')
  })

  it('gửi được ở cả hai mép của khung giờ', () => {
    const before: LocalNow = { ...NOW, time: '12:10' }
    const after: LocalNow = { ...NOW, time: '12:50' }
    expect(decideReminder(RULE, before, false).send).toBe(true)
    expect(decideReminder(RULE, after, false).send).toBe(true)
  })

  it('không gửi ngay ngoài khung giờ', () => {
    const justOutside: LocalNow = { ...NOW, time: '12:51' }
    expect(SEND_WINDOW_MINUTES).toBe(20)
    expect(decideReminder(RULE, justOutside, false).send).toBe(false)
  })

  it('từ chối khi giờ hẹn không hợp lệ thay vì gửi bừa', () => {
    expect(decideReminder({ ...RULE, time: '25:00' }, NOW, false).reason).toBe(
      'giờ hẹn không hợp lệ',
    )
    expect(decideReminder(RULE, { ...NOW, time: 'sai' }, false).reason).toBe(
      'giờ hiện tại không hợp lệ',
    )
  })

  it('luôn trả về lý do, kể cả khi không gửi', () => {
    const cases: [ReminderRule, LocalNow, boolean][] = [
      [{ ...RULE, enabled: false }, NOW, false],
      [RULE, { ...NOW, weekday: 0 }, false],
      [RULE, NOW, true],
      [RULE, { ...NOW, time: '23:00' }, false],
    ]
    for (const [rule, now, sent] of cases) {
      const decision = decideReminder(rule, now, sent)
      expect(decision.send).toBe(false)
      expect(decision.reason.length).toBeGreaterThan(0)
    }
  })
})

describe('defaultReminderRules', () => {
  it('có đủ năm loại nhắc', () => {
    const rules = defaultReminderRules({ goal: 'lose' })
    expect(rules).toHaveLength(5)
    expect(rules.map((rule) => rule.kind).sort()).toEqual([
      'hydration',
      'log_meal',
      'weekly_checkin',
      'weigh_in',
      'workout',
    ])
  })

  it('KHÔNG đặt nhắc trong giờ yên tĩnh', () => {
    for (const rule of defaultReminderRules({ goal: 'lose' })) {
      const minutes = minutesOfDay(rule.time)
      expect(minutes, `giờ của ${rule.kind}`).not.toBeNull()
      expect(isQuietHour(minutes!), `${rule.kind} rơi vào giờ yên tĩnh`).toBe(false)
    }
  })

  it('không nhắc quá bốn lần mỗi ngày', () => {
    // Nhắc nhiều khiến người dùng tắt thông báo, và khi đã tắt thì không nhắc được gì.
    expect(maxRemindersPerDay(defaultReminderRules({ goal: 'lose' }))).toBeLessThanOrEqual(4)
  })

  it('nhắc tập rơi đúng ngày tập đã khai', () => {
    const rules = defaultReminderRules({ goal: 'gain', trainingDays: [2, 4, 6] })
    const workout = rules.find((rule) => rule.kind === 'workout')
    expect(workout?.days).toEqual([2, 4, 6])
  })

  it('nhắc cân rơi đúng ngày đã khai', () => {
    const rules = defaultReminderRules({ goal: 'maintain', weighInDay: 5 })
    expect(rules.find((rule) => rule.kind === 'weigh_in')?.days).toEqual([5])
  })

  it('mọi giờ đều hợp lệ', () => {
    for (const rule of defaultReminderRules({ goal: 'lose' })) {
      expect(minutesOfDay(rule.time)).not.toBeNull()
    }
  })
})

describe('buildReminderMessagePrompt', () => {
  it('neo đúng phiên bản prompt', () => {
    const prompt = buildReminderMessagePrompt({ kind: 'log_meal', name: 'Minh', facts: [] })
    expect(prompt.version).toBe('reminder-message@v1')
  })

  it('ràng buộc độ dài để thông báo đẩy không bị cắt', () => {
    const prompt = buildReminderMessagePrompt({ kind: 'workout', name: 'Minh', facts: [] })
    expect(prompt.system).toContain('120 ký tự')
  })

  it('CẤM gây cảm giác tội lỗi — đây là lý do người dùng tắt thông báo', () => {
    const prompt = buildReminderMessagePrompt({ kind: 'hydration', name: 'Minh', facts: [] })
    expect(prompt.system).toContain('KHÔNG gây cảm giác tội lỗi')
    expect(prompt.system).toContain('lại quên')
  })

  it('cấm nội dung y khoa', () => {
    const prompt = buildReminderMessagePrompt({ kind: 'weigh_in', name: 'Minh', facts: [] })
    expect(prompt.system.toLowerCase()).toContain('không chẩn đoán')
  })

  it('đưa số liệu và buổi tập vào ngữ cảnh', () => {
    const prompt = buildReminderMessagePrompt({
      kind: 'workout',
      name: 'Minh',
      facts: ['còn 620 kcal'],
      sessionFocus: 'Thân trên',
    })
    expect(prompt.user).toContain('Minh')
    expect(prompt.user).toContain('còn 620 kcal')
    expect(prompt.user).toContain('Thân trên')
  })

  it('bỏ qua phần ngữ cảnh trống thay vì để dòng rỗng', () => {
    const prompt = buildReminderMessagePrompt({ kind: 'hydration', name: 'Minh', facts: [] })
    expect(prompt.user).not.toContain('\n\n')
  })
})

describe('lời nhắn dự phòng', () => {
  it('có sẵn cho mọi loại nhắc để luôn gửi được khi AI lỗi', () => {
    for (const kind of [
      'log_meal',
      'weigh_in',
      'workout',
      'hydration',
      'weekly_checkin',
    ] as const) {
      const message = FALLBACK_REMINDER_MESSAGES[kind]
      expect(message.length).toBeGreaterThan(0)
      expect(message.length).toBeLessThanOrEqual(120)
    }
  })

  it('không dùng từ ngữ gây cảm giác tội lỗi', () => {
    for (const message of Object.values(FALLBACK_REMINDER_MESSAGES)) {
      for (const banned of ['lại quên', 'bỏ', 'cố lên', 'kém']) {
        expect(message.toLowerCase()).not.toContain(banned)
      }
    }
  })
})
