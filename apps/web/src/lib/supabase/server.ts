import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type UserRole, readServiceRoleConfig, readSupabaseConfig } from '@nutriboost/db'
import { cookies } from 'next/headers'

/**
 * Client Supabase phía server.
 *
 * `packages/db` cố ý không phụ thuộc Next.js, nên việc tạo client gắn với cookie phiên
 * nằm ở đây (xem ghi chú đầu `packages/db/src/index.ts`).
 *
 * Nguyên tắc: **chưa cấu hình thì trả `null`, không ném lỗi.** Cả đội phải dựng và kiểm
 * thử được sản phẩm trước khi có tài khoản Supabase, và bộ kiểm thử đầu-cuối chạy đúng
 * ở chế độ đó. Nơi gọi có trách nhiệm rẽ nhánh sang dữ liệu mẫu.
 */

/** Người dùng đang đăng nhập, kèm vai trò đọc từ `profiles`. */
export interface SessionUser {
  id: string
  email: string | null
  role: UserRole
}

/**
 * Client gắn cookie phiên của người dùng đang đăng nhập.
 *
 * Trả `null` khi chưa cấu hình Supabase, hoặc khi không có phiên hợp lệ — nơi gọi rẽ
 * nhánh sang dữ liệu mẫu thay vì hiện lỗi.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = readSupabaseConfig()
  if (config === null) return null

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component không ghi được cookie — Next.js chặn việc này sau khi
          // response đã bắt đầu. Không phải lỗi: middleware làm mới phiên ở mỗi
          // request, nên cookie luôn được ghi ở đó.
        }
      },
    },
  })
}

/**
 * Client dùng khoá service role — **bỏ qua toàn bộ RLS**.
 *
 * Chỉ dùng cho việc người dùng không được phép tự làm: ghi `ai_calls`, `ai_cache`,
 * `ai_rate_limits`, và đổi mã mời. Trả `null` khi thiếu khoá, không ném lỗi lúc import.
 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const config = readSupabaseConfig()
  if (config === null) return null

  let serviceRoleKey: string
  try {
    serviceRoleKey = readServiceRoleConfig().serviceRoleKey ?? ''
  } catch {
    return null
  }
  if (serviceRoleKey.length === 0) return null

  return createClient(config.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/**
 * Người dùng của request hiện tại, hoặc `null`.
 *
 * `getUser()` chứ không phải `getSession()`: `getSession()` đọc cookie mà không xác thực
 * lại với máy chủ, nên cookie giả sẽ đi qua được. `getUser()` hỏi thẳng Supabase Auth.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient()
  if (supabase === null) return null

  const { data, error } = await supabase.auth.getUser()
  if (error !== null || data.user === null) return null

  const user = data.user
  return { id: user.id, email: user.email ?? null, role: await readRole(supabase, user.id) }
}

/**
 * Vai trò của người dùng, đọc từ `profiles`.
 *
 * Mặc định `'client'` khi không đọc được: hồ sơ được tạo bằng trigger `handle_new_user`
 * nên bản ghi phải có, nhưng nếu vì lý do nào đó chưa có thì hạ quyền an toàn còn hơn
 * cấp nhầm quyền PT.
 */
async function readRole(supabase: SupabaseClient, userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (error !== null || data === null) return 'client'
  return (data as { role: UserRole }).role
}
