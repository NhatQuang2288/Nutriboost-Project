import { describe, expect, it } from 'vitest'

import {
  DEMO_WEEK_DAYS,
  buildDemoProgress,
  buildDemoWeekDays,
  demoEnergyTargets,
} from './demo-week'

/**
 * Tuần mẫu là thứ giao diện dựa vào để vẽ biểu đồ, nên các bất biến dưới đây phải được khoá:
 * đủ bảy ngày, ngày tăng dần, mỗi ngày có số liệu dùng được, và không có giá trị `NaN` nào
 * lọt ra biểu đồ.
 *
 * Ngày được ghim lại thay vì dùng giờ hệ thống — nếu không, test sẽ đổi kết quả theo ngày chạy.
 */
const NOW = new Date('2026-09-19T03:00:00Z')

describe('buildDemoWeekDays', () => {
  it('trả về đúng bảy ngày, cũ nhất trước và hôm nay ở cuối', () => {
    const days = buildDemoWeekDays(NOW)

    expect(days).toHaveLength(DEMO_WEEK_DAYS)
    expect(days[days.length - 1]?.localDate).toBe('2026-09-19')
    expect(days[0]?.localDate).toBe('2026-09-13')

    const dates = days.map((day) => day.localDate)
    expect([...dates].sort()).toEqual(dates)
  })

  it('cân nặng giảm ròng trong tuần nhưng vẫn dao động', () => {
    const weights = buildDemoWeekDays(NOW).map((day) => day.weightKg)
    const first = weights[0]
    const last = weights[weights.length - 1]

    expect(first).toBeDefined()
    expect(last).toBeDefined()
    const delta = (last ?? 0) - (first ?? 0)

    // Xu hướng phải khớp hồ sơ (0,35 kg/tuần) chứ không giảm ào ạt.
    expect(delta).toBeLessThanOrEqual(-0.2)
    expect(delta).toBeGreaterThanOrEqual(-0.8)

    // Phải có ít nhất một ngày tăng so với hôm trước, nếu không thì đây là đường thẳng giả.
    const hasBounce = weights.some((weight, index) => {
      const previous = weights[index - 1]
      return previous !== undefined && weight > previous
    })
    expect(hasBounce).toBe(true)
  })

  it('mỗi ngày có đủ bữa, mỗi bữa có món, và tổng ngày bằng tổng các món', () => {
    for (const day of buildDemoWeekDays(NOW)) {
      expect(day.meals).toHaveLength(4)

      for (const meal of day.meals) {
        expect(meal.items.length).toBeGreaterThan(0)
        expect(meal.total.kcal).toBeGreaterThan(0)

        const sum = meal.items.reduce((total, item) => total + item.kcal, 0)
        expect(meal.total.kcal).toBe(sum)
      }

      const daySum = day.meals.reduce((total, meal) => total + meal.total.kcal, 0)
      expect(day.total.kcal).toBe(daySum)
    }
  })

  it('mọi chỉ số đều là số hữu hạn và không âm', () => {
    for (const day of buildDemoWeekDays(NOW)) {
      expect(Number.isFinite(day.total.kcal)).toBe(true)
      expect(day.total.proteinG).toBeGreaterThan(0)
      expect(day.total.carbG).toBeGreaterThan(0)
      expect(day.total.fatG).toBeGreaterThan(0)
      expect(day.kcalBurned).toBeGreaterThanOrEqual(0)

      for (const meal of day.meals) {
        for (const item of meal.items) {
          expect(Number.isFinite(item.kcal)).toBe(true)
          expect(item.grams).toBeGreaterThan(0)
          expect(item.sodiumMg).toBeGreaterThanOrEqual(0)
          expect(item.displayName.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('năng lượng mỗi ngày nằm trong khoảng hợp lý và bảy ngày không giống hệt nhau', () => {
    const kcal = buildDemoWeekDays(NOW).map((day) => day.total.kcal)

    for (const value of kcal) {
      expect(value).toBeGreaterThan(800)
      expect(value).toBeLessThan(3500)
    }

    // Nếu mọi cột bằng nhau thì biểu đồ vô nghĩa — hệ số khẩu phần tồn tại để tránh điều đó.
    expect(new Set(kcal).size).toBeGreaterThan(1)
  })

  it('mục tiêu năng lượng lấy từ lõi tất định, không phải số viết tay', () => {
    const targets = demoEnergyTargets(NOW)

    expect(targets.targetKcal).toBeGreaterThan(0)
    expect(targets.targetKcal).toBe(demoEnergyTargets(NOW).targetKcal)

    for (const day of buildDemoWeekDays(NOW)) {
      expect(day.targetKcal).toBe(targets.targetKcal)
      expect(day.adherencePct).not.toBeNull()
    }
  })

  it('cùng một mốc thời gian cho ra cùng một tuần', () => {
    expect(buildDemoWeekDays(NOW)).toEqual(buildDemoWeekDays(NOW))
  })
})

describe('buildDemoProgress', () => {
  it('dựng đủ hai chuỗi điểm cho biểu đồ, nhãn theo nếp ngày Việt Nam', () => {
    const view = buildDemoProgress(NOW)

    expect(view.weights).toHaveLength(DEMO_WEEK_DAYS)
    expect(view.kcal).toHaveLength(DEMO_WEEK_DAYS)
    expect(view.targetKcal).toBe(demoEnergyTargets(NOW).targetKcal)

    for (const point of view.weights) {
      // `formatIsoDate` cho ra dd/mm/yyyy — cùng hàm mà nhánh dữ liệu thật dùng.
      expect(point.label).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(point.value).toBeGreaterThan(0)
    }

    for (const point of view.kcal) {
      expect(point.label).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(point.value).toBeGreaterThan(0)
    }
  })
})
