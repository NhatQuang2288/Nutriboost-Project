import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { authErrorMessage } from '@/lib/auth/credentials'

/**
 * Phần lặp lại của các route `/api/auth/*`.
 *
 * Mọi route xác thực trả JSON `{ error }` kèm mã HTTP đúng nghĩa, và **không bao giờ giả vờ
 * thành công** khi chưa cấu hình Supabase — cùng quy ước với `/api/auth/magic-link`.
 */

export function notConfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Chưa cấu hình Supabase nên chưa dùng được tài khoản. ' +
        'Bạn vẫn dùng được ứng dụng ở chế độ dữ liệu mẫu.',
    },
    { status: 503 },
  )
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Trả lỗi của Supabase Auth cho trình duyệt, và **ghi lý do thật ra log máy chủ**.
 *
 * Câu hiển thị cố ý chung chung (xem `authErrorMessage`), nên không có dòng log này thì một lỗi
 * như "Database error saving new user" (trigger `handle_new_user` hỏng) chỉ hiện ra là "Có lỗi
 * khi xử lý tài khoản" mà không có manh mối nào để lần theo. Mã 5xx của Supabase được giữ là
 * 502 thay vì bị đổi thành 400 như lỗi do người dùng nhập sai.
 */
export function authFailureResponse(
  where: string,
  error: { code?: string | undefined; status?: number | undefined; message: string },
): NextResponse {
  console.error(`[auth] ${where} thất bại`, {
    code: error.code,
    status: error.status,
    message: error.message,
  })
  const status = error.status === 429 ? 429 : (error.status ?? 0) >= 500 ? 502 : 400
  return errorResponse(authErrorMessage(error.code), status)
}

/** Đọc body JSON rồi kiểm bằng `schema`. Trả `response` sẵn để route trả về khi hỏng. */
export async function parseBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<{ data: z.infer<Schema>; response?: never } | { data?: never; response: NextResponse }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { response: errorResponse('Body không phải JSON hợp lệ.', 400) }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      response: errorResponse(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.', 400),
    }
  }
  return { data: parsed.data }
}
