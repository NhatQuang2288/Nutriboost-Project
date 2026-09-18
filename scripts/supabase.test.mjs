import { describe, expect, it } from 'vitest'

import { SUPABASE_CLI_VERSION, supabaseArgs } from './supabase.mjs'

/**
 * Lớp bọc Supabase CLI.
 *
 * Kiểm được phần dựng tham số, không kiểm được lời gọi thật — lời gọi đó cần mạng, và cần
 * Docker đang chạy. Điều quan trọng ở đây là **phiên bản được ghim** và các đối số đi qua
 * nguyên vẹn: một lớp bọc làm rơi đối số sẽ khiến `db:types` ghi ra tệp rỗng.
 */
describe('supabaseArgs', () => {
  it('ghim đúng phiên bản CLI', () => {
    expect(SUPABASE_CLI_VERSION).toBe('2.117.0')
    expect(supabaseArgs(['db', 'reset'])).toEqual([
      '--yes',
      `supabase@${SUPABASE_CLI_VERSION}`,
      'db',
      'reset',
    ])
  })

  it('giữ nguyên thứ tự và nội dung đối số', () => {
    // `gen types typescript --local` là lệnh dài nhất dự án dùng; đảo thứ tự là nó chạy sai.
    expect(supabaseArgs(['gen', 'types', 'typescript', '--local'])).toEqual([
      '--yes',
      'supabase@2.117.0',
      'gen',
      'types',
      'typescript',
      '--local',
    ])
  })

  it('không tự thêm đối số nào', () => {
    expect(supabaseArgs(['start'])).toHaveLength(3)
  })
})
