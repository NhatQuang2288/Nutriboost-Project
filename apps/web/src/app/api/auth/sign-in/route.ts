import { isSupabaseConfigured } from '@nutriboost/db'
import { NextResponse } from 'next/server'

import { authErrorMessage, signInSchema } from '@/lib/auth/credentials'
import { safeNextPath } from '@/lib/auth/redirect'
import { errorResponse, notConfiguredResponse, parseBody } from '@/lib/auth/route-helpers'
import { destinationAfterSignIn } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Đăng nhập bằng email + mật khẩu.
 *
 * Cookie phiên được ghi ngay trong response này (client gắn cookie của `@supabase/ssr`), nên
 * trình duyệt chỉ cần chuyển trang tới `redirectTo` là đã đăng nhập.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseConfigured()) return notConfiguredResponse()

  const parsed = await parseBody(request, signInSchema)
  if (parsed.response !== undefined) return parsed.response
  const { email, password } = parsed.data

  const supabase = await createSupabaseServerClient()
  if (supabase === null) return notConfiguredResponse()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error !== null) {
    return errorResponse(authErrorMessage(error.code), error.status === 429 ? 429 : 400)
  }

  const next = safeNextPath(parsed.data.next)
  return NextResponse.json({ ok: true, redirectTo: await destinationAfterSignIn(supabase, next) })
}
