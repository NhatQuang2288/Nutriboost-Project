#!/usr/bin/env node
/**
 * Kiểm tra commit message theo Conventional Commits, không cần thêm phụ thuộc.
 *
 * Định dạng: <type>(<phạm vi>): <mô tả>
 * Phạm vi là tuỳ chọn. Mô tả tối thiểu 10 ký tự, viết ở thể mệnh lệnh.
 *
 * Ví dụ hợp lệ:
 *   feat(assistant): thêm ask bar nổi ở đáy vùng nội dung
 *   fix(nutrition): sửa sàn chất béo thắng trần năng lượng
 *   docs(roles): điều chỉnh phạm vi TV4 sang màn hình người dùng cuối
 */

import { readFileSync } from 'node:fs'

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
]

const HEADER_PATTERN = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9-]+\\))?!?: .{10,}$`)

const messageFile = process.argv[2]
if (messageFile === undefined) {
  console.error('Thiếu đường dẫn tới file commit message.')
  process.exit(1)
}

const raw = readFileSync(messageFile, 'utf8')
// Bỏ qua comment và dòng trống do git chèn vào.
const subject = raw
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))[0]

if (subject === undefined) {
  console.error('Commit message rỗng.')
  process.exit(1)
}

// Cho phép các commit máy sinh của git.
if (/^(Merge|Revert|fixup!|squash!|Initial commit)/.test(subject)) {
  process.exit(0)
}

if (!HEADER_PATTERN.test(subject)) {
  console.error('\nCommit message không đúng Conventional Commits.\n')
  console.error(`  Nhận được: ${subject}\n`)
  console.error(`  Định dạng: <type>(<phạm vi>): <mô tả từ 10 ký tự>\n`)
  console.error(`  type hợp lệ: ${TYPES.join(', ')}\n`)
  console.error('  Ví dụ: feat(assistant): thêm ask bar nổi ở đáy vùng nội dung\n')
  process.exit(1)
}
