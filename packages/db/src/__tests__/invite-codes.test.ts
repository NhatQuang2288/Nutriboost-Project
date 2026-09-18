import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { USERS, asUser, createTestDatabase, seedFixtures } from './harness'

/**
 * Kiểm thử mã mời trên PostgreSQL thật, có RLS thật.
 *
 * `scripts/check-migrations.mjs` chỉ chứng minh migration chạy được. Nó không chứng minh
 * policy chặn đúng người, vì `auth.uid()` trong đó luôn là `null` mà `null` thì không khớp
 * với hàng nào — mọi policy đều "đúng" một cách vô nghĩa.
 */

let db: PGlite

beforeAll(async () => {
  db = await createTestDatabase()
  await seedFixtures(db)
}, 60_000)

afterAll(async () => {
  await db.close()
})

/** Lấy dòng đầu tiên, ném lỗi rõ ràng thay vì trả `undefined` cho test tự đoán. */
function firstRow<T>(result: { rows: T[] }): T {
  const row = result.rows[0]
  if (row === undefined) throw new Error('Truy vấn không trả về dòng nào')
  return row
}

interface CodeOptions {
  maxUses?: number
  expiresInDays?: number
  note?: string | null
}

/**
 * Phát hành một mã với tư cách chủ sở hữu, rồi trả về mã đó.
 *
 * Đi qua `generate_invite_code()` của CSDL chứ không tự bịa chuỗi trong test: nếu hàm sinh
 * mã hỏng, test phải đỏ.
 */
async function createCode(
  owner: string,
  options: CodeOptions = {},
): Promise<{ id: string; code: string }> {
  return asUser(db, owner, async () => {
    const generated = await db.query<{ code: string }>(`select public.generate_invite_code() as code`)

    return firstRow(
      await db.query<{ id: string; code: string }>(
        `insert into public.invite_codes (code, pt_id, max_uses, expires_at, note)
         values ($1, $2, $3, now() + ($4::int * interval '1 day'), $5)
         returning id, code`,
        [
          firstRow(generated).code,
          owner,
          options.maxUses ?? 1,
          options.expiresInDays ?? 14,
          options.note ?? null,
        ],
      ),
    )
  })
}

/** Đổi mã với tư cách một người dùng, trả về payload jsonb. */
async function redeem(
  userId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string; pt_id?: string }> {
  return asUser(db, userId, async () =>
    firstRow(
      await db.query<{ result: { ok: boolean; reason?: string; pt_id?: string } }>(
        `select public.redeem_invite_code($1) as result`,
        [code],
      ),
    ).result,
  )
}

/* ---------------------------------------------------------------------------
 * Sinh mã
 * ------------------------------------------------------------------------- */

describe('generate_invite_code', () => {
  it('sinh mã 8 ký tự thuộc bảng chữ cái không gây nhầm lẫn', async () => {
    const { code } = await createCode(USERS.pt)

    expect(code).toHaveLength(8)
    // 0, O, 1, I, L bị loại vì đọc qua điện thoại thì không phân biệt được.
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
    expect(code).not.toMatch(/[01OIL]/)
  })

  it('sinh mã khác nhau ở hai lần gọi', async () => {
    const first = await createCode(USERS.pt)
    const second = await createCode(USERS.pt)

    expect(first.code).not.toBe(second.code)
  })

  it('CSDL từ chối mã chứa ký tự dễ nhầm', async () => {
    // Ràng buộc nằm ở tầng CSDL, không chỉ ở hàm sinh mã: chèn thẳng mã có `O` phải đỏ.
    await expect(
      db.query(`insert into public.invite_codes (code, pt_id) values ('ABCDEFGO', $1)`, [USERS.pt]),
    ).rejects.toThrow(/invite_codes_alphabet/)
  })
})

/* ---------------------------------------------------------------------------
 * RLS trên bảng mã mời
 * ------------------------------------------------------------------------- */

