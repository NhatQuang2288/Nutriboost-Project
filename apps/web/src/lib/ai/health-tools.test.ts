import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { createMealLogger, createProgressReader } from './health-tools'

/**
 * Ranh giới giữa `@nutriboost/ai` và CSDL.
 *
 * Gói AI làm việc với `slug` của danh mục thực phẩm, CSDL dùng `uuid`. Việc đổi khoá nằm ở
 * đây, và nếu nó sai thì bữa ăn vẫn được ghi nhưng mọi món đều mất liên kết với danh mục —
 * hỏng im lặng, vì `food_id` vốn cho phép NULL.
 */

interface FoodRow {
  id: string
  slug: string
}

function fakeClient(options: {
  foods?: FoodRow[]
  rpcError?: string
  summaries?: { local_date: string; kcal_in: number }[]
  summariesError?: string
}) {
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = []

  const client = {
    from: () => ({
      select: () => ({
        in: async () => ({ data: options.foods ?? [], error: null }),
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: options.summaries ?? [],
              error:
                options.summariesError === undefined ? null : { message: options.summariesError },
            }),
          }),
        }),
      }),
    }),
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args })
      return { error: options.rpcError === undefined ? null : { message: options.rpcError } }
    },
  } as unknown as SupabaseClient

  return { client, rpcCalls }
}

function request(foodId: string, grams = 500) {
  return {
    mealType: 'breakfast' as const,
    rawInput: 'sáng nay mình ăn phở bò',
    items: [{ foodId, displayName: 'Phở bò', grams, kcal: 460, proteinG: 27, carbG: 59, fatG: 14 }],
  }
}

describe('createMealLogger', () => {
  it('đổi slug của danh mục thành uuid của CSDL trước khi ghi', async () => {
    const { client, rpcCalls } = fakeClient({
      foods: [{ id: '11111111-1111-1111-1111-111111111111', slug: 'pho-bo' }],
    })

    const logMeal = createMealLogger({
      supabase: client,
      userId: 'u1',
      localDate: '2026-09-18',
      consumedKcalBefore: 0,
      kcalBurned: 0,
      targetKcal: 2000,
    })

    await logMeal(request('pho-bo'))

    const items = rpcCalls[0]?.args['p_items'] as { foodId: string | null }[]
    expect(rpcCalls[0]?.name).toBe('log_meal_with_items')
    expect(items[0]?.foodId).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('món không có trong CSDL vẫn được ghi với foodId null', async () => {
    // Hàm trong CSDL giữ lại tên món để bổ sung danh mục sau, thay vì mất cả bữa ăn.
    const { client, rpcCalls } = fakeClient({ foods: [] })

    const logMeal = createMealLogger({
      supabase: client,
      userId: 'u1',
      localDate: '2026-09-18',
      consumedKcalBefore: 0,
      kcalBurned: 0,
      targetKcal: 2000,
    })

    await logMeal(request('mon-la'))

    const items = rpcCalls[0]?.args['p_items'] as { foodId: string | null; displayName: string }[]
    expect(items[0]?.foodId).toBeNull()
    expect(items[0]?.displayName).toBe('Phở bò')
  })

  it('tính số kcal còn lại sau khi trừ bữa vừa ghi', async () => {
    const { client } = fakeClient({ foods: [] })

    const logMeal = createMealLogger({
      supabase: client,
      userId: 'u1',
      localDate: '2026-09-18',
      consumedKcalBefore: 800,
      kcalBurned: 200,
      targetKcal: 2000,
    })

    // 2000 + 200 đốt − 800 đã nạp − 460 của bữa này = 940
    await expect(logMeal(request('pho-bo'))).resolves.toEqual({ remainingKcal: 940 })
  })

  it('ném lỗi khi CSDL từ chối, để công cụ đổi thành lời từ chối', async () => {
    // Ném ở đây là chủ ý: công cụ `log_meal` bắt lấy và giữ nguyên thông báo gốc của
    // PostgreSQL. Nếu hàm này tự nuốt lỗi thì model sẽ tưởng bữa ăn đã được lưu.
    const { client } = fakeClient({ foods: [], rpcError: 'permission denied' })

    const logMeal = createMealLogger({
      supabase: client,
      userId: 'u1',
      localDate: '2026-09-18',
      consumedKcalBefore: 0,
      kcalBurned: 0,
      targetKcal: 2000,
    })

    await expect(logMeal(request('pho-bo'))).rejects.toThrow(/permission denied/)
  })
})

describe('createProgressReader', () => {
  it('đảo thứ tự thành tăng dần theo thời gian cho biểu đồ', async () => {
    const { client } = fakeClient({
      summaries: [
        { local_date: '2026-09-18', kcal_in: 2000 },
        { local_date: '2026-09-17', kcal_in: 1800 },
      ],
    })

    const read = createProgressReader({ supabase: client, userId: 'u1' })

    expect(await read(7)).toEqual([
      { label: '17/09/2026', value: 1800 },
      { label: '18/09/2026', value: 2000 },
    ])
  })

  it('đọc hỏng thì trả mảng rỗng thay vì ném lỗi', async () => {
    // Biểu đồ rỗng trung thực hơn một lỗi bị AI SDK che và biến thành câu bịa của model.
    const { client } = fakeClient({ summariesError: 'connection reset' })

    const read = createProgressReader({ supabase: client, userId: 'u1' })

    await expect(read(7)).resolves.toEqual([])
  })
})
