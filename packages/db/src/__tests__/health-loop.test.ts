import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { USERS, asUser, createTestDatabase, seedFixtures } from './harness'

/**
 * Vòng lặp sức khoẻ: ghi hồ sơ, ghi bữa ăn, đọc nhật ký.
 *
 * Ba hàm này là chỗ dữ liệu thật đi vào và đi ra, nên test tập trung vào hai thứ mà đọc mã
 * không thấy được: **tính nguyên tử** (trạng thái nửa vời) và **tổng có khớp với các món
 * không** (một hàng nói 500 kcal trong khi các món cộng lại 900).
 */

let db: PGlite
let foodId: string

beforeAll(async () => {
  db = await createTestDatabase()
  await seedFixtures(db)

  // Một món thật để thử cả đường `food_id` hợp lệ lẫn đường id bịa.
  const food = await db.query<{ id: string }>(
    `select id from public.foods where kind = 'dish' limit 1`,
  )
  foodId = food.rows[0]?.id ?? '00000000-0000-0000-0000-000000000000'
}, 60_000)

afterAll(async () => {
  await db.close()
})

function firstRow<T>(result: { rows: T[] }): T {
  const row = result.rows[0]
  if (row === undefined) throw new Error('Truy vấn không trả về dòng nào')
  return row
}

const TARGETS = {
  p_bmr_kcal: 1618,
  p_tdee_kcal: 2508,
  p_target_kcal: 2120,
  p_protein_g: 125,
  p_carb_g: 270,
  p_fat_g: 60,
  p_formula_version: 'mifflin-st-jeor@v1',
  /*
   * Mảng truyền dạng chuỗi literal của PostgreSQL, không dạng mảng JS. Trình điều khiển
   * chuyển `[]` thành chuỗi rỗng, và PostgreSQL báo `malformed array literal: ""` — một
   * thông báo không hề gợi ý rằng vấn đề nằm ở phía JavaScript.
   */
  p_floors_applied: '{deficit_cap}',
}

async function completeOnboarding(userId: string, overrides: Record<string, unknown> = {}) {
  const args = {
    p_sex: 'male',
    p_date_of_birth: '1996-09-18',
    p_height_cm: 170,
    p_activity_level: 'moderate',
    p_goal: 'lose',
    p_rate_kg_per_week: 0.35,
    p_weight_kg: 70,
    p_medical_flags: '{}',
    p_consent_version: '2026-09-18',
    p_target_weight_kg: 65,
    ...TARGETS,
    ...overrides,
  }

  /*
   * Thứ tự tham số phải khớp **từng chữ** với danh sách trong lời gọi SQL bên dưới, nên nó
   * được viết tay chứ không lấy từ `Object.keys`. Bản đầu tiên lấy theo thứ tự khoá của một
   * object có `...TARGETS` trải ra ở giữa, khiến `p_target_weight_kg` nhảy lên vị trí 10 và
   * toàn bộ phần còn lại lệch một bậc — PostgreSQL báo lỗi về mảng, chẳng liên quan gì tới
   * nguyên nhân thật.
   */
  const values = [
    args.p_sex,
    args.p_date_of_birth,
    args.p_height_cm,
    args.p_activity_level,
    args.p_goal,
    args.p_rate_kg_per_week,
    args.p_weight_kg,
    args.p_medical_flags,
    args.p_consent_version,
    args.p_bmr_kcal,
    args.p_tdee_kcal,
    args.p_target_kcal,
    args.p_protein_g,
    args.p_carb_g,
    args.p_fat_g,
    args.p_formula_version,
    args.p_floors_applied,
    args.p_target_weight_kg,
  ]

  return asUser(db, userId, async () =>
    db.query(
      `select public.complete_onboarding(
         $1::public.sex_type, $2::date, $3::numeric, $4::public.activity_level,
         $5::public.goal_type, $6::numeric, $7::numeric, $8::public.medical_flag[],
         $9::text, $10::integer, $11::integer, $12::integer, $13::integer, $14::integer,
         $15::integer, $16::text, $17::text[], $18::numeric
       )`,
      values,
    ),
  )
}

function mealItem(overrides: Record<string, unknown> = {}) {
  return {
    foodId: null,
    displayName: 'Phở bò',
    grams: 500,
    kcal: 460,
    proteinG: 27,
    carbG: 59,
    fatG: 14,
    matchMethod: 'trigram',
    matchScore: 0.81,
    ...overrides,
  }
}

async function logMeal(userId: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  const args = {
    p_local_date: '2026-09-18',
    p_meal_type: 'breakfast',
    p_raw_input: 'sáng nay mình ăn phở bò',
    p_items: JSON.stringify(items),
    ...overrides,
  }

  return asUser(db, userId, async () =>
    db.query<{ id: string }>(
      `select public.log_meal_with_items($1::date, $2::public.meal_type, $3::text, $4::jsonb) as id`,
      [args.p_local_date, args.p_meal_type, args.p_raw_input, args.p_items],
    ),
  )
}

