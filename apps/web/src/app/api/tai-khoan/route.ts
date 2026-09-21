import { NextResponse } from 'next/server'

import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  getSessionUser,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Xoá tài khoản và toàn bộ dữ liệu của người dùng đang đăng nhập.
 *
 * Cách làm: xoá bản ghi trong `auth.users`, rồi để khoá ngoại lo phần còn lại. Mọi bảng
 * dữ liệu người dùng đều trỏ tới `profiles` với `on delete cascade`, và `profiles` trỏ tới
 * `auth.users` cũng `on delete cascade` — nên một lệnh xoá là đủ, và **không thể sót bảng**
 * như khi tự tay xoá từng bảng ở tầng ứng dụng.
 *
 * Hai ngoại lệ có chủ ý trong schema:
 *   • `ai_calls.user_id` là `on delete set null` — nhật ký chi phí ở lại để đối soát
 *     hoá đơn, nhưng không còn gắn với người dùng nào.
 *   • `analytics_events.user_id` cũng `on delete set null`, cùng lý do.
 *
 * Bắt buộc `DELETE` và bắt buộc có phiên: không ai xoá được dữ liệu của người khác, vì
 * `userId` lấy từ phiên chứ không lấy từ tham số request.
 */
export async function DELETE(): Promise<NextResponse> {
  const user = await getSessionUser()
  if (user === null) {
    return NextResponse.json({ error: 'Cần đăng nhập để xoá dữ liệu.' }, { status: 401 })
  }

  const service = createSupabaseServiceClient()
  if (service === null) {
    return NextResponse.json(
      { error: 'Thiếu SUPABASE_SERVICE_ROLE_KEY nên chưa xoá được tài khoản.' },
      { status: 503 },
    )
  }

  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error !== null) {
    return NextResponse.json(
      { error: `Không xoá được tài khoản: ${error.message}` },
      { status: 500 },
    )
  }

  // Phiên trong cookie giờ trỏ tới một người dùng không còn tồn tại. Đăng xuất để trình
  // duyệt không giữ lại cookie rác và không gọi API bằng một danh tính đã chết.
  const supabase = await createSupabaseServerClient()
  await supabase?.auth.signOut()

  return NextResponse.json({ ok: true })
}
