import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { NEXT_COOKIE } from '@/lib/auth/redirect'

/**
 * Phần dùng chung của các route xác thực phía máy chủ.
 *
 * Tách khỏi `redirect.ts` vì file đó thuần (không đụng `next/headers`) để test được.
 */

/**
 * Ghi đích đến vào cookie trước khi gửi email có liên kết quay về `/auth/callback`.
 *
 * Lý do dùng cookie thay vì `?next=` trên URL: xem ghi chú ở `NEXT_COOKIE`.
 */
export async function rememberNextPath(next: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(NEXT_COOKIE, next, {
    httpOnly: true,
    // `lax` là mức tối thiểu vẫn cho cookie đi kèm khi người dùng mở liên kết trong email:
    // đó là một lượt điều hướng cấp cao nhất từ tên miền khác.
    sameSite: 'lax',
    // Trên `http://127.0.0.1`, cookie có `secure` sẽ bị trình duyệt bỏ luôn.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  })
}

/** Mặc định `false`: chưa đọc được hồ sơ thì đưa qua onboarding, không bỏ qua bước đó. */
export async function isOnboarded(supabase: SupabaseClient): Promise<boolean> {
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

/**
 * Nơi đưa người dùng tới ngay sau khi có phiên.
 *
 * Hồ sơ chưa xong thì qua onboarding trước. `tiep` mang theo đích đến ban đầu: thiếu nó, một
 * khách mở liên kết mời rồi bị đưa qua onboarding sẽ mất mã mời ở giữa đường.
 */
export async function destinationAfterSignIn(
  supabase: SupabaseClient,
  next: string,
): Promise<string> {
  if (await isOnboarded(supabase)) return next
  return `/onboarding?tiep=${encodeURIComponent(next)}`
}
