import {
  type ScaledNutrients,
  normalizeVi,
  scaleNutrients,
  sumNutrients,
} from '@nutriboost/nutrition'

import type { CatalogueComponent, MealCatalogueEntry } from './meal-estimator'

/**
 * Chi tiết một món theo khối lượng — TẤT ĐỊNH, không gọi AI.
 *
 * Khẩu phần trong danh mục chỉ là khẩu phần THAM KHẢO. Khách có thể:
 *   • nói khối lượng cả món ("mình ăn 300 g") → mọi thứ co giãn tuyến tính theo gram;
 *   • nói gram một nguyên liệu ("thịt bò 120 g") → chỉ tính được khi nguyên liệu đó có số
 *     liệu trên 100 g; nếu không thì TỪ CHỐI và nói rõ, không đoán.
 *
 * Quy tắc cốt lõi khi chỉnh một nguyên liệu: tổng của món = tổng tham khảo + phần chênh lệch
 * của đúng nguyên liệu đó (chênh gram × số trên 100 g). Nhờ vậy số gốc của bảng VDD cho cả
 * món không bị tính lại từ gram ước tính, mà chỉ lệch đúng chỗ khách đổi.
 */

export interface DishDetailItem {
  name: string
  grams: number
  /** `null` khi nguyên liệu này không có số liệu trên 100 g để tính. */
  nutrients: ScaledNutrients | null
  /** Gram này do khách chỉnh, không phải gram tham khảo. */
  adjusted: boolean
}

export interface DishDetail {
  slug: string
  nameVi: string
  servingName: string | null
  /** Khối lượng cả món sau khi chỉnh. */
  grams: number
  /** Khối lượng khẩu phần tham khảo trong danh mục. */
  referenceGrams: number
  items: DishDetailItem[]
  total: ScaledNutrients
  /** Gram từng nguyên liệu là số ước tính. */
  estimated: boolean
  /** Khách đã cung cấp khối lượng, không còn là số tham khảo thuần. */
  customised: boolean
}

export type DishDetailResult = { ok: true; detail: DishDetail } | { ok: false; reason: string }

export interface DishDetailRequest {
  /** Khối lượng cả món (g). Bỏ trống = khẩu phần tham khảo. */
  grams?: number
  /** Gram từng nguyên liệu khách cung cấp, khoá theo tên nguyên liệu. */
  componentGrams?: Readonly<Record<string, number>>
}

const normalizeName = normalizeVi

function perHundred(entry: MealCatalogueEntry) {
  return {
    kcal: entry.kcalPer100g,
    proteinG: entry.proteinG,
    carbG: entry.carbG,
    fatG: entry.fatG,
    fiberG: entry.fiberG ?? 0,
    sugarG: entry.sugarG ?? 0,
    sodiumMg: entry.sodiumMg ?? 0,
  }
}

function roundGrams(value: number): number {
  return Math.round(value * 10) / 10
}

/** Cộng một lượng chênh (có thể âm) vào tổng, không để số nào xuống dưới 0. */
function addDelta(total: ScaledNutrients, delta: ScaledNutrients): ScaledNutrients {
  const add = (a: number, b: number): number => Math.max(0, a + b)
  return {
    kcal: add(total.kcal, delta.kcal),
    proteinG: Math.round(add(total.proteinG, delta.proteinG) * 10) / 10,
    carbG: Math.round(add(total.carbG, delta.carbG) * 10) / 10,
    fatG: Math.round(add(total.fatG, delta.fatG) * 10) / 10,
    fiberG: Math.round(add(total.fiberG, delta.fiberG) * 10) / 10,
    sugarG: Math.round(add(total.sugarG, delta.sugarG) * 10) / 10,
    sodiumMg: add(total.sodiumMg, delta.sodiumMg),
  }
}

