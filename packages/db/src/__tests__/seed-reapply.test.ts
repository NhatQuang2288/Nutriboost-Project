import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildDataset } from '@nutriboost/seed'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createTestDatabase } from './harness'

/**
 * Chạy lại `seed.sql` trên CSDL ĐÃ có dữ liệu — đúng cách danh mục được cập nhật trên Supabase
 * thật, nơi không ai `db reset`.
 *
 * Vì sao cần: seed chỉ upsert thì thành phần đã bỏ khỏi định nghĩa món vẫn nằm lại. Lần bổ sung
 * danh mục đổi xôi gà từ gạo tẻ sang gạo nếp; không xoá thành phần cũ thì món có cả hai thứ gạo
 * và calo trong CSDL gấp đôi số trong mã.
 */

const SEED_FILE = join(
  fileURLToPath(new URL('../../../../', import.meta.url)),
  'supabase',
  'seed.sql',
)

type Db = Awaited<ReturnType<typeof createTestDatabase>>

let db: Db

beforeAll(async () => {
  db = await createTestDatabase()
})

afterAll(async () => {
  await db.close()
})

async function components(dishSlug: string): Promise<string[]> {
  const result = await db.query<{ slug: string }>(
    `select i.slug from public.dish_components dc
       join public.foods d on d.id = dc.dish_id
       join public.foods i on i.id = dc.ingredient_id
      where d.slug = $1 order by i.slug`,
    [dishSlug],
  )
  return result.rows.map((row) => row.slug)
}

describe('seed.sql chạy lại được trên CSDL đã có dữ liệu', () => {
  it('xoá thành phần không còn trong định nghĩa món, và tính lại calo đúng', async () => {
    // Giả lập CSDL cũ: xôi gà còn thành phần gạo tẻ của bản trước.
    await db.query(
      `insert into public.dish_components (dish_id, ingredient_id, grams)
       select d.id, i.id, 120 from public.foods d, public.foods i
        where d.slug = 'xoi-ga' and i.slug = 'gao-te'`,
    )
    expect(await components('xoi-ga')).toContain('gao-te')

    await db.exec(readFileSync(SEED_FILE, 'utf8'))

    expect(await components('xoi-ga')).not.toContain('gao-te')

    const expected = buildDataset().dishes.find((dish) => dish.slug === 'xoi-ga')
    const actual = await db.query<{ kcal: string }>(
      `select kcal_per_100g as kcal from public.foods where slug = 'xoi-ga'`,
    )
    expect(Number(actual.rows[0]?.kcal)).toBeCloseTo(expected?.kcalPer100g ?? -1, 0)
  })

  it('món trong CSDL khớp calo tính trong mã sau khi nạp seed', async () => {
    const dataset = buildDataset()
    const result = await db.query<{ slug: string; kcal: string }>(
      `select slug, kcal_per_100g as kcal from public.foods where kind = 'dish'`,
    )
    const bySlug = new Map(result.rows.map((row) => [row.slug, Number(row.kcal)]))

    const mismatched = dataset.dishes.filter(
      (dish) => Math.abs((bySlug.get(dish.slug) ?? -1) - dish.kcalPer100g) > 1,
    )
    expect(mismatched.map((dish) => dish.slug)).toEqual([])
  })
})
