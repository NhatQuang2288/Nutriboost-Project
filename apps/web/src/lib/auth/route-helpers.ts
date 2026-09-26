import { NextResponse } from 'next/server'
import type { z } from 'zod'

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