/** `scaleNutrients` chỉ nhận gram không âm; chênh lệch âm tính bằng dấu rồi nhân lại. */
function signedScale(entry: MealCatalogueEntry, gramsDelta: number): ScaledNutrients {
  const magnitude = scaleNutrients(perHundred(entry), Math.abs(gramsDelta))
  if (gramsDelta >= 0) return magnitude
  return {
    kcal: -magnitude.kcal,
    proteinG: -magnitude.proteinG,
    carbG: -magnitude.carbG,
    fatG: -magnitude.fatG,
    fiberG: -magnitude.fiberG,
    sugarG: -magnitude.sugarG,
    sodiumMg: -magnitude.sodiumMg,
  }
}

export function findComponent(
  components: readonly CatalogueComponent[],
  name: string,
): CatalogueComponent | undefined {
  const key = normalizeName(name)
  const exact = components.find((component) => normalizeName(component.name) === key)
  if (exact !== undefined) return exact
  // Khách thường nói tên ngắn ("thịt bò") cho "Thịt bò chín": chỉ nhận khi chỉ có MỘT ứng viên.
  const partial = components.filter((component) => {
    const candidate = normalizeName(component.name)
    return candidate.includes(key) || key.includes(candidate)
  })
  return partial.length === 1 ? partial[0] : undefined
}

export function buildDishDetail(
  entry: MealCatalogueEntry,
  catalogue: readonly MealCatalogueEntry[],
  request: DishDetailRequest = {},
): DishDetailResult {
  const referenceGrams = entry.servingGrams ?? 100
  const components = entry.components ?? []
  const bySlug = new Map(catalogue.map((item) => [item.slug, item]))

  if (request.grams !== undefined && (!Number.isFinite(request.grams) || request.grams <= 0)) {
    return { ok: false, reason: 'Khối lượng phải là số lớn hơn 0.' }
  }

  const overrides = Object.entries(request.componentGrams ?? {})
  for (const [, grams] of overrides) {
    if (!Number.isFinite(grams) || grams < 0) {
      return { ok: false, reason: 'Khối lượng nguyên liệu phải là số không âm.' }
    }
  }

  // Chỉnh từng nguyên liệu và chỉnh cả món là hai cách khác nhau; trộn lẫn sẽ mơ hồ.
  if (overrides.length > 0 && request.grams !== undefined) {
    return {
      ok: false,
      reason: 'Chỉ chỉnh khối lượng cả món HOẶC từng nguyên liệu, không chỉnh cùng lúc cả hai.',
    }
  }

  /* --- Chỉnh từng nguyên liệu ------------------------------------------- */
  if (overrides.length > 0) {
    if (components.length === 0) {
      return {
        ok: false,
        reason: `Món "${entry.nameVi}" chưa có danh sách nguyên liệu để chỉnh từng phần. Bạn cho biết khối lượng cả món nhé.`,
      }
    }

    const resolved = new Map<CatalogueComponent, number>()
    for (const [name, grams] of overrides) {
      const component = findComponent(components, name)
      if (component === undefined) {
        return {
          ok: false,
          reason: `Món "${entry.nameVi}" không có nguyên liệu "${name}" trong danh sách. Có: ${components
            .map((item) => item.name)
            .join(', ')}.`,
        }
      }
      const ingredient =
        component.ingredientSlug === undefined ? undefined : bySlug.get(component.ingredientSlug)
      if (ingredient === undefined) {
        return {
          ok: false,
          reason: `Chưa có số dinh dưỡng riêng cho "${component.name}" nên chưa tính được khi bạn đổi lượng nguyên liệu này. Bạn cho biết khối lượng cả món để mình tính theo tỉ lệ nhé.`,
        }
      }
      resolved.set(component, grams)
    }

    let total = scaleNutrients(perHundred(entry), referenceGrams)
    let grams = referenceGrams
    for (const [component, newGrams] of resolved) {
      const ingredient = bySlug.get(component.ingredientSlug ?? '')
      if (ingredient === undefined) continue
      total = addDelta(total, signedScale(ingredient, newGrams - component.grams))
      grams += newGrams - component.grams
    }

    const items: DishDetailItem[] = components.map((component) => {
      const newGrams = resolved.get(component)
      const effective = newGrams ?? component.grams
      const ingredient =
        component.ingredientSlug === undefined ? undefined : bySlug.get(component.ingredientSlug)
      return {
        name: component.name,
        grams: roundGrams(effective),
        nutrients:
          ingredient === undefined ? null : scaleNutrients(perHundred(ingredient), effective),
        adjusted: newGrams !== undefined,
      }
    })

    return {
      ok: true,
      detail: {
        slug: entry.slug,
        nameVi: entry.nameVi,
        servingName: entry.servingName ?? null,
        grams: roundGrams(grams),
        referenceGrams,
        items,
        total,
        estimated: entry.componentsEstimated ?? false,
        customised: true,
      },
    }
  }

  /* --- Cả món theo một khối lượng (hoặc khẩu phần tham khảo) ------------ */
  const grams = request.grams ?? referenceGrams
  const factor = grams / referenceGrams
  const items: DishDetailItem[] = components.map((component) => {
    const scaledGrams = component.grams * factor
    const ingredient =
      component.ingredientSlug === undefined ? undefined : bySlug.get(component.ingredientSlug)
    return {
      name: component.name,
      grams: roundGrams(scaledGrams),
      nutrients:
        ingredient === undefined ? null : scaleNutrients(perHundred(ingredient), scaledGrams),
      adjusted: false,
    }
  })

  return {
    ok: true,
    detail: {
      slug: entry.slug,
      nameVi: entry.nameVi,
      servingName: entry.servingName ?? null,
      grams: roundGrams(grams),
      referenceGrams,
      items,
      // Tổng của cả món lấy từ số gốc trên 100 g, không cộng từ gram ước tính từng thành phần.
      total: scaleNutrients(perHundred(entry), grams),
      estimated: entry.componentsEstimated ?? false,
      customised: request.grams !== undefined,
    },
  }
}

