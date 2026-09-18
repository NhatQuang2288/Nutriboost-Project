import { isSupabaseConfigured } from '@nutriboost/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { safeNextPath } from '@/lib/auth/redirect'
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
   * nằm ở route callback. Trỏ thẳng vào màn hình là luồng đăng nhập đứt ở bước cuối:
   * người dùng bấm liên kết, về tới trang chủ, và vẫn chưa đăng nhập.
   */
  const origin = new URL(request.url).origin
  const next = safeNextPath(parsed.data.next)
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
