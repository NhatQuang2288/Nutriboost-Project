import { buildCatalogue } from '@nutriboost/seed'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CATALOGUE_TTL_MS,
  loadCatalogue,
  parseComponents,
  resetCatalogueCache,
  rowToEntry,
} from './catalogue'

/**
 * Client giả: chỉ dựng đúng chuỗi `from().select().order().range()` mà bộ nạp dùng, trả dữ liệu
 * theo bảng và cắt theo trang như PostgREST.
 */
function fakeClient(tables: Record<string, unknown[]>, failWith?: string) {
  const calls: string[] = []
  const client = {
    from(table: string) {
      return {
        select: () => ({
          order: () => ({
            range: async (from: number, to: number) => {
              calls.push(`${table}:${from}-${to}`)
              if (failWith !== undefined) return { data: null, error: { message: failWith } }
              return { data: (tables[table] ?? []).slice(from, to + 1), error: null }
            },
          }),
        }),
      }
    },
  }
  return { client: client as unknown as SupabaseClient, calls }
}

/** Dòng `foods` đúng như PostgREST trả về, dựng từ danh mục trong mã. */
function foodRows(): Record<string, unknown>[] {
  return buildCatalogue().map((entry, index) => ({
    id: `id-${index}`,
    slug: entry.slug,
    name_vi: entry.nameVi,
    kind: entry.kind,
    category: entry.category,
    serving_name: entry.servingName ?? null,
    serving_grams: entry.servingGrams ?? null,
    kcal_per_100g: entry.kcalPer100g,
    protein_g: entry.proteinG,
    carb_g: entry.carbG,
    fat_g: entry.fatG,
    fiber_g: entry.fiberG ?? 0,
    sugar_g: entry.sugarG ?? 0,
    sodium_mg: entry.sodiumMg ?? 0,
    components: entry.components ?? null,
    components_estimated: entry.componentsEstimated ?? false,
  }))
}

beforeEach(() => {
  resetCatalogueCache()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadCatalogue — nguồn là Supabase', () => {
  it('AI dùng số liệu trong CSDL, không phải số trong mã', async () => {
    const rows = foodRows()
    const pho = rows.find((row) => row.name_vi === 'Phở bò chín')!
    // Sửa trực tiếp trong CSDL: 777 kcal/100 g. Nếu AI vẫn đọc danh mục trong mã thì sẽ ra 97.
    pho.kcal_per_100g = 777

    const { client } = fakeClient({ foods: rows, food_aliases: [] })
    const result = await loadCatalogue(client)

    expect(result.source).toBe('supabase')
    expect(result.reason).toBeNull()
    expect(result.catalogue.find((item) => item.slug === 'pho-bo-chin')?.kcalPer100g).toBe(777)
    expect(result.estimator.estimate('phở bò chín').items[0]?.nutrients.kcal).toBe(
      Math.round(7.77 * 450),
    )
  })

  it('đọc thành phần, cờ ước tính và bí danh từ CSDL', async () => {
    const rows = foodRows()
    const caoLau = rows.find((row) => row.slug === 'cao-lau-hoi-an')!
    const { client } = fakeClient({
      foods: rows,
      food_aliases: [{ food_id: caoLau.id, alias: 'Cao lầu' }],
    })

    const result = await loadCatalogue(client)
    const entry = result.catalogue.find((item) => item.slug === 'cao-lau-hoi-an')

    expect(entry?.aliases).toEqual(['Cao lầu'])
    expect(entry?.components?.length).toBeGreaterThan(0)
    expect(entry?.componentsEstimated).toBe(true)
    // Bí danh từ CSDL dùng được để khớp tên.
    expect(result.estimator.estimate('mình ăn cao lầu').items[0]?.foodId).toBe('cao-lau-hoi-an')
  })

  it('đọc theo trang khi CSDL có hơn 1.000 dòng', async () => {
    const real = foodRows()
    const filler = Array.from({ length: 1200 - real.length }, (_, index) => ({
      ...real[0],
      id: `filler-${index}`,
      slug: `filler-${index}`,
      name_vi: `Món thử ${index}`,
    }))
    const { client, calls } = fakeClient({ foods: [...real, ...filler], food_aliases: [] })

    const result = await loadCatalogue(client)

    expect(result.catalogue).toHaveLength(1200)
    expect(calls.filter((call) => call.startsWith('foods:'))).toEqual([
      'foods:0-999',
      'foods:1000-1999',
    ])
  })

  it('giữ trong bộ nhớ, hết hạn thì đọc lại', async () => {
    const { client, calls } = fakeClient({ foods: foodRows(), food_aliases: [] })

    await loadCatalogue(client, 1_000)
    const afterFirst = calls.length
    await loadCatalogue(client, 1_000 + CATALOGUE_TTL_MS - 1)
    expect(calls.length).toBe(afterFirst)

    await loadCatalogue(client, 1_000 + CATALOGUE_TTL_MS + 1)
    expect(calls.length).toBeGreaterThan(afterFirst)
  })
})

