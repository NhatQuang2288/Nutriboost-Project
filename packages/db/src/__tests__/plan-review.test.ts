import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { USERS, asUser, createTestDatabase, seedFixtures } from './harness'

/**
 * Vòng duyệt thực đơn: PT dựng → PT duyệt → khách đọc.
 *
 * Ba hàm này là chỗ dễ mở lỗ nhất trong toàn bộ schema, vì chúng là `security definer` **và**
 * ghi hộ người khác. Chính sách `plans_insert` chỉ cho `user_id = auth.uid()`, nên nếu phần
 * kiểm quyền trong hàm sai thì bất kỳ ai cũng dựng được thực đơn cho bất kỳ ai.
 */

let db: PGlite
const WEEK = '2026-09-14'
let foodId: string

beforeAll(async () => {
  db = await createTestDatabase()
  await seedFixtures(db)

  const food = await db.query<{ id: string }>(
    `select id from public.foods where kind = 'dish' limit 1`,
  )
  foodId = food.rows[0]?.id ?? '00000000-0000-0000-0000-000000000000'

  // `pt` là PT của `client1`.
  await db.query(
    `insert into public.pt_clients (pt_id, client_id, status) values ($1, $2, 'active')
     on conflict do nothing`,
    [USERS.pt, USERS.client1],
  )
}, 60_000)

afterAll(async () => {
  await db.close()
})

function firstRow<T>(result: { rows: T[] }): T {
  const row = result.rows[0]
  if (row === undefined) throw new Error('Truy vấn không trả về dòng nào')
  return row
}

/** Hai món của một ngày, đủ để kiểm phép gộp theo ngày. */
function planItems() {
  return JSON.stringify([
    {
      planDate: WEEK,
      mealType: 'breakfast',
      foodId,
      displayName: 'Phở bò',
      grams: 400,
      kcal: 548,
      proteinG: 28.8,
      carbG: 90,
      fatG: 7.6,
    },
    {
      planDate: WEEK,
      mealType: 'lunch',
      foodId,
      displayName: 'Cơm tấm sườn',
      grams: 400,
      kcal: 528,
      proteinG: 21.6,
      carbG: 64.8,
      fatG: 18.4,
    },
  ])
}

function savePlan(actor: string, target: string, items = planItems(), status = 'draft') {
  return asUser(db, actor, async () =>
    db.query<{ id: string }>(
      `select public.save_plan($1, $2::date, $3::jsonb, $4::public.plan_status) as id`,
      [target, WEEK, items, status],
    ),
  )
}

function decide(actor: string, planId: string, decision: string, note: string | null = null) {
  return asUser(
    db,
    actor,
    async () =>
      firstRow(
        await db.query<{ result: { ok: boolean; status?: string; reason?: string } }>(
          `select public.decide_plan($1, $2, $3) as result`,
          [planId, decision, note],
        ),
      ).result,
  )
}

describe('save_plan', () => {
  it('PT dựng được thực đơn nháp cho khách của mình', async () => {
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id

    const plan = await db.query<{ status: string; user_id: string }>(
      `select status, user_id from public.plans where id = $1`,
      [planId],
    )
    expect(firstRow(plan)).toEqual({ status: 'draft', user_id: USERS.client1 })

    const items = await db.query(`select id from public.plan_items where plan_id = $1`, [planId])
    expect(items.rows).toHaveLength(2)
  })

  it('dựng lại cùng tuần thì ghi đè, không nhân đôi món', async () => {
    // Thực đơn là một chỉnh thể. Nếu chỉ chèn thêm thì món của lần dựng trước còn nằm lại, và
    // khách sẽ thấy hai bữa sáng cho cùng một ngày.
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    await savePlan(USERS.pt, USERS.client1)

    const items = await db.query(`select id from public.plan_items where plan_id = $1`, [planId])
    expect(items.rows).toHaveLength(2)

    const plans = await db.query(
      `select id from public.plans where user_id = $1 and week_start = $2`,
      [USERS.client1, WEEK],
    )
    expect(plans.rows).toHaveLength(1)
  })

  it('người lạ KHÔNG dựng được thực đơn cho người khác', async () => {
    // Đây là đường mở lỗ nghiêm trọng nhất: `plans_insert` chỉ cho `user_id = auth.uid()`, nên
    // hàm phải tự kiểm, không thì ai cũng ghi hộ được.
    await expect(savePlan(USERS.client2, USERS.client1)).rejects.toThrow(/Không có quyền/)
  })

  it('PT không dựng được cho người không phải khách của mình', async () => {
    await expect(savePlan(USERS.pt, USERS.client2)).rejects.toThrow(/Không có quyền/)
  })

  it('người dùng tự dựng được thực đơn của chính mình', async () => {
    const planId = firstRow(await savePlan(USERS.client3, USERS.client3, planItems(), 'active')).id
    const plan = await db.query<{ status: string; accepted_at: string | null }>(
      `select status, accepted_at from public.plans where id = $1`,
      [planId],
    )
    // Đặt thẳng `active` thì phải kèm mốc chấp nhận — nếu không, thực đơn "đã duyệt" mà không
    // biết duyệt lúc nào.
    expect(firstRow(plan).status).toBe('active')
    expect(firstRow(plan).accepted_at).not.toBeNull()
  })

  it('từ chối thực đơn không có món nào', async () => {
    await expect(savePlan(USERS.pt, USERS.client1, '[]')).rejects.toThrow(/ít nhất một món/)
  })
})

