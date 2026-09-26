import { describe, expect, it } from 'vitest'

import { type MealCatalogueEntry } from '../meal-estimator'
import { addDays, buildPlan, scaleDishToTarget, MAX_DISHES_PER_MEAL } from '../plan-builder'

const DISHES: readonly MealCatalogueEntry[] = [
  {
    slug: 'pho-bo',
    nameVi: 'Phở bò',
    kind: 'dish',
    servingGrams: 353,
    kcalPer100g: 137,
    proteinG: 7.2,
    carbG: 22.5,
    fatG: 1.9,
  },
  {
    slug: 'com-tam-suon',
    nameVi: 'Cơm tấm sườn',
    kind: 'dish',
    servingGrams: 413,
    kcalPer100g: 132,
    proteinG: 5.4,
    carbG: 16.2,
    fatG: 4.6,
  },
  {
    slug: 'goi-cuon',
    nameVi: 'Gỏi cuốn',
    kind: 'dish',
    servingGrams: 170,
    kcalPer100g: 98,
    proteinG: 7.6,
    carbG: 12.4,
    fatG: 2.1,
  },
  {
    slug: 'gao-te',
    nameVi: 'Gạo tẻ',
    kind: 'ingredient',
    kcalPer100g: 344,
    proteinG: 7.9,
    carbG: 76.2,
    fatG: 1,
  },
]

const TARGETS = { targetKcal: 2000, proteinG: 110, carbG: 230, fatG: 60 }

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

