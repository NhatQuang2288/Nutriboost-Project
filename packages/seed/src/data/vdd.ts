import { normalizeVi } from '@nutriboost/nutrition'

import type { FoodRecord } from '../validate'
import { VDD_ROWS, type VddRow } from './vdd.generated'

/**
 * Bảng thành phần dinh dưỡng món ăn Việt Nam (VDD) — 376 món đã lọc trùng.
 *
 * Nguồn: `packages/seed/source/vdd-tong-hop.xlsx`, sinh lại bằng `scripts/import-vdd-xlsx.py`.
 *
 * Hai loại số liệu có độ tin cậy KHÁC NHAU, và giao diện phải nói rõ điều đó:
 *   • Dinh dưỡng của cả món (kcal, đạm, béo, bột đường, xơ, natri): số bảng VDD, tính theo
 *     đúng khối lượng khẩu phần ghi ở cột "Khối lượng". Đổi sang trên 100 g bằng
 *     `giá trị × 100 / khối lượng`.
 *   • Gram từng nguyên liệu: số ƯỚC TÍNH do người soạn tệp ghi, không phải số gốc.
 *
 * Khẩu phần ở đây chỉ là khẩu phần THAM KHẢO. Khách cung cấp khối lượng thật thì tính lại
 * tuyến tính từ số trên 100 g — xem `packages/ai/src/dish-math.ts`.
 */

export const VDD_SOURCE_REF =
  'Bảng thành phần dinh dưỡng món ăn Việt Nam (VDD, 12 tập, đã lọc trùng); khối lượng khẩu phần tham khảo'

/** Nhóm trong tệp là thực phẩm thô, không phải món ăn được. */
const INGREDIENT_CATEGORIES: ReadonlySet<string> = new Set([
  'Lương thực & Ngũ cốc',
  'Trái Cây Tươi',
  'Gia Vị & Đồ Đóng Hộp',
])

/**
 * Cách gọi trong tệp VDD → nguyên liệu có số liệu trên 100 g, chỉ cho những cặp gần như đồng nghĩa.
 *
 * Cố tình ngắn: tên như "Rau", "Nước dùng", "Thịt bò" chung chung đến mức gán cho một nguyên
 * liệu cụ thể là bịa số. Thành phần không khớp vẫn hiện tên và gram, chỉ không có kcal riêng.
 */
const COMPONENT_SYNONYMS: Readonly<Record<string, string>> = {
  'Bánh phở': 'pho-tuoi',
  Bún: 'bun-tuoi',
  'Bún lá': 'bun-tuoi',
  Dầu: 'dau-an',
  'Dầu (thấm)': 'dau-an',
  Tôm: 'tom-tuoi',
  Đường: 'duong-trang',
  Cơm: 'com-trang',
  Trứng: 'trung-ga',
}

/** Địa danh ở cuối tên món: người dùng thường bỏ đi ("cao lầu" thay vì "Cao lầu Hội An"). */
const PLACE_SUFFIX =
  /\s+(?:Hà Nội|Sài Gòn|Huế|Hội An|Nha Trang|Miền Tây|Đà Nẵng|Hải Phòng|Lạng Sơn|Tam Kỳ|Quy Nhơn|Nam Định|Phan Thiết|Cần Thơ|Việt Nam)$/i

/** Cụm trong ngoặc của bảng VDD mà KHÔNG phải tên gọi khác của món (bảng ghi nhầm). */
const ALIAS_DENYLIST: ReadonlySet<string> = new Set(['Mắc ca'])

export interface DishComponentEstimate {
  /** Tên nguyên liệu như ghi trong tệp. */
  name: string
  /** Gram ƯỚC TÍNH trong một khẩu phần tham khảo. */
  grams: number
  /** Slug nguyên liệu có số liệu trên 100 g; `undefined` nếu không khớp được nguyên liệu nào. */
  ingredientSlug?: string
}

export interface VddDish {
  record: FoodRecord
  code: string
  components: readonly DishComponentEstimate[]
}

export interface VddOverride {
  /** Tên món trong bảng VDD. */
  vddName: string
  /** Món cũ bị ảnh hưởng. */
  oldSlug: string
  /**
   * `name`: trùng tên → món cũ bị THAY bằng món VDD.
   * `alias`: chỉ trùng bí danh → món cũ giữ lại nhưng mất bí danh đó, để tên đúng của món VDD
   * khớp trước ("phở bò tái" là món VDD, "phở bò" vẫn là món cũ).
   */
  mode: 'name' | 'alias'
}

