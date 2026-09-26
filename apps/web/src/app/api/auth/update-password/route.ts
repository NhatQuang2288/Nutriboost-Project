import { isSupabaseConfigured } from '@nutriboost/db'
import { NextResponse } from 'next/server'

import { authErrorMessage, updatePasswordSchema } from '@/lib/auth/credentials'
import { errorResponse, notConfiguredResponse, parseBody } from '@/lib/auth/route-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Đặt mật khẩu mới cho người dùng đang có phiên.
 *
 * Phiên đến từ liên kết "quên mật khẩu" (qua `/auth/callback`), hoặc từ một lần đăng nhập bình
 * thường — nên tài khoản tạo bằng magic link cũng dùng route này để đặt mật khẩu lần đầu.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseConfigured()) return notConfiguredResponse()

  const parsed = await parseBody(request, updatePasswordSchema)
  if (parsed.response !== undefined) return parsed.response

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return notConfiguredResponse()

  // `getUser()` hỏi thẳng Supabase Auth; `getSession()` tin cookie mà không xác thực lại.
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user === null) {
    return errorResponse(authErrorMessage('session_not_found'), 401)
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error !== null) {
    return errorResponse(authErrorMessage(error.code), error.status === 429 ? 429 : 400)
  }

  return NextResponse.json({ ok: true })
}