describe('decide_plan', () => {
  it('duyệt thì thực đơn thành active và có mốc chấp nhận', async () => {
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    expect(await decide(USERS.pt, planId, 'approve')).toEqual({ ok: true, status: 'active' })

    const plan = await db.query<{
      status: string
      accepted_at: string | null
      review_note: string | null
    }>(`select status, accepted_at, review_note from public.plans where id = $1`, [planId])
    expect(firstRow(plan).status).toBe('active')
    expect(firstRow(plan).accepted_at).not.toBeNull()
    expect(firstRow(plan).review_note).toBeNull()
  })

  it('yêu cầu chỉnh lại thì giữ draft và lưu nhận xét', async () => {
    // Nút "Yêu cầu chỉnh lại" phải lưu được cái nó yêu cầu, nếu không thì nó là nút chết.
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    expect(await decide(USERS.pt, planId, 'revise', 'Bữa sáng nhiều tinh bột quá')).toEqual({
      ok: true,
      status: 'draft',
    })

    const plan = await db.query<{ status: string; review_note: string | null }>(
      `select status, review_note from public.plans where id = $1`,
      [planId],
    )
    expect(firstRow(plan)).toEqual({ status: 'draft', review_note: 'Bữa sáng nhiều tinh bột quá' })
  })

  it('nhận xét rỗng thì lưu null, không lưu chuỗi trắng', async () => {
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    await decide(USERS.pt, planId, 'revise', '   ')

    const plan = await db.query<{ review_note: string | null }>(
      `select review_note from public.plans where id = $1`,
      [planId],
    )
    expect(firstRow(plan).review_note).toBeNull()
  })

  it('người lạ KHÔNG duyệt được thực đơn của người khác', async () => {
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    await expect(decide(USERS.client2, planId, 'approve')).rejects.toThrow(/Không có quyền/)
  })

  it('quyết định không hợp lệ trả lý do, không ném lỗi', async () => {
    const planId = firstRow(await savePlan(USERS.pt, USERS.client1)).id
    expect(await decide(USERS.pt, planId, 'xoa-di')).toEqual({
      ok: false,
      reason: 'unknown_decision',
    })
  })

  it('thực đơn không tồn tại trả lý do, không ném lỗi', async () => {
    expect(await decide(USERS.pt, '99999999-9999-9999-9999-999999999999', 'approve')).toEqual({
      ok: false,
      reason: 'not_found',
    })
  })
})

describe('read_plan', () => {
  it('trả về thực đơn kèm món và slug của món', async () => {
    /*
     * `client4` tự dựng thực đơn của mình thay vì để `pt` dựng hộ: `pt` chỉ là PT của
     * `client1` trong dữ liệu nền, nên `save_plan(pt, client4)` **phải** bị từ chối. Bản đầu
     * của test này dựng hộ và đỏ — đúng như thiết kế.
     */
    const planId = firstRow(await savePlan(USERS.client4, USERS.client4)).id
    expect(await decide(USERS.client4, planId, 'approve')).toEqual({ ok: true, status: 'active' })

    const result = await asUser(
      db,
      USERS.client4,
      async () =>
        firstRow(
          await db.query<{ plan: { status: string; items: { slug: string }[] } | null }>(
            `select public.read_plan($1, $2::date) as plan`,
            [USERS.client4, WEEK],
          ),
        ).plan,
    )

    expect(result?.status).toBe('active')
    expect(result?.items).toHaveLength(2)
    // `slug` phải có, vì màn Kế hoạch dựng liên kết và tra cứu theo slug chứ không theo uuid.
    expect(result?.items[0]?.slug).toBeTruthy()
  })

  it('tuần chưa có thực đơn trả về null, không phải lỗi', async () => {
    const result = await asUser(
      db,
      USERS.client5,
      async () =>
        firstRow(
          await db.query<{ plan: unknown }>(
            `select public.read_plan($1, '2020-01-06'::date) as plan`,
            [USERS.client5],
          ),
        ).plan,
    )
    expect(result).toBeNull()
  })

  it('người lạ không đọc được thực đơn của người khác', async () => {
    const result = await asUser(
      db,
      USERS.client5,
      async () =>
        firstRow(
          await db.query<{ plan: unknown }>(`select public.read_plan($1, $2::date) as plan`, [
            USERS.client4,
            WEEK,
          ]),
        ).plan,
    )
    expect(result).toBeNull()
  })

  it('PT đọc được thực đơn của khách đang hoạt động', async () => {
    const result = await asUser(
      db,
      USERS.pt,
      async () =>
        firstRow(
          await db.query<{ plan: { items: unknown[] } | null }>(
            `select public.read_plan($1, $2::date) as plan`,
            [USERS.client1, WEEK],
          ),
        ).plan,
    )
    expect((result?.items ?? []).length).toBeGreaterThan(0)
  })
})