/**
 * Tìm những món cũ mà bảng VDD đè lên. Bảng VDD thắng: đó là nguồn người dùng cung cấp, và để
 * món cũ thắng thì gõ "phở bò tái" vẫn ra số liệu cũ dù bảng mới có đúng món đó.
 *
 * Chỉ xét món cũ là MÓN. Trùng với một nguyên liệu thì giữ nguyên liệu và bỏ dòng VDD, vì món cũ
 * nào cũng đang tham chiếu nguyên liệu qua `dish_components`.
 */
export function planVddOverrides(
  oldDishes: readonly Pick<FoodRecord, 'slug' | 'nameVi' | 'aliases'>[],
): VddOverride[] {
  const byName = new Map(oldDishes.map((dish) => [normalizeVi(dish.nameVi), dish.slug]))
  const byAlias = new Map<string, string>()
  for (const dish of oldDishes) {
    for (const alias of dish.aliases ?? []) byAlias.set(normalizeVi(alias), dish.slug)
  }

  const overrides: VddOverride[] = []
  for (const row of VDD_ROWS) {
    const key = normalizeVi(row.name)
    const nameOwner = byName.get(key)
    if (nameOwner !== undefined) {
      overrides.push({ vddName: row.name, oldSlug: nameOwner, mode: 'name' })
      continue
    }
    const aliasOwner = byAlias.get(key)
    if (aliasOwner !== undefined) {
      overrides.push({ vddName: row.name, oldSlug: aliasOwner, mode: 'alias' })
    }
  }
  return overrides
}

export interface VddBuildResult {
  /** Bản ghi mới đưa vào danh mục (đã bỏ món trùng với danh mục cũ). */
  dishes: readonly VddDish[]
  /** Món trong tệp bị bỏ vì trùng tên với món đã có — liệt kê để người duyệt xem lại. */
  duplicates: readonly { name: string; existingSlug: string }[]
}

