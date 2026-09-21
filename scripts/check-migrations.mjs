#!/usr/bin/env node
/**
 * Chạy toàn bộ migration và seed trên một PostgreSQL thật.
 *
 * Vì sao cần: lỗi cú pháp PL/pgSQL và lỗi ràng buộc dữ liệu **không** lộ ra khi đọc mã,
 * cũng không lộ ra qua `tsc` hay eslint. Chúng chỉ lộ khi chạy. Trước khi có script này,
 * một lỗi `syntax error at or near "."` trong migration gói dịch vụ chỉ xuất hiện khi
 * thành viên nhóm chạy `supabase db reset` — tức là sau khi đã mất thời gian dựng Docker.
 *
 * Dùng PGlite (PostgreSQL biên dịch sang WASM) nên chạy được ở CI mà không cần Docker.
 *
 *   npm run db:check
 *
 * Giới hạn đã biết: PGlite là PostgreSQL thuần, không có sẵn schema `auth` của Supabase.
 * Script này tự dựng bản tối thiểu của `auth.users` và `auth.uid()`. Vì vậy nó kiểm được
 * cú pháp, ràng buộc và RLS policy, nhưng **không** thay thế được lần chạy thật trên
 * Supabase. Vẫn phải chạy `supabase db reset` một lần trước khi phát hành.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'

const MIGRATIONS_DIR = 'supabase/migrations'
const SEED_FILE = 'supabase/seed.sql'

/** Số dòng mong đợi sau khi nạp seed — chốt lại để phát hiện seed hỏng lặng lẽ. */
const EXPECTED_ROWS = {
  foods: 91,
  dish_components: 245,
  exercises: 33,
}

/** Bản tối thiểu của những gì Supabase cung cấp sẵn. */
const SUPABASE_STUBS = `
  create schema if not exists auth;

  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );

  create or replace function auth.uid() returns uuid
    language sql stable as $$ select null::uuid $$;

  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;
`

/** In đoạn mã quanh vị trí lỗi để đọc được ngay, không phải tự đếm dòng. */
function describeError(source, error) {
  const lines = [
    `  ${error.message}`,
    error.line === undefined ? '' : `  dòng ${error.line}, cột ${error.column ?? '?'}`,
  ].filter((line) => line.length > 0)

  const position = typeof error.position === 'number' ? error.position : -1
  if (position >= 0) {
    const before = source.slice(0, position)
    const lineNumber = before.split('\n').length
    lines.push(`  tại dòng ${lineNumber}:`)
    const start = source.lastIndexOf('\n', position - 1) + 1
    const end = source.indexOf('\n', position)
    lines.push(`    ${source.slice(start, end === -1 ? undefined : end)}`)
    lines.push(`    ${' '.repeat(Math.max(0, position - start))}^`)
  }

  return lines.join('\n')
}

async function main() {
  const db = new PGlite({ extensions: { citext, pgcrypto, pg_trgm, unaccent } })
  await db.exec(SUPABASE_STUBS)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.error(`Không tìm thấy migration nào trong ${MIGRATIONS_DIR}`)
    process.exit(1)
  }

  console.info(`Chạy ${files.length} migration trên PostgreSQL thật`)
  console.info('─'.repeat(56))

  for (const file of files) {
    const source = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    try {
      await db.exec(source)
      console.info(`  OK    ${file}`)
    } catch (error) {
      console.error(`  LỖI   ${file}`)
      console.error(describeError(source, error))
      process.exit(1)
    }
  }

  const seed = readFileSync(SEED_FILE, 'utf8')
  try {
    await db.exec(seed)
    console.info(`  OK    ${SEED_FILE}`)
  } catch (error) {
    console.error(`  LỖI   ${SEED_FILE}`)
    console.error(describeError(seed, error))
    process.exit(1)
  }

  console.info('')
  console.info('Kiểm tra số dòng sau khi nạp seed:')

  let failed = false
  for (const [table, expected] of Object.entries(EXPECTED_ROWS)) {
    const result = await db.query(`select count(*)::int as n from public.${table}`)
    const actual = result.rows[0]?.n ?? 0
    const ok = actual === expected
    console.info(`  ${ok ? 'OK   ' : 'SAI  '} ${table.padEnd(17)} ${actual}/${expected}`)
    if (!ok) failed = true
  }

  if (failed) {
    console.error('')
    console.error('Số dòng không khớp. Chạy `npm run seed -- --emit-sql` để sinh lại seed.sql.')
    process.exit(1)
  }

  console.info('')
  console.info('Migration và seed đều chạy được, số dòng đúng.')
}

await main()
