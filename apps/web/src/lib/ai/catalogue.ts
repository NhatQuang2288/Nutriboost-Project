import {
  type CatalogueComponent,
  type MealCatalogueEntry,
  type MealEstimator,
  createMealEstimator,
} from '@nutriboost/ai'
import { buildCatalogue } from '@nutriboost/seed'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Danh mục món mà trợ lý dùng để hiểu, gợi ý và tính dinh dưỡng.
 *
 * NGUỒN CHÍNH LÀ BẢNG `foods` TRONG SUPABASE (nạp từ bảng VDD bằng `supabase/seed.sql`). Trước đây
 * route chat chốt cứng danh mục từ mã (`buildCatalogue()`), nên sửa dữ liệu trong CSDL không có
 * tác dụng với AI. Danh mục trong mã giờ chỉ là phương án dự phòng, và có hai trường hợp phải dùng:
 *
 *   • Chưa cấu hình Supabase / chưa có phiên / lỗi mạng: chế độ dữ liệu mẫu và bộ kiểm thử
 *     đầu-cuối vẫn phải chạy (xem CLAUDE.md, "Hai chế độ dữ liệu").
 *   • CSDL CHƯA được nạp lại seed mới (ít thực phẩm hơn danh mục trong mã): dùng CSDL lúc này là
 *     lặng lẽ lùi về dữ liệu cũ. Thà dùng danh mục trong mã và báo lý do.
 *
 * Danh mục được giữ trong bộ nhớ vài phút: nó là dữ liệu dùng chung, vài trăm dòng, và mỗi lượt
 * chat không nên tốn thêm hai truy vấn.
 */

export interface CatalogueSource {
  catalogue: readonly MealCatalogueEntry[]
  estimator: MealEstimator
  /** `supabase`: đọc từ CSDL. `seed`: danh mục trong mã (kèm lý do ở `reason`). */
  source: 'supabase' | 'seed'
  reason: string | null
}

export const CATALOGUE_TTL_MS = 5 * 60 * 1000

/** PostgREST mặc định chỉ trả tối đa 1.000 dòng mỗi lần, nên đọc theo trang. */
const PAGE_SIZE = 1000
const MAX_PAGES = 20

const FOOD_COLUMNS =
  'id, slug, name_vi, kind, category, serving_name, serving_grams, kcal_per_100g, protein_g, carb_g, fat_g, fiber_g, sugar_g, sodium_mg, components, components_estimated'

interface FoodRow {
  id: string
  slug: string
  name_vi: string
  kind: 'ingredient' | 'dish'
  category: string | null
  serving_name: string | null
  serving_grams: number | string | null
  kcal_per_100g: number | string
  protein_g: number | string
  carb_g: number | string
  fat_g: number | string
  fiber_g: number | string | null
  sugar_g: number | string | null
  sodium_mg: number | string | null
  components: unknown
  components_estimated: boolean | null
}

interface AliasRow {
  food_id: string
  alias: string
}

let seedSource: CatalogueSource | null = null
let cached: { at: number; value: CatalogueSource } | null = null

/** Danh mục trong mã, dựng một lần. */
export function seedCatalogue(reason: string | null): CatalogueSource {
  if (seedSource === null) {
    const catalogue = buildCatalogue()
    seedSource = {
      catalogue,
      estimator: createMealEstimator(catalogue),
      source: 'seed',
      reason: null,
    }
  }
  return { ...seedSource, reason }
}

/** Chỉ nhận mảng thành phần đúng khuôn; sai khuôn thì bỏ, không để dữ liệu lạ lọt tới giao diện. */
export function parseComponents(value: unknown): CatalogueComponent[] | undefined {
  if (!Array.isArray(value)) return undefined

  const parsed: CatalogueComponent[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return undefined
    const { name, grams, ingredientSlug } = item as Record<string, unknown>
    if (typeof name !== 'string' || name.length === 0) return undefined
    if (typeof grams !== 'number' || !Number.isFinite(grams) || grams < 0) return undefined
    parsed.push({
      name,
      grams,
      ...(typeof ingredientSlug === 'string' && ingredientSlug.length > 0
        ? { ingredientSlug }
        : {}),
    })
  }
  return parsed
}

