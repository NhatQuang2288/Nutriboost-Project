import { isSupabaseConfigured } from '@nutriboost/db'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { authErrorMessage, nextPathAfterSignUp, signUpSchema } from '@/lib/auth/credentials'
import { NEXT_COOKIE } from '@/lib/auth/redirect'
import { errorResponse, notConfiguredResponse, parseBody } from '@/lib/auth/route-helpers'
import { destinationAfterSignIn, rememberNextPath } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Tạo tài khoản bằng email + mật khẩu.
 *
 * **Không cấp vai trò nào.** Chọn "Personal Trainer" ở form chỉ đổi màn hình tiếp theo: vai trò
 * PT nằm ở `profiles.role` và chỉ được nâng sau khi gói dịch vụ được xác nhận thanh toán
 * (khoá service role, xem `npm run make:pt`). Cho người dùng tự chọn vai trò lúc đăng ký là tự
 * cấp quyền đọc hồ sơ khách của người khác.
 *
 * Mã mời cũng không được đổi ở đây. Khách được đưa tới `/tham-gia?ma=…` sau khi có phiên, để
 * dùng lại đúng luồng `redeem_invite_code` đã có test — không có đường đổi mã thứ hai.
 *
 * Hai kết quả, tuỳ cấu hình "Confirm email" của Supabase:
 *   • tắt → có phiên ngay, trả `redirectTo`
 *   • bật → chưa có phiên, trả `needsConfirmation`; liên kết trong email quay về
 *     `/auth/callback`, và đích đến đi bằng cookie như magic link.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseConfigured()) return notConfiguredResponse()

  const parsed = await parseBody(request, signUpSchema)
  if (parsed.response !== undefined) return parsed.response
  const { email, password, fullName, intent, inviteCode } = parsed.data

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return notConfiguredResponse()

  const next = nextPathAfterSignUp(intent, inviteCode, parsed.data.next)
  await rememberNextPath(next)

  const origin = new URL(request.url).origin
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // `handle_new_user` đọc `full_name` để tạo hồ sơ — đó là tên trong câu "Chào Minh".
      data: { full_name: fullName },
      // Không kèm tham số: danh sách URL được phép của Supabase khớp chính xác.
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error !== null) {
    return errorResponse(authErrorMessage(error.code), error.status === 429 ? 429 : 400)
  }

  if (data.session === null) {
    /*
     * Cần xác nhận email. Khi "Confirm email" đang bật và email **đã có** tài khoản, Supabase
     * cũng trả về đây mà không báo lỗi — cố ý, để không ai dò được email nào đã đăng ký. Câu
     * "kiểm tra hộp thư" đúng cho cả hai trường hợp.
     */
    return NextResponse.json({ ok: true, needsConfirmation: true })
  }

  // Có phiên ngay: cookie đích đến không còn cần, và để lại sẽ làm lệch lần đăng nhập sau.
  const cookieStore = await cookies()
  cookieStore.delete(NEXT_COOKIE)

  return NextResponse.json({ ok: true, redirectTo: await destinationAfterSignIn(supabase, next) })
}
