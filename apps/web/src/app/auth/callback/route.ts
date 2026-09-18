import { type EmailOtpType, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { NEXT_COOKIE, safeNextPath } from '@/lib/auth/redirect'
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
   * Đích đến đọc từ cookie do `/api/auth/magic-link` đặt. Vẫn nhận thêm `?next=` để những
   * liên kết đã gửi trước khi đổi cách vẫn hoạt động.
   */
  const cookieStore = await cookies()
  const next = safeNextPath(searchParams.get('next') ?? cookieStore.get(NEXT_COOKIE)?.value)

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=chua-cau-hinh`)
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

  /*
   * Hồ sơ đã hoàn tất chưa? Chưa thì đưa qua onboarding. Đây là chỗ duy nhất biết chắc
   * người dùng vừa đăng nhập lần đầu, nên chỉ tốn đúng một truy vấn cho mỗi lần đăng nhập.
   *
   * `tiep` mang theo đích đến ban đầu. Thiếu nó, một khách mở liên kết mời rồi bị đưa qua
   * onboarding sẽ mất mã mời ở giữa đường và phải nhờ PT gửi lại.
   */
  const onboarded = await isOnboarded(supabase)

  // Dùng xong thì xoá: cookie còn nằm lại nghĩa là lần đăng nhập sau ở cùng trình duyệt sẽ
  // bị đưa tới đích đến của lần trước.
  cookieStore.delete(NEXT_COOKIE)

  if (onboarded) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/onboarding?tiep=${encodeURIComponent(next)}`)
}

/** Mặc định `false`: chưa đọc được hồ sơ thì đưa qua onboarding, không bỏ qua bước đó. */
async function isOnboarded(supabase: SupabaseClient): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (userId === undefined) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', userId)
    .maybeSingle()

  if (error !== null || data === null) return false
  return (data as { onboarded_at: string | null }).onboarded_at !== null
}