describe('addDays', () => {
  it('cộng ngày trong cùng tháng', () => {
    expect(addDays('2026-09-18', 1)).toBe('2026-09-19')
  })

  it('vượt qua ranh giới tháng', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })

  it('vượt qua ranh giới năm', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('xử lý năm nhuận', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('không lệch ngày dù máy chạy ở múi giờ nào', () => {
    // Dùng Date.UTC nên kết quả không phụ thuộc múi giờ của tiến trình.
    expect(addDays('2026-01-01', 0)).toBe('2026-01-01')
    expect(addDays('2026-03-15', 7)).toBe('2026-03-22')
  })

  it('báo lỗi khi ngày không hợp lệ', () => {
    expect(() => addDays('không-phải-ngày', 1)).toThrow(RangeError)
  })
})

describe('scaleDishToTarget', () => {
  it('nhân khẩu phần để tiệm cận mục tiêu kcal', () => {
    const item = scaleDishToTarget(DISHES[0]!, 500)
    // 500 kcal / 1,37 kcal mỗi gram ≈ 365 g
    expect(item.grams).toBeGreaterThan(340)
    expect(item.grams).toBeLessThan(390)
    expect(Math.abs(item.kcal - 500)).toBeLessThan(30)
  })

  it('kẹp trên ở 2 lần khẩu phần chuẩn', () => {
    // Mục tiêu 3000 kcal cho một bữa không được biến thành 2 kg phở.
    const item = scaleDishToTarget(DISHES[0]!, 3000)
    expect(item.grams).toBe(Math.round(353 * 2))
  })

  it('kẹp dưới ở 0,5 lần khẩu phần chuẩn', () => {
    const item = scaleDishToTarget(DISHES[0]!, 10)
    expect(item.grams).toBe(Math.round(353 * 0.5))
  })

  it('tính đúng đa lượng theo khối lượng', () => {
    // 137 kcal/100 g → mục tiêu 300 kcal cần 219 g, nằm trong khoảng kẹp cho phép.
    const item = scaleDishToTarget(DISHES[0]!, 300)
    expect(item.grams).toBe(219)
    expect(item.kcal).toBe(300)
    expect(item.proteinG).toBe(round1(7.2 * 2.19))
  })

  it('không xuống dưới nửa khẩu phần dù mục tiêu rất nhỏ', () => {
    // Mục tiêu 137 kcal lẽ ra là 100 g, nhưng sàn 0,5 × 353 = 176,5 g mới thắng.
    const item = scaleDishToTarget(DISHES[0]!, 137)
    expect(item.grams).toBe(177)
  })

  it('dùng 100 g làm khẩu phần mặc định khi món không khai báo', () => {
    const noServing: MealCatalogueEntry = { ...DISHES[0]!, servingGrams: undefined, slug: 'x' }
    expect(scaleDishToTarget(noServing, 137).grams).toBe(100)
  })
})

describe('buildPlan', () => {
  it('dựng đúng 7 ngày, mỗi ngày đủ 4 bữa', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    expect(plan.days).toHaveLength(7)
    for (const day of plan.days) {
      expect(day.meals).toHaveLength(4)
    }
  })

  it('ngày trong kế hoạch liên tiếp nhau', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    expect(plan.days[0]?.date).toBe('2026-09-21')
    expect(plan.days[6]?.date).toBe('2026-09-27')
  })

  it('tổng ngày bằng tổng các bữa', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    for (const day of plan.days) {
      const sum = day.meals.reduce((total, meal) => total + meal.totalKcal, 0)
      expect(day.totalKcal).toBe(sum)
    }
  })

  it('cùng đầu vào cho cùng kế hoạch — không phụ thuộc thứ tự gọi', () => {
    const a = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const shuffled = [...DISHES].reverse()
    const b = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: shuffled })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('KHÔNG dùng nguyên liệu thô làm bữa ăn', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const slugs = plan.days.flatMap((day) =>
      day.meals.flatMap((meal) => meal.items.map((item) => item.slug)),
    )
    expect(slugs).not.toContain('gao-te')
  })

  it('tôn trọng danh sách loại trừ', () => {
    const plan = buildPlan({
      weekStart: '2026-09-21',
      targets: TARGETS,
      catalogue: DISHES,
      excludedSlugs: ['pho-bo'],
    })
    const slugs = plan.days.flatMap((day) =>
      day.meals.flatMap((meal) => meal.items.map((item) => item.slug)),
    )
    expect(slugs).not.toContain('pho-bo')
  })

  it('không lặp liền kề cùng một món', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const sequence = plan.days.flatMap((day) =>
      day.meals.flatMap((meal) => meal.items.map((item) => item.slug)),
    )
    for (let index = 1; index < sequence.length; index += 1) {
      expect(sequence[index], `lặp liền kề ở vị trí ${index}`).not.toBe(sequence[index - 1])
    }
  })

  it('cảnh báo khi danh mục quá ít món', () => {
    const plan = buildPlan({
      weekStart: '2026-09-21',
      targets: TARGETS,
      catalogue: [DISHES[0]!],
    })
    expect(plan.notes.join(' ')).toContain('lặp lại')
  })

  it('nói thẳng khi trung bình lệch mục tiêu', () => {
    const plan = buildPlan({
      weekStart: '2026-09-21',
      targets: { ...TARGETS, targetKcal: 400 },
      catalogue: DISHES,
    })
    expect(plan.notes.some((note) => note.includes('lệch'))).toBe(true)
  })

  it('cảnh báo khi đạm thấp hơn mục tiêu', () => {
    const plan = buildPlan({
      weekStart: '2026-09-21',
      targets: { ...TARGETS, proteinG: 300 },
      catalogue: DISHES,
    })
    expect(plan.notes.some((note) => note.includes('đạm'))).toBe(true)
  })

  it('trả về kế hoạch rỗng kèm lý do khi không có món nào dùng được', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: [] })
    expect(plan.days).toEqual([])
    expect(plan.notes[0]).toContain('Không có món nào dùng được')
  })

  it('chỉ có nguyên liệu thô cũng coi như không có món', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: [DISHES[3]!] })
    expect(plan.days).toEqual([])
  })

  it('đổi số ngày và số bữa theo yêu cầu', () => {
    const plan = buildPlan({
      weekStart: '2026-09-21',
      targets: TARGETS,
      catalogue: DISHES,
      days: 3,
      mealsPerDay: ['breakfast', 'lunch'],
    })
    expect(plan.days).toHaveLength(3)
    expect(plan.days[0]?.meals).toHaveLength(2)
  })

  it('tính trung bình ngày đúng', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const average = Math.round(
      plan.days.reduce((sum, day) => sum + day.totalKcal, 0) / plan.days.length,
    )
    expect(plan.averageKcal).toBe(average)
  })

  /*
   * Bữa ăn Việt Nam thường có 2–3 món. Một món duy nhất thường không đủ đạt mục tiêu kcal
   * của bữa, mà khẩu phần lại bị kẹp để tránh đề xuất vô lý — nên phải ghép thêm món.
   * Trước khi có bản ghép nhiều món, phần lớn các ngày đều lệch mục tiêu.
   */
  it('ghép nhiều món trong một bữa khi một món không đủ đạt mục tiêu', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const mealSizes = plan.days.flatMap((day) => day.meals.map((meal) => meal.items.length))
    expect(Math.max(...mealSizes)).toBeGreaterThan(1)
  })

  it('không bao giờ vượt quá số món tối đa của một bữa', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    for (const day of plan.days) {
      for (const meal of day.meals) {
        expect(meal.items.length).toBeLessThanOrEqual(MAX_DISHES_PER_MEAL)
      }
    }
  })

  it('không lặp món trong cùng một bữa', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    for (const day of plan.days) {
      for (const meal of day.meals) {
        const slugs = meal.items.map((item) => item.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
      }
    }
  })

  it('nhờ ghép nhiều món, trung bình ngày sát mục tiêu hơn', () => {
    const plan = buildPlan({ weekStart: '2026-09-21', targets: TARGETS, catalogue: DISHES })
    const deviation = Math.abs(plan.averageKcal - TARGETS.targetKcal) / TARGETS.targetKcal
    expect(deviation).toBeLessThan(0.15)
  })
})