describe('RLS trên invite_codes', () => {
  it('khách KHÔNG đọc được mã nào, kể cả khi mã đang tồn tại', async () => {
    await createCode(USERS.pt)

    const visible = await asUser(db, USERS.client1, async () =>
      db.query(`select code from public.invite_codes`),
    )

    // RLS lọc hàng, không báo lỗi: người dùng thấy bảng rỗng. Đây là chủ ý — nếu khách đọc
    // được bảng này thì họ đọc được mã đang sống của mọi PT và mã mời mất hết ý nghĩa.
    expect(visible.rows).toHaveLength(0)
  })

  it('PT chỉ đọc được mã của chính mình', async () => {
    const mine = await createCode(USERS.pt)
    const theirs = await createCode(USERS.ptOther)

    const visible = await asUser(db, USERS.pt, async () =>
      db.query<{ code: string }>(`select code from public.invite_codes`),
    )
    const codes = visible.rows.map((row) => row.code)

    expect(codes).toContain(mine.code)
    expect(codes).not.toContain(theirs.code)
  })

  it('PT không phát hành được mã nhân danh PT khác', async () => {
    const generated = await asUser(db, USERS.pt, async () =>
      firstRow(await db.query<{ code: string }>(`select public.generate_invite_code() as code`)).code,
    )

    await expect(
      asUser(db, USERS.pt, async () =>
        db.query(`insert into public.invite_codes (code, pt_id) values ($1, $2)`, [
          generated,
          USERS.ptOther,
        ]),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('tài khoản không phải PT không phát hành được mã', async () => {
    const generated = await asUser(db, USERS.client1, async () =>
      firstRow(await db.query<{ code: string }>(`select public.generate_invite_code() as code`)).code,
    )

    await expect(
      asUser(db, USERS.client1, async () =>
        db.query(`insert into public.invite_codes (code, pt_id) values ($1, $2)`, [
          generated,
          USERS.client1,
        ]),
      ),
    ).rejects.toThrow(/row-level security/i)
  })
})

/* ---------------------------------------------------------------------------
 * Đổi mã
 * ------------------------------------------------------------------------- */

describe('redeem_invite_code', () => {
  it('mã hợp lệ tạo quan hệ và tăng số lần đã dùng', async () => {
    const { id, code } = await createCode(USERS.pt)

    const result = await redeem(USERS.client1, code)

    expect(result.ok).toBe(true)
    expect(result.pt_id).toBe(USERS.pt)

    const after = await db.query<{ used_count: number }>(
      `select used_count from public.invite_codes where id = $1`,
      [id],
    )
    expect(firstRow(after).used_count).toBe(1)

    const link = await db.query<{ status: string; invite_code_id: string }>(
      `select status, invite_code_id from public.pt_clients where pt_id = $1 and client_id = $2`,
      [USERS.pt, USERS.client1],
    )
    expect(firstRow(link)).toEqual({ status: 'active', invite_code_id: id })
  })

  it('chấp nhận chữ thường và khoảng trắng thừa khi dán từ tin nhắn', async () => {
    const { code } = await createCode(USERS.pt)

    const result = await redeem(USERS.client2, `  ${code.toLowerCase()}  `)

    expect(result.ok).toBe(true)
  })

  it('mã không tồn tại trả lý do rõ ràng, không ném lỗi', async () => {
    // Mã sai là tình huống bình thường, không phải sự cố — tầng ứng dụng cần phân biệt
    // "mã sai" với "mã hết hạn" để nói đúng điều cho người dùng.
    expect(await redeem(USERS.client1, 'ZZZZZZZZ')).toEqual({ ok: false, reason: 'not_found' })
  })

  it('chuỗi rỗng trả lý do riêng', async () => {
    expect(await redeem(USERS.client1, '   ')).toEqual({ ok: false, reason: 'empty' })
  })

  it('mã hết hạn không dùng được', async () => {
    const { code } = await createCode(USERS.pt, { expiresInDays: -1 })

    expect(await redeem(USERS.client1, code)).toEqual({ ok: false, reason: 'expired' })
  })

  it('mã đã thu hồi không dùng được', async () => {
    const { id, code } = await createCode(USERS.pt)
    await asUser(db, USERS.pt, async () =>
      db.query(`update public.invite_codes set revoked_at = now() where id = $1`, [id]),
    )

    expect(await redeem(USERS.client1, code)).toEqual({ ok: false, reason: 'revoked' })
  })

  it('mã dùng một lần chỉ dùng được một lần', async () => {
    const { code } = await createCode(USERS.ptOther, { maxUses: 1 })

    expect((await redeem(USERS.client1, code)).ok).toBe(true)
    expect(await redeem(USERS.client2, code)).toEqual({ ok: false, reason: 'used_up' })
  })

  it('PT tự dùng mã của mình bị từ chối', async () => {
    const { code } = await createCode(USERS.pt)

    expect(await redeem(USERS.pt, code)).toEqual({ ok: false, reason: 'own_code' })
  })

  it('người đã là khách của PT không dùng lại mã được', async () => {
    const first = await createCode(USERS.pt)
    const second = await createCode(USERS.pt)

    expect((await redeem(USERS.client3, first.code)).ok).toBe(true)
    expect(await redeem(USERS.client3, second.code)).toEqual({ ok: false, reason: 'already_linked' })
  })

  it('chạm hạn mức gói thì ném lỗi và KHÔNG tăng số lần đã dùng', async () => {
    // Gói trial của `ptFull` cho 2 khách. Lấp đầy hai chỗ rồi thử người thứ ba.
    const filler1 = await createCode(USERS.ptFull)
    const filler2 = await createCode(USERS.ptFull)
    const overLimit = await createCode(USERS.ptFull)

    expect((await redeem(USERS.client3, filler1.code)).ok).toBe(true)
    expect((await redeem(USERS.client4, filler2.code)).ok).toBe(true)

    await expect(redeem(USERS.client5, overLimit.code)).rejects.toThrow(/giới hạn 2 khách/)

    /*
     * Điểm quan trọng nhất của test này: giao dịch phải quay lui hoàn toàn. Nếu `used_count`
     * tăng cho một lần đổi thất bại thì mã bị "cháy" mà không ai vào được, và PT không có
     * cách nào biết vì sao.
     */
    const after = await db.query<{ used_count: number }>(
      `select used_count from public.invite_codes where id = $1`,
      [overLimit.id],
    )
    expect(firstRow(after).used_count).toBe(0)
  })

  it('PT chưa có gói đang hiệu lực thì không mời được ai', async () => {
    // Một tài khoản PT không có hàng nào trong `subscriptions`.
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [
      '44444444-4444-4444-4444-444444444444',
      'pt-khong-goi@example.com',
    ])
    await db.query(`update public.profiles set role = 'pt' where id = $1`, [
      '44444444-4444-4444-4444-444444444444',
    ])

    const { code } = await createCode('44444444-4444-4444-4444-444444444444')

    await expect(redeem(USERS.client5, code)).rejects.toThrow(/chưa có gói đang hiệu lực/)
  })
})

/* ---------------------------------------------------------------------------
 * Quan hệ PT ↔ khách
 * ------------------------------------------------------------------------- */

describe('RLS trên pt_clients', () => {
  it('khách không tự thêm mình vào danh sách khách của PT', async () => {
    // Đây là lý do việc đổi mã phải đi qua hàm `security definer`. Nếu khách tự insert được
    // thì họ bỏ qua được cả hạn mức gói lẫn mã mời.
    await expect(
      asUser(db, USERS.client5, async () =>
        db.query(`insert into public.pt_clients (pt_id, client_id) values ($1, $2)`, [
          USERS.pt,
          USERS.client5,
        ]),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('khách đọc được quan hệ của mình, không đọc được của người khác', async () => {
    const code = await createCode(USERS.ptOther)
    await redeem(USERS.client4, code.code)

    const visible = await asUser(db, USERS.client4, async () =>
      db.query<{ client_id: string }>(`select client_id from public.pt_clients`),
    )

    // Không khẳng định số dòng: các test khác cũng tạo quan hệ cho `client4`. Điều cần
    // khẳng định là **không dòng nào của người khác lọt vào tầm nhìn**.
    expect(visible.rows.length).toBeGreaterThan(0)
    expect(visible.rows.every((row) => row.client_id === USERS.client4)).toBe(true)
  })
})

/* ---------------------------------------------------------------------------
 * Trạng thái mã
 * ------------------------------------------------------------------------- */

describe('invite_code_status', () => {
  it('PT thấy mã của mình còn dùng được, kèm số khách còn lại', async () => {
    const { id } = await createCode(USERS.pt)

    const status = await asUser(db, USERS.pt, async () =>
      firstRow(
        await db.query<{ code: string; usable: boolean; reason: string; remaining_slots: number }>(
          `select * from public.invite_code_status($1)`,
          [id],
        ),
      ),
    )

    expect(status.usable).toBe(true)
    expect(status.reason).toBe('ok')
    // Gói Plus 5 khách; các test khác đã dùng mất vài chỗ.
    expect(status.remaining_slots).toBeGreaterThanOrEqual(0)
  })

  it('người khác không xem được trạng thái mã', async () => {
    const { id } = await createCode(USERS.pt)

    const rows = await asUser(db, USERS.client1, async () =>
      db.query(`select * from public.invite_code_status($1)`, [id]),
    )

    expect(rows.rows).toHaveLength(0)
  })

  it('báo đúng lý do khi mã đã dùng hết lượt', async () => {
    const { id, code } = await createCode(USERS.ptOther, { maxUses: 1 })
    await redeem(USERS.client5, code)

    const status = await asUser(db, USERS.ptOther, async () =>
      firstRow(
        await db.query<{ usable: boolean; reason: string }>(
          `select usable, reason from public.invite_code_status($1)`,
          [id],
        ),
      ),
    )

    expect(status).toEqual({ usable: false, reason: 'used_up' })
  })
})
