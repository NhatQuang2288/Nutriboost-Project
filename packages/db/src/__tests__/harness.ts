import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'

/**
 * Dựng một PostgreSQL thật trong bộ nhớ để kiểm thử RLS.
 *
 * Vì sao cần: `scripts/check-migrations.mjs` kiểm được cú pháp, ràng buộc và sự tồn tại của
 * policy, nhưng `auth.uid()` trong đó luôn trả `null`. Nghĩa là **chưa có gì chứng minh một
 * policy thực sự chặn đúng người** — chỉ chứng minh nó viết đúng cú pháp. Điều khoản "Định
 * nghĩa Xong" trong `docs/roles.md` yêu cầu policy phải có test, và đây là test đó.
 *
 * Khác biệt duy nhất so với Supabase thật: `auth.uid()` đọc từ một biến cấu hình phiên
 * (`rls_test.uid`) thay vì từ JWT. Mọi thứ còn lại — chủ sở hữu bảng, `set role`, RLS,
 * `security definer` — đều là PostgreSQL thật.
 */

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')
const SEED_FILE = join(ROOT, 'supabase', 'seed.sql')

/**
 * Bản tối thiểu của những gì Supabase cung cấp sẵn.
 *
 * `auth.uid()` là điểm khác biệt duy nhất: đọc từ `rls_test.uid` để test đổi được danh tính
 * giữa các lời gọi.
 */
const SUPABASE_STUBS = `
  create schema if not exists auth;

  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );

  create or replace function auth.uid() returns uuid
    language sql stable as $$
      select nullif(current_setting('rls_test.uid', true), '')::uuid
    $$;

  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;
`

/**
 * Dựng CSDL, chạy toàn bộ migration theo đúng thứ tự tên tệp, rồi nạp seed.
 *
 * Nạp cả seed vì test cần dữ liệu thật để chạm tới: `public.foods` rỗng thì không kiểm được
 * đường `food_id` hợp lệ, và `search_foods` luôn trả về không có gì. Seed chỉ chèn danh mục
 * thực phẩm và bài tập, không chèn người dùng, nên không xung đột với dữ liệu nền của test.
 */
export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { citext, pgcrypto, pg_trgm, unaccent } })
  await db.exec(SUPABASE_STUBS)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  }

  await db.exec(readFileSync(SEED_FILE, 'utf8'))

  return db
}

/**
 * Chạy `run` dưới danh tính một người dùng đã đăng nhập.
 *
 * Đổi vai trò PostgreSQL sang `authenticated` là bắt buộc: chủ sở hữu bảng và siêu người
 * dùng **bỏ qua RLS hoàn toàn**. Quên bước này thì mọi test RLS đều xanh một cách vô nghĩa,
 * vì chúng chạy với quyền cao nhất.
 */
export async function asUser<T>(db: PGlite, userId: string, run: () => Promise<T>): Promise<T> {
  await db.exec('set role authenticated')
  await db.query(`select set_config('rls_test.uid', $1, false)`, [userId])

  try {
    return await run()
  } finally {
    await db.exec('reset role')
    await db.query(`select set_config('rls_test.uid', '', false)`)
  }
}

/** UUID cố định để test đọc được mà không phải truyền biến qua lại. */
export const USERS = {
  pt: '11111111-1111-1111-1111-111111111111',
  ptFull: '22222222-2222-2222-2222-222222222222',
  ptOther: '33333333-3333-3333-3333-333333333333',
  client1: 'aaaaaaaa-0000-0000-0000-000000000001',
  client2: 'aaaaaaaa-0000-0000-0000-000000000002',
  client3: 'aaaaaaaa-0000-0000-0000-000000000003',
  client4: 'aaaaaaaa-0000-0000-0000-000000000004',
  client5: 'aaaaaaaa-0000-0000-0000-000000000005',
} as const

/**
 * Dữ liệu nền: ba tài khoản PT và năm khách.
 *
 * `pt` gói Plus (5 khách). `ptFull` gói Trial (2 khách) — đủ ít để test chạm trần hạn mức mà
 * không phải tạo nhiều người dùng. `ptOther` để test chuyện mã của người này không dùng
 * được cho quan hệ của người kia.
 */
export async function seedFixtures(db: PGlite): Promise<void> {
  const users: [string, string][] = [
    [USERS.pt, 'pt@example.com'],
    [USERS.ptFull, 'pt-toi-da@example.com'],
    [USERS.ptOther, 'pt-khac@example.com'],
    [USERS.client1, 'khach1@example.com'],
    [USERS.client2, 'khach2@example.com'],
    [USERS.client3, 'khach3@example.com'],
    [USERS.client4, 'khach4@example.com'],
    [USERS.client5, 'khach5@example.com'],
  ]

  for (const [id, email] of users) {
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, email])
  }

  // `handle_new_user()` tạo hồ sơ với vai trò mặc định `client`. Nâng ba tài khoản PT lên.
  await db.query(`update public.profiles set role = 'pt' where id = any($1::uuid[])`, [
    [USERS.pt, USERS.ptFull, USERS.ptOther],
  ])

  const subscriptions: [string, string, number, number][] = [
    // owner, tier, client_limit, price_vnd
    [USERS.pt, 'plus', 5, 750000],
    [USERS.ptFull, 'trial', 2, 0],
    [USERS.ptOther, 'premium', 10, 1125000],
  ]

  for (const [owner, tier, limit, price] of subscriptions) {
    await db.query(
      `insert into public.subscriptions
         (owner_id, tier, status, price_vnd, client_limit, ai_turns_per_client,
          current_period_start, current_period_end)
       values ($1, $2::public.plan_tier, 'active', $3, $4, 600, current_date, current_date + 30)`,
      [owner, tier, price, limit],
    )
  }
}
