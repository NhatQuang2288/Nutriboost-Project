import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { RESET_PASSWORD_PATH } from '@/lib/auth/credentials'
import { NEXT_COOKIE, safeNextPath } from '@/lib/auth/redirect'
import { destinationAfterSignIn } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Điểm hạ cánh của liên kết đăng nhập trong email.
 *
 * Trước đây route này **không tồn tại**, mà `signInWithOtp` lại đặt `emailRedirectTo`
 * trỏ về `/hom-nay`. Hệ quả: người dùng bấm liên kết trong email, được đưa tới
 * `/hom-nay?code=…`, và **không ai đổi mã đó thành phiên** — luồng đăng nhập đứt ở đúng
 * bước cuối, im lặng, không có lỗi nào hiện ra để mà lần theo.
 *
 * Nhận cả hai dạng liên kết mà Supabase phát ra, vì mẫu email có thể đổi:
 *   • `?code=…` — luồng PKCE, mẫu mặc định hiện nay.
 *   • `?token_hash=…&type=…` — luồng OTP, dùng khi mẫu email đổi sang `{{ .TokenHash }}`.
 */

/** Các giá trị `type` hợp lệ của luồng OTP. Danh sách trắng, không tin tham số từ URL. */
const OTP_TYPES: readonly string[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  /*
   * Đích đến đọc từ cookie do các route gửi email đặt (magic link, xác nhận đăng ký, quên
   * mật khẩu). Vẫn nhận thêm `?next=` để những liên kết đã gửi trước khi đổi cách vẫn hoạt động.
   *
   * Mở liên kết ở trình duyệt khác thì không có cookie: người dùng về `/hom-nay` (hoặc qua
   * onboarding) — mất đích đến sâu nhưng vẫn đăng nhập được, nhờ mẫu email dùng `token_hash`
   * (xem `supabase/config.toml`).
   */
  const cookieStore = await cookies()
  const next = safeNextPath(searchParams.get('next') ?? cookieStore.get(NEXT_COOKIE)?.value)

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=chua-cau-hinh`)
  }

  /*
   * Supabase báo liên kết hỏng (hết hạn, đã dùng) bằng `?error=…&error_code=otp_expired` thay vì
   * `code`. Trước đây nhánh này rơi xuống "liên kết thiếu mã" — sai sự thật, và không nói cho
   * người dùng biết việc cần làm là xin liên kết mới.
   */
  if (searchParams.has('error') || searchParams.has('error_code')) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=link-khong-dung`)
  }

  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error !== null) return NextResponse.redirect(`${origin}/dang-nhap?loi=link-khong-dung`)
  } else if (tokenHash !== null && type !== null && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    })
    if (error !== null) return NextResponse.redirect(`${origin}/dang-nhap?loi=link-khong-dung`)
  } else {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=link-thieu-ma`)
  }

  // Dùng xong thì xoá: cookie còn nằm lại nghĩa là lần đăng nhập sau ở cùng trình duyệt sẽ
  // bị đưa tới đích đến của lần trước.
  cookieStore.delete(NEXT_COOKIE)

  /*
   * Liên kết "quên mật khẩu" đi thẳng tới trang đặt mật khẩu mới. Vòng qua onboarding ở đây
   * nghĩa là người dùng chưa kịp đặt mật khẩu đã bị hỏi chiều cao cân nặng — và mất luôn lý
   * do họ mở email.
   *
   * Nhận biết bằng `type=recovery` trong liên kết, không chỉ bằng cookie: mở thư trên điện thoại
   * thì không có cookie của máy tính đã gửi yêu cầu.
   */
  if (type === 'recovery' || next === RESET_PASSWORD_PATH) {
    return NextResponse.redirect(`${origin}${RESET_PASSWORD_PATH}`)
  }

  /*
   * Hồ sơ đã hoàn tất chưa? Chưa thì đưa qua onboarding. Đây là chỗ duy nhất biết chắc
   * người dùng vừa đăng nhập lần đầu, nên chỉ tốn đúng một truy vấn cho mỗi lần đăng nhập.
   */
  return NextResponse.redirect(`${origin}${await destinationAfterSignIn(supabase, next)}`)
}
