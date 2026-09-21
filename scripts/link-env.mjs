#!/usr/bin/env node
/**
 * Nối `.env.local` ở gốc monorepo vào `apps/web/.env.local`.
 *
 * Vì sao cần: Next.js chỉ đọc file env trong **thư mục app** (`apps/web`), không đọc ở
 * gốc. Đặt `.env.local` ở gốc mà không nối thì `npm run dev` vẫn chạy, trang vẫn mở,
 * nhưng không biến nào được nạp: Supabase trả về rỗng và trợ lý Bơ im lặng dùng câu
 * trả lời mặc định. Không có lỗi nào hiện ra để mà lần theo.
 *
 * Dùng symlink thay vì copy để chỉ có MỘT file phải sửa. Sửa ở gốc là cả hai bên thấy.
 *
 *   npm run env:link
 */

import { existsSync, lstatSync, rmSync, symlinkSync } from 'node:fs'
import { relative } from 'node:path'

const SOURCE = '.env.local'
const TARGET = 'apps/web/.env.local'
const RELATIVE = relative('apps/web', SOURCE)

if (!existsSync(SOURCE)) {
  console.error(`Chưa có ${SOURCE}.`)
  console.error('')
  console.error('Tạo file trước:')
  console.error('  cp .env.example .env.local')
  console.error('')
  console.error('Rồi điền khoá Supabase và GEMINI_API_KEY vào đó.')
  process.exit(1)
}

/*
 * Xoá đích cũ trước khi tạo. Cần thiết khi lần trước là file copy thật chứ không phải
 * symlink — symlinkSync sẽ ném EEXIST và người dùng tưởng lệnh hỏng.
 */
if (existsSync(TARGET) || lstatSync(TARGET, { throwIfNoEntry: false })) {
  const existing = lstatSync(TARGET)
  if (existing.isSymbolicLink()) {
    console.info(`${TARGET} đã là symlink. Bỏ qua.`)
    process.exit(0)
  }
  rmSync(TARGET, { force: true })
  console.info(`Đã xoá bản copy cũ ở ${TARGET}.`)
}

symlinkSync(RELATIVE, TARGET)
console.info(`Đã nối ${TARGET} → ${RELATIVE}`)
console.info('')
console.info('Giờ sửa khoá ở .env.local là Next.js thấy ngay (cần khởi động lại dev server).')
