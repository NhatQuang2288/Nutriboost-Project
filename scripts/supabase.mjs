#!/usr/bin/env node
/**
 * Chạy Supabase CLI với phiên bản ghim.
 *
 * Vì sao cần lớp bọc này: `package.json` có ba script gọi thẳng `supabase` (`db:start`,
 * `db:reset`, `db:types`), nhưng Supabase CLI **không phải** dependency của dự án và cũng
 * không nằm trong PATH. Hệ quả: cả ba script đều đổ với `sh: supabase: command not found`
 * ngay từ lần chạy đầu, dù tài liệu vẫn chỉ dẫn dùng chúng.
 *
 * Không thêm CLI vào `devDependencies` vì nó tải một tệp nhị phân vài chục MB ở bước
 * `postinstall` — mọi người đóng góp đều phải trả giá đó, kể cả người chỉ sửa giao diện và
 * không bao giờ đụng tới CSDL. `npx` chỉ tải khi thật sự cần, và sau lần đầu thì nằm trong
 * bộ nhớ tạm.
 *
 * Phiên bản ghim ở ĐÚNG MỘT CHỖ. Migration và `config.toml` đã được viết và chạy thử với
 * phiên bản này; đổi ở đây là đổi cho cả ba script.
 *
 *   node scripts/supabase.mjs db reset
 *   node scripts/supabase.mjs gen types typescript --local
 *
 * Cần Docker đang chạy: Supabase local là một cụm container, không phải tiến trình đơn.
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const SUPABASE_CLI_VERSION = '2.117.0'

/**
 * Tham số truyền cho `npx`.
 *
 * Tách riêng khỏi phần thực thi để kiểm thử được mà không cần gọi mạng — xem
 * `scripts/supabase.test.mjs`.
 */
export function supabaseArgs(args) {
  return ['--yes', `supabase@${SUPABASE_CLI_VERSION}`, ...args]
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Thiếu lệnh cho Supabase CLI. Ví dụ: node scripts/supabase.mjs db reset')
    process.exit(1)
  }

  /*
   * `stdio: 'inherit'` là bắt buộc, không phải cho đẹp: `db:types` chuyển hướng stdout vào
   * `packages/db/src/database.types.ts`. Nếu lớp bọc này thu stdout rồi in lại, tệp types sẽ
   * hỏng lặng lẽ.
   */
  const result = spawnSync('npx', supabaseArgs(args), { stdio: 'inherit' })

  if (result.error !== undefined) {
    console.error(`Không chạy được Supabase CLI: ${result.error.message}`)
    process.exit(1)
  }

  process.exit(result.status ?? 1)
}

// Chỉ thực thi khi được gọi trực tiếp, để `supabaseArgs` import được trong test.
if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
