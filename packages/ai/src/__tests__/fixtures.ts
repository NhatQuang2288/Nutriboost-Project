import type { CatalogueComponent, MealCatalogueEntry } from '../meal-estimator'

/**
 * Danh mục nhỏ dùng chung cho test gợi ý và chi tiết món.
 *
 * Cố ý có những bẫy thật: "Cà chua" chứa chữ "ca" khi bỏ dấu (trùng "cá"), một món có "lươn"
 * (là cá, nhưng không có chữ "cá"), và một nguyên liệu không có số trên 100 g.
 */

function dish(
  slug: string,
  nameVi: string,
  category: string,
  servingGrams: number,
  kcalPer100g: number,
  proteinG: number,
  carbG: number,
  fatG: number,
  components: readonly CatalogueComponent[],
  componentsEstimated = true,
): MealCatalogueEntry {
  return {
    slug,
    nameVi,
    kind: 'dish',
    category,
    servingName: 'phần',
    servingGrams,
    kcalPer100g,
    proteinG,
    carbG,
    fatG,
    components,
    componentsEstimated,
  }
}

export const INGREDIENT_BO: MealCatalogueEntry = {
  slug: 'thit-bo-nac',
  nameVi: 'Thịt bò nạc',
  kind: 'ingredient',
  kcalPer100g: 118,
  proteinG: 21,
  carbG: 0,
  fatG: 3.5,
}

export const INGREDIENT_PHO: MealCatalogueEntry = {
  slug: 'pho-tuoi',
  nameVi: 'Bánh phở tươi',
  kind: 'ingredient',
  kcalPer100g: 143,
  proteinG: 3,
  carbG: 32,
  fatG: 0.2,
}

export const FIXTURE_CATALOGUE: readonly MealCatalogueEntry[] = [
  INGREDIENT_BO,
  INGREDIENT_PHO,
  // Nhẹ, nhiều đạm: hợp giảm cân.
  dish('canh-ga', 'Canh gà rau củ', 'Món Canh & Súp', 400, 45, 6, 3, 1, [
    { name: 'Thịt gà', grams: 100 },
    { name: 'Rau củ', grams: 300 },
  ]),
  // Đậm đặc năng lượng: hợp tăng cân.
  dish('com-suon', 'Cơm tấm sườn nướng', 'Món Cơm', 300, 173, 7.5, 22, 6, [
    { name: 'Cơm', grams: 200 },
    { name: 'Sườn heo nướng', grams: 100 },
  ]),
  dish('pho-bo-chin', 'Phở bò chín', 'Món Phở', 450, 97, 4.1, 15, 2.3, [
    { name: 'Bánh phở', grams: 200, ingredientSlug: 'pho-tuoi' },
    { name: 'Thịt bò chín', grams: 60 },
    { name: 'Nước dùng xương', grams: 175 },
    { name: 'Hành, rau thơm', grams: 15 },
  ]),
  dish('bun-tom', 'Bún tôm', 'Món Bún', 400, 90, 6, 14, 1.5, [
    { name: 'Bún tươi', grams: 250 },
    { name: 'Tôm', grams: 100 },
  ]),
  // Bẫy: "cà chua" bỏ dấu thành "ca chua" — không được bị coi là có cá.
  dish('trung-ca-chua', 'Trứng xào cà chua', 'Món Rau & Xào', 200, 110, 7, 5, 7, [
    { name: 'Trứng', grams: 100 },
    { name: 'Cà chua', grams: 100 },
  ]),
  // Bẫy: lươn là cá nhưng tên và nguyên liệu không có chữ "cá".
  dish('mien-luon', 'Miến lươn', 'Món Miến & Bánh Canh', 450, 100, 6, 14, 2, [
    { name: 'Miến', grams: 250 },
    { name: 'Lươn', grams: 100 },
  ]),
  dish('xoi-dau', 'Xôi đậu xanh', 'Món Xôi', 150, 190, 5, 40, 1, [
    { name: 'Gạo nếp', grams: 100 },
    { name: 'Đậu xanh', grams: 50 },
  ]),
  // Món có gram thật (không ước tính) và nguyên liệu có số liệu riêng.
  dish(
    'pho-bo',
    'Phở bò',
    'Món Phở',
    330,
    125,
    6,
    20,
    2,
    [
      { name: 'Bánh phở tươi', grams: 250, ingredientSlug: 'pho-tuoi' },
      { name: 'Thịt bò nạc', grams: 80, ingredientSlug: 'thit-bo-nac' },
    ],
    false,
  ),
]
