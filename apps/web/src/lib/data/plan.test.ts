import { describe, expect, it } from 'vitest'

import { buildPlanFromRows } from './plan'

/**
 * Gộp `plan_items` (danh sách phẳng) thành `BuiltPlan` (cây ngày → bữa → món).
 *
 * Đây là ranh giới giữa hình dạng bảng và hình dạng giao diện. Sai ở đây thì thực đơn PT đã
 * duyệt hiện ra sai thứ tự bữa, hoặc mất món — mà không có lỗi nào để lần theo.
 */

interface Row {
  planDate: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  slug: string | null
  displayName: string
  grams: number | string
  kcal: number | string
  proteinG: number | string
  carbG: number | string
  fatG: number | string
}

function row(overrides: Partial<Row> = {}): Row {
  return {
    planDate: '2026-09-14',
    mealType: 'breakfast',
    slug: 'pho-bo',
    displayName: 'Phở bò',
    grams: 400,
    kcal: 548,
    proteinG: 28.8,
    carbG: 90,
    fatG: 7.6,
    ...overrides,
  }
}

describe('buildPlanFromRows', () => {
  it('gộp món vào đúng ngày và đúng bữa', () => {
    const plan = buildPlanFromRows('2026-09-14', [
      row(),
      row({ mealType: 'lunch', slug: 'com-tam-suon', displayName: 'Cơm tấm sườn', kcal: 528 }),
      row({ planDate: '2026-09-15', slug: 'pho-ga', displayName: 'Phở gà', kcal: 500 }),
    ])

    expect(plan.days).toHaveLength(2)
    expect(plan.days[0]?.meals).toHaveLength(2)
    expect(plan.days[0]?.meals[0]?.items[0]?.nameVi).toBe('Phở bò')
    expect(plan.days[1]?.meals[0]?.items[0]?.nameVi).toBe('Phở gà')
  })

  it('sắp bữa theo thứ tự trong ngày, không theo thứ tự hàng trong CSDL', () => {
    // `plan_items` không bảo đảm thứ tự, mà "bữa tối trước bữa sáng" là lỗi người dùng thấy ngay.
    const plan = buildPlanFromRows('2026-09-14', [
      row({ mealType: 'dinner', slug: 'canh', displayName: 'Canh' }),
      row({ mealType: 'breakfast' }),
      row({ mealType: 'lunch', slug: 'com', displayName: 'Cơm' }),
    ])

    expect(plan.days[0]?.meals.map((meal) => meal.mealType)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
    ])
  })

  it('sắp ngày tăng dần', () => {
    const plan = buildPlanFromRows('2026-09-14', [
      row({ planDate: '2026-09-16' }),
      row({ planDate: '2026-09-14' }),
      row({ planDate: '2026-09-15' }),
    ])

    expect(plan.days.map((day) => day.date)).toEqual(['2026-09-14', '2026-09-15', '2026-09-16'])
  })

  it('cộng kcal theo bữa và theo ngày, và tính trung bình', () => {
    const plan = buildPlanFromRows('2026-09-14', [
      row({ kcal: 500 }),
      row({ planDate: '2026-09-15', kcal: 700 }),
    ])

    expect(plan.days[0]?.totalKcal).toBe(500)
    expect(plan.days[1]?.totalKcal).toBe(700)
    expect(plan.averageKcal).toBe(600)
  })

  it('đổi số dạng chuỗi thành số', () => {
    // PostgREST trả `numeric` dạng chuỗi. Cộng chuỗi sẽ ra "548400" thay vì 948.
    const plan = buildPlanFromRows('2026-09-14', [
      row({ grams: '400', kcal: '548', proteinG: '28.8' }),
      row({ mealType: 'lunch', grams: '300', kcal: '400', proteinG: '20.2' }),
    ])

    expect(plan.days[0]?.totalKcal).toBe(948)
    expect(plan.days[0]?.totalProteinG).toBe(49)
  })

  it('món mất liên kết danh mục vẫn hiện, lấy tên làm khoá', () => {
    const plan = buildPlanFromRows('2026-09-14', [
      row({ slug: null, displayName: 'Món đã xoá khỏi danh mục' }),
    ])

    expect(plan.days[0]?.meals[0]?.items[0]).toMatchObject({
      slug: 'Món đã xoá khỏi danh mục',
      nameVi: 'Món đã xoá khỏi danh mục',
    })
  })

  it('không có hàng nào thì trả về kế hoạch rỗng, không chia cho 0', () => {
    const plan = buildPlanFromRows('2026-09-14', [])

    expect(plan.days).toEqual([])
    expect(plan.averageKcal).toBe(0)
    expect(plan.averageProteinG).toBe(0)
  })

  it('ghi chú để rỗng: bản đã lưu không mang theo ghi chú của bộ dựng', () => {
    // Bịa lại ghi chú ở đây là nói sai về một thực đơn có người đã duyệt.
    expect(buildPlanFromRows('2026-09-14', [row()]).notes).toEqual([])
  })
})
