#!/usr/bin/env node
/**
 * Kiểm chứng tệp SQL mẫu `supabase/samples/khach-mot-tuan.sql`.
 *
 *   npm run check:sample
 *
 * Vì sao cần: tệp SQL ấy **không được CI chạy ở đâu cả** — `db:check` chỉ chạy migration và
 * `seed.sql`. Một tệp SQL sinh tự động mà không ai chạy là thứ mục nát âm thầm: sửa tuần mẫu
 * xong quên sinh lại, hoặc danh mục món đổi `slug`, thì chỉ phát hiện khi có người dán nó vào
 * Supabase Studio và bị lỗi.
 *
 * Script kiểm hai việc, không việc nào thay được việc kia:
 *
 *   1. **Tệp trên đĩa có khớp với tuần mẫu hiện tại không** — sinh lại bằng đúng hàm
 *      `buildSql` mà `make:week --emit-sql` dùng, rồi so từng ký tự.
 *   2. **Chạy được thật không** — dựng PostgreSQL bằng PGlite, chạy toàn bộ migration + seed,
 *      tạo một tài khoản khách, chạy chính tệp SQL đó, và đối chiếu số dòng với tuần mẫu.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'

import {
  DEMO_WEEK_DAYS,
  buildDemoWeekDays,
  demoEnergyTargets,
} from '../apps/web/src/lib/data/demo-week.ts'
import { SUPABASE_STUBS } from './check-migrations.mjs'
import { SQL_PATH, buildSql } from './make-week.mjs'

const MIGRATIONS_DIR = 'supabase/migrations'
const SEED_FILE = 'supabase/seed.sql'
const USER_ID = '11111111-1111-1111-1111-111111111111'

let failed = false

function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failed = true
  console.info(`  ${ok ? 'OK   ' : 'SAI  '} ${label.padEnd(42)} ${actual}/${expected}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 1. Tệp trên đĩa có khớp với tuần mẫu hiện tại
// ---------------------------------------------------------------------------

const days = buildDemoWeekDays()
const targets = demoEnergyTargets()

let onDisk
try {
  onDisk = readFileSync(SQL_PATH, 'utf8')
} catch {
  fail(`Không đọc được ${SQL_PATH}. Sinh lại bằng: npm run make:week -- <email> --emit-sql`)
}

const emailMatch = /v_email text := '([^']+)'/.exec(onDisk)
if (emailMatch?.[1] === undefined) {
  fail(`Không tìm thấy dòng \`v_email text := '...'\` trong ${SQL_PATH}.`)
}

const email = emailMatch[1]
const expected = buildSql(email, days, targets)

console.info('Tệp SQL mẫu trên đĩa:')
if (onDisk !== expected) {
  failed = true
  console.info(`  SAI   khớp với tuần mẫu hiện tại (${SQL_PATH})`)
  console.info('')
  console.info('Tệp đã cũ so với `apps/web/src/lib/data/demo-week.ts`. Sinh lại:')
  console.info(`  npm run make:week -- ${email} --emit-sql`)
} else {
  console.info(`  OK    khớp từng ký tự với tuần mẫu hiện tại (email ${email})`)
}

// ---------------------------------------------------------------------------
// 2. Chạy được thật trên PostgreSQL
// ---------------------------------------------------------------------------

const db = new PGlite({ extensions: { citext, pgcrypto, pg_trgm, unaccent } })
await db.exec(SUPABASE_STUBS)

const migrations = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()

for (const file of migrations) {
  try {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  } catch (error) {
    fail(`Migration lỗi: ${file}\n  ${error.message}`)
  }
}

try {
  await db.exec(readFileSync(SEED_FILE, 'utf8'))
} catch (error) {
  fail(`Seed lỗi: ${error.message}`)
}

// Một tài khoản khách thật, đúng như Supabase tạo ở lần đăng nhập đầu tiên.
await db.exec(`insert into auth.users (id, email) values ('${USER_ID}', '${email}')`)
await db.exec(
  `insert into public.profiles (id, full_name) values ('${USER_ID}', 'Khách Mẫu')
   on conflict (id) do nothing`,
)

try {
  await db.exec(onDisk)
} catch (error) {
  fail(`TỆP SQL MẪU LỖI:\n  ${error.message}`)
}

const count = async (sql) => (await db.query(sql)).rows[0]?.n ?? 0

const expectedMeals = days.reduce((total, day) => total + day.meals.length, 0)
const expectedItems = days.reduce(
  (total, day) => total + day.meals.reduce((sum, meal) => sum + meal.items.length, 0),
  0,
)
const expectedActivities = days.filter((day) => day.activity !== null).length

console.info('')
console.info('Tệp SQL mẫu chạy trên PostgreSQL thật:')
check(
  'body_metrics',
  await count('select count(*)::int as n from public.body_metrics'),
  days.length,
)
check('energy_targets', await count('select count(*)::int as n from public.energy_targets'), 1)
check('meal_logs', await count('select count(*)::int as n from public.meal_logs'), expectedMeals)
check(
  'meal_log_items',
  await count('select count(*)::int as n from public.meal_log_items'),
  expectedItems,
)
check(
  'activity_logs',
  await count('select count(*)::int as n from public.activity_logs'),
  expectedActivities,
)
check(
  'daily_summaries',
  await count('select count(*)::int as n from public.daily_summaries'),
  days.length,
)

// Món mẫu phải trỏ tới `foods` thật: `slug` sai thì `food_id` thành NULL, và món mất liên kết
// với danh mục mà không có lỗi nào hiện ra.
check(
  'món trỏ tới foods thật (0 mồ côi)',
  await count('select count(*)::int as n from public.meal_log_items where food_id is null'),
  0,
)
check(
  'ngày nào cũng có kcal nạp vào',
  await count('select count(*)::int as n from public.daily_summaries where kcal_in > 0'),
  days.length,
)
check(
  'ngày nào cũng có độ tuân thủ',
  await count(
    'select count(*)::int as n from public.daily_summaries where adherence_pct is not null',
  ),
  days.length,
)
check(
  'chuỗi ngày liên tiếp của ngày cuối',
  await count(
    'select streak_days::int as n from public.daily_summaries order by local_date desc limit 1',
  ),
  days.length,
)

/*
 * Phép kiểm mạnh nhất: từng ngày trong CSDL phải ra **đúng** con số kcal mà tuần mẫu nói.
 * Sai một món, sai một khối lượng, hay lệch phép làm tròn đều lộ ra ở đây.
 */
const rows = await db.query(
  'select local_date, kcal_in, target_kcal from public.daily_summaries order by local_date',
)

console.info('')
console.info('Đối chiếu từng ngày với tuần mẫu:')
for (const [index, day] of days.entries()) {
  const row = rows.rows[index]
  const ok = row !== undefined && row.kcal_in === day.total.kcal
  if (!ok) failed = true
  console.info(
    `  ${ok ? 'OK   ' : 'SAI  '} ngày ${index + 1}/${DEMO_WEEK_DAYS}  ` +
      `CSDL ${String(row?.kcal_in ?? '?').padStart(4)} kcal / tuần mẫu ${day.total.kcal} kcal  ` +
      `mục tiêu ${row?.target_kcal ?? '?'}`,
  )
}

console.info('')
if (failed) {
  console.error('CÓ KIỂM TRA SAI.')
  process.exit(1)
}
console.info(
  `Tệp SQL mẫu khớp tuần mẫu và chạy đúng: ${DEMO_WEEK_DAYS} ngày × ${expectedMeals} bữa.`,
)
