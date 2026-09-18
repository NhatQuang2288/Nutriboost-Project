import { isSupabaseConfigured } from '@nutriboost/db'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { NEXT_COOKIE, safeNextPath } from '@/lib/auth/redirect'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Gửi liên kết đăng nhập bằng email (magic link).
 *
 * Dùng magic link thay vì mật khẩu: ít thao tác hơn cho người dùng, và không phải
 * quản lý băm mật khẩu. Đây là lựa chọn có chủ ý theo nguyên tắc "hạn chế thao tác".
 *
 * Khi chưa cấu hình Supabase, route trả 503 kèm lời giải thích — không giả vờ thành công.
 */

const requestSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  /** Đường dẫn quay lại sau khi đăng nhập. Chỉ nhận đường dẫn nội bộ. */
  next: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Chưa cấu hình Supabase nên chưa gửi được liên kết đăng nhập. ' +
          'Bạn vẫn dùng được ứng dụng ở chế độ dữ liệu mẫu.',
      },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body không phải JSON hợp lệ.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' },
      { status: 400 },
    )
  }

  const supabase = await createSupabaseServerClient()
  if (supabase === null) {
    return NextResponse.json({ error: 'Chưa kết nối được Supabase.' }, { status: 503 })
  }

  /*
   * `emailRedirectTo` phải trỏ tới `/auth/callback`, không phải thẳng vào `/hom-nay`.
   * Supabase gắn `?code=…` vào URL này, và phải có người đổi mã đó thành phiên — việc đó
   * nằm ở route callback.
   *
   * URL này **không kèm tham số nào**, và đó là điều kiện để nó chạy được: danh sách URL
   * được phép của Supabase khớp chính xác, nên `…/auth/callback?next=…` không khớp
   * `…/auth/callback` và Supabase từ chối, lặng lẽ trả người dùng về `site_url`. Đã xảy ra
   * thật: liên kết đổ vào trang chủ kèm `?code=…` mà không ai đổi mã đó thành phiên.
   *
   * Đích đến đi bằng cookie thay vì chuỗi truy vấn.
   */
  const origin = new URL(request.url).origin
  const next = safeNextPath(parsed.data.next)

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

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
