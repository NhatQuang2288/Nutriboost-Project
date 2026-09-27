import type { SupabaseClient } from '@supabase/supabase-js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Đổi slug thành UUID của bảng `foods`; UUID giữ nguyên.
 *
 * Slug không tra được thì thành `null` chứ không làm hỏng cả bữa: hàm CSDL vẫn giữ tên món để
 * bổ sung dữ liệu sau — cùng cách `createMealLogger` làm cho công cụ `log_meal`.
 */
export async function resolveFoodIds(
  supabase: Pick<SupabaseClient, 'from'>,
  ids: readonly (string | null)[],
): Promise<(string | null)[]> {
  const slugs = [
    ...new Set(ids.filter((id): id is string => id !== null && !UUID_PATTERN.test(id))),
  ]
  if (slugs.length === 0) return ids.map((id) => id)

  const { data } = await supabase.from('foods').select('id, slug').in('slug', slugs)
  const idBySlug = new Map(
    ((data ?? []) as { id: string; slug: string }[]).map((row) => [row.slug, row.id]),
  )

  return ids.map((id) => {
    if (id === null || UUID_PATTERN.test(id)) return id
    return idBySlug.get(id) ?? null
  })
}