describe('complete_onboarding', () => {
  it('ghi hồ sơ, cân nặng, mục tiêu và ba loại đồng ý trong một lần', async () => {
    await completeOnboarding(USERS.client1)

    const profile = await db.query<{ onboarded_at: string | null }>(
      `select onboarded_at from public.profiles where id = $1`,
      [USERS.client1],
    )
    expect(firstRow(profile).onboarded_at).not.toBeNull()

    const health = await db.query<{ sex: string; height_cm: string; goal: string }>(
      `select sex, height_cm, goal from public.health_profiles where user_id = $1`,
      [USERS.client1],
    )
    expect(firstRow(health)).toMatchObject({ sex: 'male', goal: 'lose' })

    const metrics = await db.query<{ weight_kg: string }>(
      `select weight_kg from public.body_metrics where user_id = $1`,
      [USERS.client1],
    )
    expect(Number(firstRow(metrics).weight_kg)).toBe(70)

    const targets = await db.query<{ target_kcal: number; protein_g: number }>(
      `select target_kcal, protein_g from public.energy_targets where user_id = $1`,
      [USERS.client1],
    )
    expect(firstRow(targets)).toMatchObject({ target_kcal: 2120, protein_g: 125 })

    const consents = await db.query<{ kind: string }>(
      `select kind from public.consents where user_id = $1 order by kind`,
      [USERS.client1],
    )
    // `order by` trên enum sắp theo thứ tự khai báo của kiểu, không theo alphabet.
    expect(consents.rows.map((row) => row.kind)).toEqual(['terms', 'health_data', 'ai_processing'])
  })

  it('thiết lập lại trong cùng ngày thì cập nhật, không tạo hàng thứ hai', async () => {
    await completeOnboarding(USERS.client2, { p_weight_kg: 80 })
    await completeOnboarding(USERS.client2, { p_weight_kg: 78, p_target_kcal: 2000 })

    const metrics = await db.query(`select id from public.body_metrics where user_id = $1`, [
      USERS.client2,
    ])
    expect(metrics.rows).toHaveLength(1)

    const targets = await db.query<{ target_kcal: number }>(
      `select target_kcal from public.energy_targets where user_id = $1`,
      [USERS.client2],
    )
    expect(targets.rows).toHaveLength(1)
    expect(firstRow(targets).target_kcal).toBe(2000)

    const weight = await db.query<{ weight_kg: string }>(
      `select weight_kg from public.body_metrics where user_id = $1`,
      [USERS.client2],
    )
    expect(Number(firstRow(weight).weight_kg)).toBe(78)
  })

  it('không đụng tới dữ liệu của người khác', async () => {
    const before = await db.query<{ height_cm: string }>(
      `select height_cm from public.health_profiles where user_id = $1`,
      [USERS.client1],
    )

    await completeOnboarding(USERS.client3, { p_height_cm: 190 })

    const after = await db.query<{ height_cm: string }>(
      `select height_cm from public.health_profiles where user_id = $1`,
      [USERS.client1],
    )
    expect(firstRow(after).height_cm).toBe(firstRow(before).height_cm)

    const other = await db.query<{ height_cm: string }>(
      `select height_cm from public.health_profiles where user_id = $1`,
      [USERS.client3],
    )
    expect(Number(firstRow(other).height_cm)).toBe(190)
  })

  it('giữ nguyên mốc thời gian đồng ý khi người dùng sửa lại hồ sơ', async () => {
    // Bằng chứng pháp lý là thời điểm đồng ý lần đầu, không phải lần sửa hồ sơ gần nhất.
    const before = await db.query<{ accepted_at: string }>(
      `select accepted_at from public.consents where user_id = $1 and kind = 'terms'`,
      [USERS.client1],
    )

    await completeOnboarding(USERS.client1, { p_weight_kg: 71 })

    const after = await db.query<{ accepted_at: string }>(
      `select accepted_at from public.consents where user_id = $1 and kind = 'terms'`,
      [USERS.client1],
    )
    // So sánh dạng chuỗi: trình điều khiển trả về hai đối tượng `Date` khác nhau cho cùng
    // một mốc thời gian, và `toBe` so sánh tham chiếu nên luôn đỏ.
    expect(String(firstRow(after).accepted_at)).toBe(String(firstRow(before).accepted_at))
  })
})

