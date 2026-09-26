import { isSupabaseConfigured } from '@nutriboost/db'
import { NextResponse } from 'next/server'

import { RESET_PASSWORD_PATH, authErrorMessage, forgotPasswordSchema } from '@/lib/auth/credentials'
import { errorResponse, notConfiguredResponse, parseBody } from '@/lib/auth/route-helpers'
import { rememberNextPath } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Gửi liên kết đặt lại mật khẩu.
 *
 * Liên kết quay về `/auth/callback` (không kèm tham số — danh sách URL được phép khớp chính
 * xác), callback đổi mã thành phiên rồi đưa thẳng tới `RESET_PASSWORD_PATH` nhờ cookie đích đến.
 *
 * Trả thành công **kể cả khi email chưa có tài khoản**: báo "không tìm thấy email" là cho bất kỳ
 * ai dò được email nào đã đăng ký NutriBoost. Supabase cũng làm y như vậy.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseConfigured()) return notConfiguredResponse()

  const parsed = await parseBody(request, forgotPasswordSchema)
  if (parsed.response !== undefined) return parsed.response

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return notConfiguredResponse()

  await rememberNextPath(RESET_PASSWORD_PATH)

  const origin = new URL(request.url).origin
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback`,
  })

  // Chỉ báo lỗi mà người dùng làm được gì đó — gửi quá dày thì đợi. Lỗi khác vẫn trả thành
  // công vì lý do ở trên.
  if (error !== null && error.status === 429) {
    return errorResponse(authErrorMessage(error.code), 429)
  }

  return NextResponse.json({ ok: true })
}