export function slugify(name: string): string {
  return normalizeVi(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Làm tròn 1 chữ số, đúng độ chính xác của cột `numeric(5,1)`. */
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function per100g(value: number, servingGrams: number): number {
  return round1((value * 100) / servingGrams)
}

function toRecord(row: VddRow, slug: string): FoodRecord {
  const isIngredient = INGREDIENT_CATEGORIES.has(row.category)
  const record: FoodRecord = {
    slug,
    nameVi: row.name,
    kind: isIngredient ? 'ingredient' : 'dish',
    category: row.category,
    servingName: row.servingGrams === 100 ? '100 g' : 'phần',
    servingGrams: row.servingGrams,
    kcalPer100g: per100g(row.kcal, row.servingGrams),
    proteinG: per100g(row.proteinG, row.servingGrams),
    carbG: per100g(row.carbG, row.servingGrams),
    fatG: per100g(row.fatG, row.servingGrams),
    sourceRef: `${VDD_SOURCE_REF} (${row.code})`,
  }
  // "Giò lụa (Chả lụa)" → gọi được bằng cả hai tên. Chỉ nhận cụm từ hai chữ trở lên: "Than",
  // "Na", "Thơm", "Lạc" quá ngắn và dễ kéo nhầm sang món khác.
  const paren = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(row.name)
  if (paren !== null) {
    const aliases = [paren[1], paren[2]]
      .map((alias) => alias?.trim() ?? '')
      .filter((alias) => alias.split(/\s+/).length >= 2 && !ALIAS_DENYLIST.has(alias))
    if (aliases.length > 0) record.aliases = aliases
  }
  if (row.fiberG !== null) record.fiberG = per100g(row.fiberG, row.servingGrams)
  if (row.sodiumMg !== null) record.sodiumMg = per100g(row.sodiumMg, row.servingGrams)
  return record
}

/**
 * Dựng bản ghi từ tệp VDD, bỏ món trùng với danh mục cũ.
 *
 * `existing` gồm cả tên lẫn bí danh. Món cũ được ưu tiên vì nó định nghĩa bằng gram thật
 * từng thành phần (tính ra số liệu), còn món VDD chỉ có gram ước tính.
 */
export function buildVddDishes(
  existing: readonly Pick<FoodRecord, 'slug' | 'nameVi' | 'aliases'>[],
  /** Nguyên liệu có số trên 100 g, để khớp thành phần theo tên. */
  ingredientByName: ReadonlyMap<string, string>,
): VddBuildResult {
  const takenNames = new Map<string, string>()
  const takenSlugs = new Set<string>()
  for (const item of existing) {
    takenSlugs.add(item.slug)
    takenNames.set(normalizeVi(item.nameVi), item.slug)
    for (const alias of item.aliases ?? []) takenNames.set(normalizeVi(alias), item.slug)
  }

  const built: { row: VddRow; record: FoodRecord }[] = []
  const duplicates: { name: string; existingSlug: string }[] = []

  for (const row of VDD_ROWS) {
    const nameKey = normalizeVi(row.name)
    const clash = takenNames.get(nameKey)
    if (clash !== undefined) {
      duplicates.push({ name: row.name, existingSlug: clash })
      continue
    }

    let slug = slugify(row.name)
    if (takenSlugs.has(slug)) slug = `${slug}-${row.code.slice(-3).toLowerCase()}`
    takenSlugs.add(slug)
    takenNames.set(nameKey, slug)

    built.push({ row, record: toRecord(row, slug) })
  }

  // Bí danh trong ngoặc xuất hiện ở hai món thì mơ hồ ("Nem rán" có ở "Chả giò" lẫn "Bún chả giò"):
  // bỏ khỏi cả hai thay vì để khớp ngẫu nhiên vào một trong hai.
  const parenCount = new Map<string, number>()
  for (const { record } of built) {
    for (const alias of record.aliases ?? []) {
      const key = normalizeVi(alias)
      parenCount.set(key, (parenCount.get(key) ?? 0) + 1)
    }
  }
  for (const { record } of built) {
    if (record.aliases === undefined) continue
    const unique = record.aliases.filter((alias) => parenCount.get(normalizeVi(alias)) === 1)
    if (unique.length > 0) record.aliases = unique
    else delete record.aliases
  }

  // Bí danh bỏ địa danh cuối tên, chỉ khi không trùng với bất kỳ tên hay bí danh nào khác —
  // "Bún bò Huế" → "Bún bò" bị bỏ vì còn nhiều món bún bò, còn "Cao lầu Hội An" → "Cao lầu" thì giữ.
  const placeAliases = new Map<string, string[]>()
  const aliasKeyCount = new Map<string, number>()
  for (const key of takenNames.keys()) aliasKeyCount.set(key, (aliasKeyCount.get(key) ?? 0) + 1)
  for (const { record } of built) {
    const stripped = record.nameVi.replace(PLACE_SUFFIX, '').trim()
    if (stripped === record.nameVi || stripped.split(/\s+/).length < 2) continue
    const key = normalizeVi(stripped)
    placeAliases.set(key, [...(placeAliases.get(key) ?? []), record.slug])
  }
  for (const { record } of built) {
    const stripped = record.nameVi.replace(PLACE_SUFFIX, '').trim()
    if (stripped === record.nameVi) continue
    const key = normalizeVi(stripped)
    const owners = placeAliases.get(key) ?? []
    if (owners.length === 1 && !aliasKeyCount.has(key)) {
      record.aliases = [...(record.aliases ?? []), stripped]
    }
  }

  // Nguyên liệu của chính tệp VDD cũng dùng được để khớp thành phần (gạo, khoai, trái cây…).
  const namesToSlug = new Map(ingredientByName)
  for (const [name, slug] of Object.entries(COMPONENT_SYNONYMS)) {
    if (takenSlugs.has(slug)) namesToSlug.set(normalizeVi(name), slug)
  }
  for (const { record } of built) {
    if (record.kind === 'ingredient') namesToSlug.set(normalizeVi(record.nameVi), record.slug)
  }

  const dishes: VddDish[] = built.map(({ row, record }) => ({
    record,
    code: row.code,
    components: row.components.map((component) => {
      const ingredientSlug = namesToSlug.get(normalizeVi(component.name))
      return ingredientSlug === undefined
        ? { name: component.name, grams: component.grams }
        : { name: component.name, grams: component.grams, ingredientSlug }
    }),
  }))

  return { dishes, duplicates }
}
