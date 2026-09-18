#!/usr/bin/env node
/**
 * Kiểm tra `.env.local` có đúng và Supabase có đọc được không.
 *
 * Vì sao cần: điền sai khoá Supabase không báo lỗi ngay. Nó chỉ lộ ra sau đó dưới dạng
 * "không tải được dữ liệu" hoặc tệ hơn là im lặng trả về rỗng — rất khó lần ra.
 * Script này trả lời dứt khoát: đã điền đúng chưa, và CSDL đã sẵn sàng chưa.
 *
 *   npm run env:check
 *
 * Không in khoá ra màn hình, chỉ in tiền tố và độ dài.
 */

import { readFileSync } from 'node:fs'

const ENV_FILE = '.env.local'

/** Biến bắt buộc phải có. */
const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

/** Biến nên có nhưng thiếu vẫn chạy được. */
const OPTIONAL = ['SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY']

/** Đọc `.env.local`: KEY=VALUE, bỏ comment, bỏ dấu nháy bao quanh. */
function readEnvFile(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    console.error(`Không đọc được ${path}.`)
    console.error('')
    console.error('Tạo file bằng lệnh:')
    console.error('  cp .env.example .env.local')
    process.exit(1)
  }

  const values = new Map()
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values.set(key, value)
  }
  return values
}

/** Mô tả giá trị mà không lộ khoá. */
function describe(value) {
  if (value === undefined || value.length === 0) return '(trống)'
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}… (dài ${value.length})`
}

/**
 * Gọi REST API của Supabase, trả về mã trạng thái và số dòng đọc được.
 *
 * Số dòng quan trọng chứ không chỉ mã trạng thái: khi RLS đang chặn, PostgreSQL lọc bỏ
 * hàng và vẫn trả HTTP 200 với mảng rỗng — chứ không trả lỗi. Vì vậy "đọc được 0 dòng
 * trong khi service role thấy có dữ liệu" mới là bằng chứng RLS đang hoạt động.
 */
async function probe(url, key, limit = 200) {
  try {
    const response = await fetch(`${url}/rest/v1/foods?select=slug&limit=${limit}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    })
    const body = await response.text()
    let rows = null
    try {
      const parsed = JSON.parse(body)
      if (Array.isArray(parsed)) rows = parsed.length
    } catch {
      // Không phải JSON — giữ rows = null và để phần gọi xử lý theo mã trạng thái.
    }
    return { status: response.status, body, rows }
  } catch (error) {
    return { status: 0, body: error instanceof Error ? error.message : String(error), rows: null }
  }
}

async function main() {
  console.info(`Kiểm tra ${ENV_FILE}`)
  console.info('─'.repeat(60))

  const env = readEnvFile(ENV_FILE)
  const missing = []

  for (const key of REQUIRED) {
    const value = env.get(key)
    if (value === undefined || value.length === 0) {
      console.info(`  THIẾU ${key}`)
      missing.push(key)
    } else {
      console.info(`  OK    ${key.padEnd(28)} ${describe(value)}`)
    }
  }

  for (const key of OPTIONAL) {
    const value = env.get(key)
    if (value === undefined || value.length === 0) {
      console.info(`  --    ${key.padEnd(28)} chưa có (không bắt buộc)`)
    } else {
      console.info(`  OK    ${key.padEnd(28)} ${describe(value)}`)
    }
  }

  if (missing.length > 0) {
    console.error('')
    console.error(`Còn thiếu ${missing.length} biến bắt buộc: ${missing.join(', ')}`)
    console.error('Giá trị lấy ở output của `npx supabase@2.117.0 start`, hoặc chạy lại')
    console.error('`npx supabase@2.117.0 status` để in lại.')
    process.exit(1)
  }

  const url = env.get('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceKey = env.get('SUPABASE_SERVICE_ROLE_KEY')

  try {
    new URL(url)
  } catch {
    console.error('')
    console.error(`NEXT_PUBLIC_SUPABASE_URL không phải URL hợp lệ: ${url}`)
    process.exit(1)
  }

  console.info('')
  console.info(`Kết nối Supabase tại ${url}`)

  const serviceProbe =
    serviceKey === undefined || serviceKey.length === 0 ? null : await probe(url, serviceKey)
  const anonProbe = await probe(url, anonKey)

  if (anonProbe.status === 0) {
    console.error('  KHÔNG kết nối được. Supabase chưa chạy?')
    console.error('')
    console.error('  Chạy: npx supabase@2.117.0 start')
    process.exit(1)
  }

  let failed = false

  if (serviceProbe !== null) {
    if (serviceProbe.status === 200) {
      const count = serviceProbe.rows ?? 0
      if (count > 0) {
        console.info(`  OK    service role đọc được ${count} dòng từ bảng foods (seed đã nạp)`)
      } else {
        console.info('  CẢNH  service role đọc được bảng foods nhưng bảng RỖNG')
        console.info('        Chạy: npx supabase@2.117.0 db reset')
        failed = true
      }
    } else if (serviceProbe.status === 401) {
      console.info(`  LỖI   service role key không hợp lệ (HTTP 401)`)
      failed = true
    } else {
      console.info(`  LỖI   service role trả về HTTP ${serviceProbe.status}`)
      console.info(`        ${serviceProbe.body.slice(0, 160)}`)
      failed = true
    }
  } else {
    console.info('  --    bỏ qua kiểm tra service role (chưa điền khoá)')
  }

  /*
   * Kiểm tra bảo mật: người CHƯA đăng nhập không được đọc dữ liệu.
   *
   * RLS lọc hàng chứ không báo lỗi, nên cả hai trường hợp đều trả HTTP 200. Điều phân
   * biệt là SỐ DÒNG: service role thấy 51 món còn anon phải thấy 0. Nếu anon cũng thấy
   * dữ liệu thì RLS đang hở, và đó là lỗi nghiêm trọng chứ không phải chuyện nhỏ.
   */
  if (anonProbe.status === 401) {
    console.info('  LỖI   anon key không hợp lệ (HTTP 401)')
    failed = true
  } else if (anonProbe.status === 200 || anonProbe.status === 403) {
    const anonRows = anonProbe.rows ?? 0
    const serviceRows = serviceProbe?.rows ?? null

    if (anonRows > 0) {
      console.info(`  LỖI   anon đọc được ${anonRows} dòng từ bảng foods — RLS đang hở!`)
      console.info('        Kiểm tra lại migration 20260918090100_rls.sql.')
      failed = true
    } else if (serviceRows !== null && serviceRows > 0) {
      console.info(
        `  OK    anon key hợp lệ và RLS đang chặn đúng (service ${serviceRows} dòng, anon 0 dòng)`,
      )
    } else {
      console.info('  OK    anon key hợp lệ (chưa đối chiếu được với service role)')
    }
  } else {
    console.info(`  CẢNH  anon key trả về HTTP ${anonProbe.status}`)
  }

  if (!env.get('GEMINI_API_KEY')) {
    console.info('')
    console.info('  Ghi chú: chưa có GEMINI_API_KEY nên trợ lý Bơ sẽ trả câu mặc định.')
    console.info('  Mọi thứ khác — dựng thực đơn, lịch tập, tính calo — vẫn chạy bình thường.')
  }

  console.info('')
  if (failed) {
    console.error('Chưa đạt. Xem các dòng LỖI ở trên.')
    process.exit(1)
  }

  console.info('Cấu hình hợp lệ và Supabase đã sẵn sàng.')
}

await main()
