import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { USERS, asUser, createTestDatabase, seedFixtures } from './harness'

/**
 * Cô lập dữ liệu giữa các tài khoản, và quyền gọi hàm.
 *
 * Hai nhóm này nằm chung một file vì cùng một câu hỏi: **một người dùng đã đăng nhập làm
 * được gì với dữ liệu của người khác?** RLS trả lời phần bảng, `grant`/`revoke` trả lời
 * phần hàm — và hàm `security definer` bỏ qua RLS, nên bỏ sót nhóm thứ hai là bỏ sót
 * đúng chỗ nguy hiểm nhất.
 */

let db: PGlite

beforeAll(async () => {
  db = await createTestDatabase()
  await seedFixtures(db)

  // `pt` là PT của `client1`; `client2` không thuộc PT nào.
  await db.query(
    `insert into public.pt_clients (pt_id, client_id, status) values ($1, $2, 'active')`,
    [USERS.pt, USERS.client1],
  )

  // Nhật ký của hai khách khác nhau để kiểm tra tầm nhìn của PT và của chính họ.
  await db.query(
    `insert into public.meal_logs (user_id, local_date, meal_type, total_kcal)
     values ($1, current_date, 'lunch', 500), ($2, current_date, 'lunch', 700)`,
    [USERS.client1, USERS.client2],
  )
}, 60_000)

afterAll(async () => {
  await db.close()
})

/** Lấy dòng đầu tiên, ném lỗi rõ ràng thay vì trả `undefined`. */
function firstRow<T>(result: { rows: T[] }): T {
  const row = result.rows[0]
  if (row === undefined) throw new Error('Truy vấn không trả về dòng nào')
  return row
}

describe('cô lập nhật ký ăn uống', () => {
  it('người dùng chỉ đọc được nhật ký của mình', async () => {
    const visible = await asUser(db, USERS.client2, async () =>
      db.query<{ user_id: string; total_kcal: number }>(
        `select user_id, total_kcal from public.meal_logs`,
      ),
    )

    expect(visible.rows).toHaveLength(1)
    expect(firstRow(visible).user_id).toBe(USERS.client2)
    expect(firstRow(visible).total_kcal).toBe(700)
  })

  it('người dùng không ghi được nhật ký cho người khác', async () => {
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(
          `insert into public.meal_logs (user_id, local_date, meal_type, total_kcal)
           values ($1, current_date, 'dinner', 900)`,
          [USERS.client1],
        ),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('PT đọc được nhật ký của khách đang hoạt động', async () => {
    const visible = await asUser(db, USERS.pt, async () =>
      db.query<{ user_id: string }>(`select user_id from public.meal_logs`),
    )

    expect(visible.rows.map((row) => row.user_id)).toEqual([USERS.client1])
  })

  it('PT không đọc được nhật ký của người không phải khách của mình', async () => {
    const visible = await asUser(db, USERS.ptOther, async () =>
      db.query(`select user_id from public.meal_logs`),
    )

    expect(visible.rows).toHaveLength(0)
  })
})

describe('cô lập hồ sơ', () => {
  it('người dùng không đọc được hồ sơ sức khoẻ của người khác', async () => {
    await db.query(
      `insert into public.health_profiles
         (user_id, sex, date_of_birth, height_cm, activity_level, goal)
       values ($1, 'male', '1990-01-01', 175, 'light', 'lose')`,
      [USERS.client1],
    )

    const visible = await asUser(db, USERS.client2, async () =>
      db.query(`select user_id from public.health_profiles`),
    )

    expect(visible.rows).toHaveLength(0)
  })

  it('người dùng không sửa được hồ sơ của người khác', async () => {
    const updated = await asUser(db, USERS.client2, async () =>
      db.query(`update public.profiles set full_name = 'Bị đổi trộm' where id = $1`, [
        USERS.client1,
      ]),
    )

    // UPDATE không khớp hàng nào thì PostgreSQL không báo lỗi — nó chỉ không làm gì.
    // Nên phải khẳng định bằng cách đọc lại, không phải bằng cách chờ lỗi.
    expect(updated.affectedRows).toBe(0)

    const after = await db.query<{ full_name: string | null }>(
      `select full_name from public.profiles where id = $1`,
      [USERS.client1],
    )
    expect(firstRow(after).full_name).not.toBe('Bị đổi trộm')
  })
})

describe('quyền gọi hàm — các hàm security definer nhận tham số tuỳ ý', () => {
  it('khách không đọc được gói dịch vụ của PT', async () => {
    // Không siết quyền thì hàm này trả về cả hàng `subscriptions` của bất kỳ owner_id nào.
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select * from public.active_subscription($1)`, [USERS.pt]),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('người dùng không tự nâng hạn mức AI của mình', async () => {
    // Trước khi siết quyền, đây là đường vòng qua đúng cái trần kinh tế trong
    // docs/PRICING.md: truyền `p_limit` bao nhiêu cũng được.
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select public.claim_ai_quota($1, 'chat'::public.ai_purpose, 1000000)`, [
          USERS.client2,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('người dùng không ghi đè tổng hợp ngày của người khác', async () => {
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select public.refresh_daily_summary($1, current_date)`, [USERS.client1]),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('người dùng không tính lại chỉ số của món ăn', async () => {
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select public.recompute_dish_nutrients(gen_random_uuid())`),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('khách không dò được tình trạng chỗ của PT', async () => {
    // `remaining_client_slots(uuid)` nhận owner_id tuỳ ý, nên không siết thì nó trả lời được
    // "PT này còn bao nhiêu chỗ" — và qua đó dò xem một uuid có phải PT hay không.
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select public.remaining_client_slots($1)`, [USERS.pt]),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('khách không dò được quan hệ PT ↔ khách của người khác', async () => {
    await expect(
      asUser(db, USERS.client2, async () =>
        db.query(`select public.ai_turn_allowance($1, $2)`, [USERS.pt, USERS.client1]),
      ),
    ).rejects.toThrow(/permission denied/i)
  })

  it('invite_code_status VẪN chạy được sau khi siết quyền', async () => {
    /*
     * Phép thử ngược lại của hai lần siết quyền vừa rồi. `invite_code_status` là
     * `security definer` và gọi `remaining_client_slots` từ bên trong, nên nó phải **vẫn chạy**
     * sau khi hàm đó bị thu hồi khỏi `authenticated`. Nếu không thì việc siết quyền đã phá
     * tính năng mã mời, và đây là chỗ duy nhất phát hiện ra.
     */
    const rows = await asUser(db, USERS.pt, async () =>
      db.query(`select code, usable, remaining_slots from public.invite_code_status()`),
    )

    expect(Array.isArray(rows.rows)).toBe(true)
  })
})

describe('quyền gọi hàm — những hàm cố tình để mở', () => {
  it('search_foods vẫn gọi được: danh mục thực phẩm là dữ liệu dùng chung', async () => {
    const result = await asUser(db, USERS.client2, async () =>
      db.query(`select * from public.search_foods('pho', 5)`),
    )

    expect(Array.isArray(result.rows)).toBe(true)
  })

  it('purge_user_data chỉ xoá dữ liệu của chính người gọi', async () => {
    await asUser(db, USERS.client2, async () => db.query(`select public.purge_user_data()`))

    const remaining = await db.query<{ user_id: string }>(
      `select user_id from public.meal_logs order by user_id`,
    )

    // Nhật ký của client2 biến mất; của client1 vẫn còn. Hàm lấy người dùng từ `auth.uid()`
    // nên không có tham số nào để lợi dụng.
    expect(remaining.rows.map((row) => row.user_id)).toEqual([USERS.client1])
  })
})
