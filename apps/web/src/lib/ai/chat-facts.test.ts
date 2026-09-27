import { describe, expect, it } from 'vitest'

import { buildDemoView } from '@/lib/data/today'

import { buildChatFacts } from './chat-facts'

const NOW = new Date('2026-09-27T12:30:00Z')
const CLOCK = { weekday: 'chủ nhật', time: '19:30' }

describe('buildChatFacts', () => {
  const view = buildDemoView(NOW)
  const facts = buildChatFacts(view, CLOCK)
  const joined = facts.join('\n')

  it('cho Bơ biết bây giờ là mấy giờ, để "tối nay" hiểu đúng bữa', () => {
    expect(facts[0]).toContain('chủ nhật, 19:30')
  })

  it('có hồ sơ và mục tiêu cân nặng — thiếu thì Bơ trả lời như cho người lạ', () => {
    expect(joined).toContain(`${view.profile.weightKg} kg`)
    expect(joined).toMatch(/mục tiêu (giảm|giữ|tăng) cân/)
  })

  it('dùng nguyên số đã tính sẵn, không tính lại', () => {
    expect(joined).toContain(`Mục tiêu mỗi ngày: ${view.targets.targetKcal} kcal`)
    expect(joined).toContain(`Còn lại hôm nay: ${view.remainingKcal} kcal`)
  })

  it('liệt kê bữa đã ghi hôm nay', () => {
    if (view.meals.length === 0) {
      expect(joined).toContain('Bữa đã ghi hôm nay: chưa có')
    } else {
      expect(joined).toContain(view.meals[0]!.items[0]!.nameVi)
    }
  })

  it('nói rõ đây là hồ sơ mẫu ở chế độ dữ liệu mẫu', () => {
    expect(view.source).toBe('demo')
    expect(joined).toContain('HỒ SƠ MẪU')
  })

  it('không nhắc hồ sơ mẫu khi là dữ liệu thật', () => {
    const live = buildChatFacts({ ...view, source: 'live' }, CLOCK).join('\n')
    expect(live).not.toContain('HỒ SƠ MẪU')
  })
})
