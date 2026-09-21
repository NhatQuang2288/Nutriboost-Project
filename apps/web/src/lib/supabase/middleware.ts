import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from '@nutriboost/db'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Làm mới phiên đăng nhập ở mỗi request, và trả về người dùng hiện tại.
 *
 * Vì sao phải chạy ở middleware: Server Component **không ghi được cookie**. Token truy
 * cập của Supabase hết hạn sau một giờ, và chỉ có middleware mới có thể ghi lại cookie
 * đã làm mới vào response. Không có bước này thì người dùng bị đăng xuất sau một giờ
 * dù đang dùng liên tục.
 *
 * Chưa cấu hình Supabase thì trả về ngay, không đụng tới mạng — chế độ dữ liệu mẫu phải
 * chạy được hoàn toàn ngoại tuyến.
 */

export interface SupabaseSession {
  /** Response đã mang cookie phiên mới. Luôn dùng nó để trả về, kể cả khi redirect. */
  response: NextResponse
  /** `false` nghĩa là chế độ dữ liệu mẫu — cổng bảo vệ phải mở hoàn toàn. */
  configured: boolean
  userId: string | null
}

export async function updateSession(request: NextRequest): Promise<SupabaseSession> {
  let response = NextResponse.next({ request })

  const config = readSupabaseConfig()
  if (config === null) return { response, configured: false, userId: null }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        // Cookie phải được ghi vào CẢ request (để phần còn lại của chuỗi thấy phiên mới)
        // lẫn response (để trình duyệt lưu lại). Thiếu một trong hai thì phiên bị mất.
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })

  // `getUser()` chứ không phải `getSession()`: `getSession()` không xác thực lại với máy
  // chủ nên cookie giả đi qua được.
  const { data } = await supabase.auth.getUser()
  return { response, configured: true, userId: data.user?.id ?? null }
}
