import { NextResponse, type NextRequest } from 'next/server'

import { isProtectedApi, isProtectedPage } from '@/lib/auth/routes'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Cổng bảo vệ route.
 *
 * Hai chế độ, và sự khác biệt là có chủ ý:
 *
 *   • **Chưa cấu hình Supabase** — không chặn gì cả. Đây là chế độ dữ liệu mẫu dùng cho
 *     Tuần 0 của lộ trình: cả đội dựng được giao diện trước khi có tài khoản Supabase, và
 *     bộ kiểm thử đầu-cuối chạy đúng ở chế độ này.
 *   • **Đã cấu hình** — mọi màn hình trong ứng dụng đều cần phiên hợp lệ. Chưa đăng nhập
 *     thì bị đưa về `/dang-nhap` kèm `next` để quay lại đúng chỗ đang định vào.
 *
 * Trước đây không có file này, nên `/pt` và `/hom-nay` ai mở cũng vào được, và phiên
 * không bao giờ được làm mới (token hết hạn sau một giờ là mất phiên giữa chừng).
 *
 * Danh sách route nằm ở `@/lib/auth/routes` để có test — xem `routes.test.ts`. Đây là
 * biên bảo mật, nên nó phải kiểm thử được chứ không nằm im trong file này.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, configured, userId } = await updateSession(request)

  // Chế độ dữ liệu mẫu: mở hoàn toàn, không chặn và không redirect.
  if (!configured) return response

  const { pathname, search } = request.nextUrl

  if (isProtectedApi(pathname)) {
    if (userId === null) {
      return NextResponse.json({ error: 'Cần đăng nhập để dùng trợ lý Bơ.' }, { status: 401 })
    }
    return response
  }

  // Đã đăng nhập mà còn vào màn đăng nhập thì đưa vào ứng dụng.
  if (userId !== null && pathname === '/dang-nhap') {
    return keepCookies(response, request, '/hom-nay')
  }

  if (isProtectedPage(pathname) && userId === null) {
    return keepCookies(
      response,
      request,
      `/dang-nhap?next=${encodeURIComponent(pathname + search)}`,
    )
  }

  return response
}

/**
 * Redirect nhưng **mang theo cookie phiên vừa được làm mới**.
 *
 * Bỏ bước này là mất phiên ngay tại request làm mới nó: `updateSession` ghi cookie mới vào
 * `response`, còn `NextResponse.redirect` tạo một response rỗng khác.
 */
function keepCookies(from: NextResponse, request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone()
  const [pathname = '/', query = ''] = path.split('?')
  url.pathname = pathname
  url.search = query.length > 0 ? `?${query}` : ''

  const redirect = NextResponse.redirect(url)
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}

export const config = {
  /*
   * Bỏ qua tài nguyên tĩnh. Chạy middleware trên mỗi tệp `.js`/`.css` sẽ tốn một vòng
   * gọi mạng tới Supabase cho mỗi tài nguyên, và làm chậm trang một cách vô ích.
   *
   * Cũng bỏ qua `/auth/callback`: route đó tự đổi mã thành phiên, nên cho middleware chạy
   * trước chỉ tốn thêm một lời gọi mạng mà không đóng góp gì.
   */
  matcher: [
    '/((?!_next/static|_next/image|auth/callback|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml)$).*)',
  ],
}