/** Tổng các thành phần CÓ số liệu riêng — để đối chiếu với tổng cả món. */
export function sumKnownItems(items: readonly DishDetailItem[]): ScaledNutrients {
  return sumNutrients(items.flatMap((item) => (item.nutrients === null ? [] : [item.nutrients])))
}

/** Props của thẻ `dish_detail_card`, dùng chung cho tool và đường dự phòng. */
export function toDishDetailCard(detail: DishDetail) {
  return {
    foodId: detail.slug,
    nameVi: detail.nameVi,
    servingName: detail.servingName,
    grams: detail.grams,
    referenceGrams: detail.referenceGrams,
    items: detail.items.map((item) => ({
      name: item.name,
      grams: item.grams,
      kcal: item.nutrients === null ? null : item.nutrients.kcal,
      proteinG: item.nutrients === null ? null : item.nutrients.proteinG,
      adjusted: item.adjusted,
    })),
    total: {
      kcal: detail.total.kcal,
      proteinG: detail.total.proteinG,
      carbG: detail.total.carbG,
      fatG: detail.total.fatG,
      fiberG: detail.total.fiberG,
      sodiumMg: detail.total.sodiumMg,
    },
    estimated: detail.estimated,
    customised: detail.customised,
  }
}

/* ------------------------------------------------------------------------- */
/* Đọc gram từng nguyên liệu từ câu khách nói                                   */
/* ------------------------------------------------------------------------- */

const GRAM_UNIT = /(\d+(?:[.,]\d+)?)\s*(kg|gram|gam|gr|g)\b/gi

/** Từ nối giữa tên nguyên liệu và con số: "bún là 250g", "thịt bò bằng 120 g", "tăng bún lên 250g". */
const LINKER_WORDS = new Set([
  'la',
  'bang',
  'voi',
  'co',
  'chi',
  'len',
  'xuong',
  'tang',
  'giam',
  'doi',
  'chinh',
  'sua',
  'thanh',
  'nang',
  'lay',
  'dung',
  'an',
  'cho',
  'minh',
  'toi',
  'khoang',
  'tam',
  'hon',
])