describe('loadCatalogue — phương án dự phòng, luôn nói lý do', () => {
  it('chưa cấu hình Supabase thì dùng danh mục trong mã', async () => {
    const result = await loadCatalogue(null)
    expect(result.source).toBe('seed')
    expect(result.reason).toMatch(/Chưa cấu hình Supabase/)
    expect(result.catalogue.length).toBeGreaterThan(0)
  })

  it('CSDL chưa nạp lại seed thì KHÔNG lùi về dữ liệu cũ, và báo cách sửa', async () => {
    // 91 dòng: đúng số món của danh mục cũ trước khi có bảng VDD.
    const { client } = fakeClient({ foods: foodRows().slice(0, 91), food_aliases: [] })

    const result = await loadCatalogue(client)

    expect(result.source).toBe('seed')
    expect(result.catalogue.length).toBeGreaterThan(91)
    expect(result.reason).toMatch(/Supabase có 91 thực phẩm/)
    expect(result.reason).toMatch(/db:reset/)
    expect(console.warn).toHaveBeenCalled()
  })

  it('CSDL rỗng cũng là chưa nạp seed', async () => {
    const { client } = fakeClient({ foods: [], food_aliases: [] })
    expect((await loadCatalogue(client)).source).toBe('seed')
  })

  it('lỗi đọc thì dùng danh mục trong mã, nói lý do thật, và lần sau thử lại', async () => {
    const failing = fakeClient({}, 'permission denied for table foods')
    const first = await loadCatalogue(failing.client)
    expect(first.source).toBe('seed')
    expect(first.reason).toMatch(/permission denied for table foods/)

    // Không lưu đệm lỗi: một lần hỏng không được kẹt AI ở dữ liệu dự phòng suốt vài phút.
    const healthy = fakeClient({ foods: foodRows(), food_aliases: [] })
    expect((await loadCatalogue(healthy.client)).source).toBe('supabase')
  })
})

describe('parseComponents', () => {
  it('nhận mảng đúng khuôn', () => {
    expect(
      parseComponents([
        { name: 'Bánh phở', grams: 200, ingredientSlug: 'pho-tuoi' },
        { name: 'Hành', grams: 15 },
      ]),
    ).toEqual([
      { name: 'Bánh phở', grams: 200, ingredientSlug: 'pho-tuoi' },
      { name: 'Hành', grams: 15 },
    ])
  })

  it('bỏ cả mảng nếu có phần tử sai khuôn, thay vì để dữ liệu lạ lọt tới giao diện', () => {
    for (const bad of [
      null,
      'x',
      {},
      [{ name: 'A' }],
      [{ name: '', grams: 1 }],
      [{ name: 'A', grams: -1 }],
      [1],
    ]) {
      expect(parseComponents(bad), JSON.stringify(bad)).toBeUndefined()
    }
  })
})

describe('rowToEntry', () => {
  it('đổi số dạng chuỗi của PostgREST thành số, và bỏ qua cột thiếu', () => {
    const entry = rowToEntry(
      {
        id: '1',
        slug: 'x',
        name_vi: 'X',
        kind: 'dish',
        category: null,
        serving_name: null,
        serving_grams: '250.0',
        kcal_per_100g: '120.5',
        protein_g: '5',
        carb_g: '10',
        fat_g: '2',
        fiber_g: null,
        sugar_g: null,
        sodium_mg: null,
        components: null,
        components_estimated: null,
      },
      [],
    )
    expect(entry.servingGrams).toBe(250)
    expect(entry.kcalPer100g).toBe(120.5)
    expect(entry).not.toHaveProperty('category')
    expect(entry).not.toHaveProperty('components')
    expect(entry).not.toHaveProperty('fiberG')
  })
})