function num(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function rowToEntry(row: FoodRow, aliases: readonly string[]): MealCatalogueEntry {
  const components = parseComponents(row.components)
  const servingGrams = num(row.serving_grams)
  const fiberG = num(row.fiber_g)
  const sugarG = num(row.sugar_g)
  const sodiumMg = num(row.sodium_mg)

  return {
    slug: row.slug,
    nameVi: row.name_vi,
    kind: row.kind,
    ...(row.category === null ? {} : { category: row.category }),
    ...(row.serving_name === null ? {} : { servingName: row.serving_name }),
    ...(servingGrams === undefined ? {} : { servingGrams }),
    ...(aliases.length === 0 ? {} : { aliases }),
    ...(components === undefined || components.length === 0
      ? {}
      : { components, componentsEstimated: row.components_estimated === true }),
    kcalPer100g: num(row.kcal_per_100g) ?? 0,
    proteinG: num(row.protein_g) ?? 0,
    carbG: num(row.carb_g) ?? 0,
    fatG: num(row.fat_g) ?? 0,
    ...(fiberG === undefined ? {} : { fiberG }),
    ...(sugarG === undefined ? {} : { sugarG }),
    ...(sodiumMg === undefined ? {} : { sodiumMg }),
  }
}

async function readAll<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await fetchPage(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (error !== null) throw new Error(error.message)
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return rows
}

async function readFromSupabase(client: SupabaseClient): Promise<MealCatalogueEntry[]> {
  const foods = await readAll<FoodRow>((from, to) =>
    client.from('foods').select(FOOD_COLUMNS).order('slug').range(from, to),
  )
  const aliasRows = await readAll<AliasRow>((from, to) =>
    client.from('food_aliases').select('food_id, alias').order('id').range(from, to),
  )

  const aliasesByFood = new Map<string, string[]>()
  for (const row of aliasRows) {
    aliasesByFood.set(row.food_id, [...(aliasesByFood.get(row.food_id) ?? []), row.alias])
  }

  return foods.map((row) => rowToEntry(row, aliasesByFood.get(row.id) ?? []))
}

/** Xoá bộ nhớ đệm — dùng trong test. */
export function resetCatalogueCache(): void {
  cached = null
  seedSource = null
}

export async function loadCatalogue(
  client: SupabaseClient | null,
  now: number = Date.now(),
): Promise<CatalogueSource> {
  if (client === null) return seedCatalogue('Chưa cấu hình Supabase hoặc chưa có phiên.')

  if (cached !== null && now - cached.at < CATALOGUE_TTL_MS) return cached.value

  try {
    const entries = await readFromSupabase(client)
    const expected = seedCatalogue(null).catalogue.length

    // CSDL ít hơn danh mục trong mã nghĩa là seed mới chưa được nạp: dùng nó là quay về dữ liệu cũ.
    if (entries.length < expected) {
      const reason =
        `Supabase có ${entries.length} thực phẩm nhưng danh mục hiện hành có ${expected}. ` +
        'Chạy `npm run db:reset` để nạp seed mới; trong lúc đó trợ lý dùng danh mục trong mã.'
      console.warn(`[ai/catalogue] ${reason}`)
      const value = seedCatalogue(reason)
      cached = { at: now, value }
      return value
    }

    const value: CatalogueSource = {
      catalogue: entries,
      estimator: createMealEstimator(entries),
      source: 'supabase',
      reason: null,
    }
    cached = { at: now, value }
    return value
  } catch (error) {
    const reason = `Không đọc được danh mục từ Supabase: ${error instanceof Error ? error.message : String(error)}`
    console.warn(`[ai/catalogue] ${reason}`)
    // Không lưu đệm lỗi: lần sau thử lại thay vì kẹt ở dữ liệu dự phòng suốt vài phút.
    return seedCatalogue(reason)
  }
}
