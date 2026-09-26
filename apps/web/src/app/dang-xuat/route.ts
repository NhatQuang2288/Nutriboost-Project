import { NextResponse, type NextRequest } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Đăng xuất.
 *
 * Chỉ nhận `POST`: nếu nhận `GET` thì trình duyệt (và mọi trình thu thập liên kết) có thể
 * vô tình đăng xuất người dùng chỉ bằng cách tải trước một đường dẫn.
 *
 * Dùng 303 để trình duyệt chuyển sang `GET /dang-nhap` sau khi `POST` xong — nếu trả 307
 * thì nó giữ nguyên phương thức và gửi tiếp một `POST` nữa vào màn đăng nhập.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient()
  if (supabase !== null) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/dang-nhap', request.url), { status: 303 })
}