const MAX_PHRASE_WORDS = 3
const MARKER = '|'

/**
 * Đọc "bún 250g", "250 g thịt bò", "thịt bò là 120g" thành gram từng nguyên liệu của món.
 *
 * Trả về khoá là TÊN NGUYÊN LIỆU TRONG MÓN (không phải chữ khách gõ), để đưa thẳng vào
 * `buildDishDetail`. Chỉ nhận cụm từ khớp một nguyên liệu của chính món này; con số không dính
 * nguyên liệu nào ("phở bò chín 300g") bị bỏ qua — đó là khối lượng cả món.
 *
 * Tên món phải được cắt khỏi câu trước: "bún thang 300g" mà không cắt thì cụm "bún thang" chứa
 * chữ "bún" và bị nhận nhầm là nguyên liệu "Bún".
 */
export function parseComponentGrams(
  text: string,
  components: readonly CatalogueComponent[],
  dishName: string,
): Record<string, number> {
  if (components.length === 0) return {}

  const words = text
    .toLowerCase()
    .replace(
      GRAM_UNIT,
      // Đổi dấu phẩy thập phân thành dấu chấm trước khi tách từ, không thì "0,3kg" bị cắt làm đôi.
      (_match, amount: string, unit: string) =>
        ` ${amount.replace(',', '.')}${unit === 'kg' ? 'kg' : 'g'} `,
    )
    .split(/[\s,;:=()]+/)
    .filter((word) => word.length > 0)

  // Cắt tên món khỏi câu, thay bằng dấu ngăn để cụm từ không vắt qua chỗ đó.
  const dishWords = normalizeName(dishName).split(' ')
  const folded = words.map((word) => (/^\d/.test(word) ? word : normalizeName(word)))
  for (let start = 0; start + dishWords.length <= folded.length; start += 1) {
    if (dishWords.every((word, offset) => folded[start + offset] === word)) {
      for (let offset = 0; offset < dishWords.length; offset += 1) folded[start + offset] = MARKER
      start += dishWords.length - 1
    }
  }

  const isNumber = (word: string): boolean => /^\d+(?:[.,]\d+)?(?:kg|g)$/.test(word)
  const isLinker = (word: string): boolean => LINKER_WORDS.has(word)
  const usable = (word: string | undefined): word is string =>
    word !== undefined && word !== MARKER && !isNumber(word) && !isLinker(word)

  const result: Record<string, number> = {}

  folded.forEach((word, index) => {
    const parsed = /^(\d+(?:[.,]\d+)?)(kg|g)$/.exec(word)
    if (parsed === null) return
    const amount = Number((parsed[1] ?? '0').replace(',', '.')) * (parsed[2] === 'kg' ? 1000 : 1)
    if (!Number.isFinite(amount) || amount < 0) return

    // Từ ngay TRƯỚC con số (bỏ từ nối): "bún 250g", "bún là 250g".
    let end = index - 1
    while (end >= 0 && isLinker(folded[end] ?? '')) end -= 1
    for (let size = MAX_PHRASE_WORDS; size >= 1; size -= 1) {
      const slice = folded.slice(end - size + 1, end + 1)
      if (end - size + 1 < 0 || !slice.every(usable)) continue
      const found = findComponent(components, slice.join(' '))
      if (found !== undefined) {
        result[found.name] = amount
        return
      }
    }

    // Từ ngay SAU con số: "250g bún".
    let begin = index + 1
    while (begin < folded.length && isLinker(folded[begin] ?? '')) begin += 1
    for (let size = MAX_PHRASE_WORDS; size >= 1; size -= 1) {
      const slice = folded.slice(begin, begin + size)
      if (slice.length < size || !slice.every(usable)) continue
      const found = findComponent(components, slice.join(' '))
      if (found !== undefined) {
        result[found.name] = amount
        return
      }
    }
  })

  return result
}
