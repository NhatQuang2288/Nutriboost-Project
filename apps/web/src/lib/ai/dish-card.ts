import {
  GENERATIVE_COMPONENTS,
  type MealCatalogueEntry,
  buildDishDetail,
  toDishDetailCard,
} from '@nutriboost/ai'
import { z } from 'zod'

/**
 * Tính lại thẻ chi tiết món theo khối lượng khách chỉnh — phía MÁY CHỦ.
 *
 * Giao diện không tự cộng trừ dinh dưỡng (xem `generative/components.tsx`): con số luôn do máy chủ
 * gửi xuống, từ cùng danh mục và cùng hàm `buildDishDetail` mà trợ lý dùng. Nhờ vậy số trên thẻ
 * sau khi chỉnh khớp với số mà Bơ nói trong chat.
 */

export const recomputeDishSchema = z
  .object({
    foodId: z.string().trim().min(1).max(64),
    /** Khối lượng cả món (g). */
    grams: z.number().finite().min(1).max(5000).optional(),
    /** Gram từng nguyên liệu, khoá là tên nguyên liệu trong món. */
    componentGrams: z
      .record(z.string().trim().min(1).max(80), z.number().finite().min(0).max(5000))
      .refine((value) => Object.keys(value).length <= 40, 'Quá nhiều nguyên liệu.')
      .optional(),
  })
  .refine(
    (value) =>
      value.grams === undefined ||
      value.componentGrams === undefined ||
      Object.keys(value.componentGrams).length === 0,
    'Chỉ chỉnh khối lượng cả món HOẶC từng nguyên liệu, không chỉnh cùng lúc cả hai.',
  )

export type RecomputeDishInput = z.input<typeof recomputeDishSchema>
export type DishCardProps = z.infer<typeof GENERATIVE_COMPONENTS.dish_detail_card>

export type RecomputeDishResult = { ok: true; card: DishCardProps } | { ok: false; message: string }

export function computeDishCard(
  catalogue: readonly MealCatalogueEntry[],
  input: unknown,
): RecomputeDishResult {
  const parsed = recomputeDishSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dữ liệu chỉnh không hợp lệ.' }
  }

  const { foodId, grams, componentGrams } = parsed.data
  const entry = catalogue.find((item) => item.slug === foodId)
  if (entry === undefined) {
    return { ok: false, message: 'Không tìm thấy món này trong danh mục.' }
  }

  const result = buildDishDetail(entry, catalogue, {
    ...(grams === undefined ? {} : { grams }),
    ...(componentGrams === undefined || Object.keys(componentGrams).length === 0
      ? {}
      : { componentGrams }),
  })
  if (!result.ok) return { ok: false, message: result.reason }

  return {
    ok: true,
    card: GENERATIVE_COMPONENTS.dish_detail_card.parse(toDishDetailCard(result.detail)),
  }
}
