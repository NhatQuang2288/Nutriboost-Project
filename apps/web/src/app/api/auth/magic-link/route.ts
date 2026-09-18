import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from '@nutriboost/db'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

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
})

export async function POST(request: Request): Promise<Response> {
  const config = readSupabaseConfig()
  if (config === null) {
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

  const cookieStore = await cookies()
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const origin = new URL(request.url).origin
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/hom-nay` },
  })

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
