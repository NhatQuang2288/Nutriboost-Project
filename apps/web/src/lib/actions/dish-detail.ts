'use server'

import { loadCatalogue } from '@/lib/ai/catalogue'
import { type RecomputeDishResult, computeDishCard } from '@/lib/ai/dish-card'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Tính lại thẻ chi tiết món khi khách sửa khối lượng ngay trên thẻ.
 *
 * Không đòi đăng nhập: đây chỉ là phép tính trên danh mục dùng chung, không ghi gì xuống CSDL.
 * Danh mục lấy qua `loadCatalogue` (Supabase, rơi về danh mục trong mã), nên số tính ở đây khớp
 * số mà chat dùng.
 *
 * Trả về kết quả thay vì ném lỗi, như mọi Server Action khác trong dự án (xem `actions/types.ts`).
 */
export async function recomputeDishAction(input: unknown): Promise<RecomputeDishResult> {
  const client = await createSupabaseServerClient()
  const { catalogue } = await loadCatalogue(client)
  return computeDishCard(catalogue, input)
}