describe('log_meal_with_items', () => {
  it('tổng được tính TỪ các món, không nhận từ người gọi', async () => {
    const meal = await logMeal(USERS.client1, [
      mealItem({ kcal: 460, proteinG: 27, carbG: 59, fatG: 14 }),
      mealItem({ displayName: 'Cà phê sữa đá', kcal: 110, proteinG: 2, carbG: 19, fatG: 3 }),
    ])

    const row = await db.query<{
      total_kcal: number
      total_protein_g: string
      total_carb_g: string
      total_fat_g: string
    }>(
      `select total_kcal, total_protein_g, total_carb_g, total_fat_g
       from public.meal_logs where id = $1`,
      [firstRow(meal).id],
    )

    expect(firstRow(row).total_kcal).toBe(570)
    expect(Number(firstRow(row).total_protein_g)).toBe(29)
    expect(Number(firstRow(row).total_carb_g)).toBe(78)
    expect(Number(firstRow(row).total_fat_g)).toBe(17)
  })

  it('ghi được món và giữ đúng phương pháp khớp', async () => {
    const meal = await logMeal(USERS.client1, [
      mealItem({ foodId, matchMethod: 'exact', matchScore: 1 }),
    ])

    const items = await db.query<{ food_id: string; match_method: string; display_name: string }>(
      `select food_id, match_method, display_name from public.meal_log_items where meal_log_id = $1`,
      [firstRow(meal).id],
    )

    expect(firstRow(items)).toEqual({
      food_id: foodId,
      match_method: 'exact',
      display_name: 'Phở bò',
    })
  })

  it('món có id bịa được ghi với food_id NULL thay vì làm hỏng cả bữa', async () => {
    // Model có thể bịa id. Mất cả bữa ăn vì một id sai là cái giá quá đắt, và cột `food_id`
    // vốn cho phép NULL cho món chưa có trong CSDL.
    const meal = await logMeal(USERS.client1, [
      mealItem({ foodId: '99999999-9999-9999-9999-999999999999' }),
    ])

    const item = await db.query<{ food_id: string | null }>(
      `select food_id from public.meal_log_items where meal_log_id = $1`,
      [firstRow(meal).id],
    )
    expect(firstRow(item).food_id).toBeNull()
  })

  it('từ chối bữa ăn không có món nào', async () => {
    await expect(logMeal(USERS.client1, [])).rejects.toThrow(/ít nhất một món/)
  })

  it('không ghi được bữa ăn cho người khác', async () => {
    // Người dùng lấy từ `auth.uid()`, không từ tham số — nên không có tham số nào để lợi dụng.
    // Kiểm chứng bằng cách đếm nhật ký của client2 trước và sau khi client1 ghi.
    const before = await db.query<{ n: number }>(
      `select count(*)::int as n from public.meal_logs where user_id = $1`,
      [USERS.client2],
    )

    await logMeal(USERS.client1, [mealItem()])

    const after = await db.query<{ n: number }>(
      `select count(*)::int as n from public.meal_logs where user_id = $1`,
      [USERS.client2],
    )
    expect(firstRow(after).n).toBe(firstRow(before).n)
  })

  it('tổng hợp ngày khớp ngay sau khi ghi', async () => {
    await logMeal(USERS.client4, [mealItem({ kcal: 300 })], { p_local_date: '2026-09-20' })

    const summary = await db.query<{ kcal_in: number }>(
      `select kcal_in from public.daily_summaries
       where user_id = $1 and local_date = '2026-09-20'`,
      [USERS.client4],
    )
    expect(firstRow(summary).kcal_in).toBe(300)
  })
})

describe('read_day_meals', () => {
  it('trả về bữa ăn kèm món trong một lời gọi', async () => {
    await logMeal(USERS.client5, [mealItem({ kcal: 200 })], { p_local_date: '2026-09-21' })

    const result = await asUser(db, USERS.client5, async () =>
      db.query<{ meals: unknown[] }>(
        `select public.read_day_meals($1, '2026-09-21'::date) as meals`,
        [USERS.client5],
      ),
    )

    const meals = firstRow(result).meals as { totalKcal: number; items: unknown[] }[]
    expect(meals).toHaveLength(1)
    expect(meals[0]?.totalKcal).toBe(200)
    expect(meals[0]?.items).toHaveLength(1)
  })

  it('ngày không có gì trả về mảng rỗng, không phải null', async () => {
    const result = await asUser(db, USERS.client5, async () =>
      db.query<{ meals: unknown[] }>(
        `select public.read_day_meals($1, '2020-01-01'::date) as meals`,
        [USERS.client5],
      ),
    )
    expect(firstRow(result).meals).toEqual([])
  })

  it('người lạ không đọc được nhật ký của người khác', async () => {
    const result = await asUser(db, USERS.client4, async () =>
      db.query<{ meals: unknown[] }>(
        `select public.read_day_meals($1, '2026-09-21'::date) as meals`,
        [USERS.client5],
      ),
    )
    expect(firstRow(result).meals).toEqual([])
  })

  it('PT đọc được nhật ký của khách đang hoạt động', async () => {
    await db.query(
      `insert into public.pt_clients (pt_id, client_id, status) values ($1, $2, 'active')
       on conflict do nothing`,
      [USERS.pt, USERS.client5],
    )

    const result = await asUser(db, USERS.pt, async () =>
      db.query<{ meals: unknown[] }>(
        `select public.read_day_meals($1, '2026-09-21'::date) as meals`,
        [USERS.client5],
      ),
    )

    expect((firstRow(result).meals as unknown[]).length).toBe(1)
  })
})
