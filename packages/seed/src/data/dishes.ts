import {
  type DishRecord,
  type FoodComponent,
  type FoodRecord,
  computeDishPer100g,
} from '../validate'

/**
 * Món ăn Việt — định nghĩa bằng **thành phần × gram**.
 *
 * Quyết định thiết kế quan trọng: chỉ số trên 100 g của món **không được nhập tay**.
 * Nó được tính ra từ thành phần (hàm `computeDishPer100g`), và CSDL tính lại lần nữa
 * bằng `recompute_dish_nutrients`. Hai bên phải khớp — đó là cách phát hiện dữ liệu sai.
 *
 * Lợi ích: sửa số liệu của một nguyên liệu sẽ tự động cập nhật mọi món dùng nguyên liệu đó.
 *
 * Cũng như bảng nguyên liệu, khối lượng ở đây là **khẩu phần tham chiếu để phát triển**,
 * TV3 cần rà lại và đặt `serving_grams` theo khẩu phần thực tế trước khi phát hành.
 */

export interface DishDefinition extends DishRecord {
  nameVi: string
  category: string
  servingName: string
  aliases?: readonly string[]
}

const c = (ingredientSlug: string, grams: number): FoodComponent => ({ ingredientSlug, grams })

export const DISHES: readonly DishDefinition[] = [
  {
    dishSlug: 'pho-bo',
    nameVi: 'Phở bò',
    category: 'Món nước',
    servingName: 'tô',
    aliases: ['pho', 'phở', 'pho bo tai'],
    components: [
      c('pho-tuoi', 250),
      c('thit-bo-nac', 80),
      c('hanh-la', 15),
      c('nuoc-mam', 5),
      c('dau-an', 3),
    ],
  },
  {
    dishSlug: 'pho-ga',
    nameVi: 'Phở gà',
    category: 'Món nước',
    servingName: 'tô',
    aliases: ['pho ga'],
    components: [c('pho-tuoi', 250), c('thit-ga-ta', 90), c('hanh-la', 15), c('nuoc-mam', 5)],
  },
  {
    dishSlug: 'bun-bo-hue',
    nameVi: 'Bún bò Huế',
    category: 'Món nước',
    servingName: 'tô',
    aliases: ['bun bo', 'bún bò'],
    components: [
      c('pho-tuoi', 220),
      c('thit-bo-nac', 90),
      c('hanh-la', 10),
      c('nuoc-mam', 8),
      c('dau-an', 4),
    ],
  },
  {
    dishSlug: 'com-tam-suon',
    nameVi: 'Cơm tấm sườn',
    category: 'Cơm',
    servingName: 'phần',
    aliases: ['com tam', 'cơm tấm'],
    components: [
      c('com-trang', 250),
      c('thit-heo-nac', 120),
      c('dua-leo', 30),
      c('dau-an', 5),
      c('nuoc-mam', 8),
    ],
  },
  {
    dishSlug: 'com-ga',
    nameVi: 'Cơm gà',
    category: 'Cơm',
    servingName: 'phần',
    aliases: ['com ga'],
    components: [c('com-trang', 250), c('thit-ga-ta', 120), c('dau-an', 4), c('nuoc-mam', 6)],
  },
  {
    dishSlug: 'com-trung',
    nameVi: 'Cơm trứng',
    category: 'Cơm',
    servingName: 'phần',
    aliases: ['com trung', 'cơm rang trứng'],
    components: [c('com-trang', 200), c('trung-ga', 60), c('dau-an', 5), c('nuoc-mam', 4)],
  },
  {
    dishSlug: 'banh-mi-thit',
    nameVi: 'Bánh mì thịt',
    category: 'Món khô',
    servingName: 'ổ',
    aliases: ['banh mi', 'bánh mì'],
    components: [c('banh-mi', 100), c('thit-heo-nac', 60), c('dua-leo', 25), c('dau-an', 3)],
  },
  {
    dishSlug: 'goi-cuon',
    nameVi: 'Gỏi cuốn',
    category: 'Món khô',
    servingName: 'cuốn',
    aliases: ['goi cuon', 'gỏi cuốn', 'summer roll'],
    components: [c('pho-tuoi', 60), c('tom-tuoi', 40), c('rau-muong', 40), c('thit-heo-nac', 30)],
  },
  {
    dishSlug: 'canh-rau-muong',
    nameVi: 'Canh rau muống',
    category: 'Canh',
    servingName: 'bát',
    aliases: ['canh rau muong', 'canh rau'],
    components: [c('rau-muong', 150), c('tom-tuoi', 30), c('nuoc-mam', 5), c('dau-an', 2)],
  },
  {
    dishSlug: 'rau-muong-xao-toi',
    nameVi: 'Rau muống xào tỏi',
    category: 'Món xào',
    servingName: 'đĩa',
    aliases: ['rau muong xao toi', 'rau xao toi'],
    components: [c('rau-muong', 150), c('toi', 6), c('dau-an', 8)],
  },
  {
    dishSlug: 'dau-hu-chien',
    nameVi: 'Đậu hũ chiên',
    category: 'Món chiên',
    servingName: 'phần',
    aliases: ['dau hu chien', 'đậu phụ rán'],
    components: [c('dau-hu', 150), c('dau-an', 10)],
  },
  {
    dishSlug: 'trung-chien',
    nameVi: 'Trứng chiên',
    category: 'Món chiên',
    servingName: 'phần',
    aliases: ['trung chien', 'trứng rán'],
    components: [c('trung-ga', 100), c('dau-an', 8)],
  },
  {
    dishSlug: 'ca-thu-chien',
    nameVi: 'Cá thu chiên',
    category: 'Món chiên',
    servingName: 'phần',
    aliases: ['ca thu chien'],
    components: [c('ca-thu', 120), c('dau-an', 10)],
  },
  {
    dishSlug: 'khoai-tay-chien',
    nameVi: 'Khoai tây chiên',
    category: 'Món chiên',
    servingName: 'phần',
    aliases: ['khoai tay chien', 'french fries'],
    components: [c('khoai-tay', 150), c('dau-an', 15)],
  },
  {
    dishSlug: 'khoai-lang-luoc',
    nameVi: 'Khoai lang luộc',
    category: 'Món luộc',
    servingName: 'củ',
    aliases: ['khoai lang luoc'],
    components: [c('khoai-lang', 150)],
  },
  {
    dishSlug: 'sua-chua-chuoi',
    nameVi: 'Sữa chua chuối',
    category: 'Bữa phụ',
    servingName: 'hộp',
    aliases: ['sua chua chuoi', 'yogurt chuối'],
    components: [c('sua-chua-khong-duong', 100), c('chuoi-tieu', 60)],
  },
  {
    dishSlug: 'ca-phe-sua-da',
    nameVi: 'Cà phê sữa đá',
    category: 'Đồ uống',
    servingName: 'ly',
    aliases: ['ca phe sua da', 'cà phê sữa'],
    components: [c('ca-phe-den', 150), c('sua-dac', 25)],
  },
  {
    dishSlug: 'sinh-to-chuoi-sua',
    nameVi: 'Sinh tố chuối sữa',
    category: 'Đồ uống',
    servingName: 'ly',
    aliases: ['sinh to chuoi', 'sinh tố chuối'],
    components: [c('chuoi-tieu', 120), c('sua-tuoi-khong-duong', 150)],
  },
]

/**
 * Ghép định nghĩa món với chỉ số tính ra từ thành phần, cho ra bản ghi `foods` hoàn chỉnh.
 * Trả về `null` nếu thiếu nguyên liệu — khi đó `validateDishes` đã báo lỗi.
 */
export function toDishFoodRecord(
  dish: DishDefinition,
  ingredients: ReadonlyMap<string, FoodRecord>,
): FoodRecord | null {
  const nutrients = computeDishPer100g(dish, ingredients)
  if (nutrients === null) return null

  return {
    slug: dish.dishSlug,
    nameVi: dish.nameVi,
    kind: 'dish',
    category: dish.category,
    servingName: dish.servingName,
    servingGrams: nutrients.servingGrams,
    kcalPer100g: nutrients.kcalPer100g,
    proteinG: nutrients.proteinG,
    carbG: nutrients.carbG,
    fatG: nutrients.fatG,
    fiberG: nutrients.fiberG,
    sodiumMg: nutrients.sodiumMg,
    sourceRef: 'Tính từ thành phần — xem packages/seed/src/data/ingredients.ts',
    ...(dish.aliases === undefined ? {} : { aliases: dish.aliases }),
  }
}
