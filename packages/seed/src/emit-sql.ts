import type { BuiltDataset } from './index'

/**
 * Sinh `supabase/seed.sql` từ bộ dữ liệu TypeScript.
 *
 * Vì sao sinh thay vì viết tay: bộ dữ liệu là **nguồn chân lý duy nhất**. Nếu viết
 * SQL bằng tay, hai bản sẽ lệch nhau ngay lần sửa đầu tiên.
 *
 * File sinh ra KHÔNG được sửa tay — sửa ở `packages/seed/src/data/`.
 */

const HEADER = `-- ============================================================================
-- NutriBoost — dữ liệu món Việt
--
-- FILE NÀY ĐƯỢC SINH TỰ ĐỘNG. ĐỪNG SỬA TAY.
-- Nguồn: packages/seed/src/data/ingredients.ts và packages/seed/src/data/dishes.ts
-- Sinh lại: npm run seed -- --emit-sql
--
-- Chỉ số của món được tính từ thành phần bằng recompute_dish_nutrients() ở cuối file,
-- nên sửa một nguyên liệu sẽ tự động cập nhật mọi món dùng nguyên liệu đó.
-- ============================================================================
`

/** Thoát chuỗi cho PostgreSQL. */
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlNullableString(value: string | undefined): string {
  return value === undefined ? 'null' : sqlString(value)
}

function sqlNullableNumber(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'null' : String(value)
}

function sqlNumber(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? '0' : String(value)
}

export function emitFoodsSql(dataset: BuiltDataset): string {
  const columns = [
    'slug',
    'name_vi',
    'kind',
    'category',
    'serving_name',
    'serving_grams',
    'kcal_per_100g',
    'protein_g',
    'carb_g',
    'fat_g',
    'fiber_g',
    'sugar_g',
    'sodium_mg',
    'source_ref',
  ]

  const values = dataset.all.map((food) =>
    [
      sqlString(food.slug),
      sqlString(food.nameVi),
      sqlString(food.kind),
      sqlString(food.category),
      sqlNullableString(food.servingName),
      sqlNullableNumber(food.servingGrams),
      sqlNumber(food.kcalPer100g),
      sqlNumber(food.proteinG),
      sqlNumber(food.carbG),
      sqlNumber(food.fatG),
      sqlNumber(food.fiberG),
      sqlNumber(food.sugarG),
      sqlNumber(food.sodiumMg),
      sqlString(food.sourceRef),
    ].join(', '),
  )

  const updates = columns
    .filter((column) => column !== 'slug')
    .map((column) => `    ${column} = excluded.${column}`)
    .join(',\n')

  return [
    `insert into public.foods (${columns.join(', ')})`,
    'values',
    values.map((row) => `  (${row})`).join(',\n'),
    'on conflict (slug) do update set',
    updates,
    ';',
  ].join('\n')
}

/**
 * Bí danh phải ghép theo slug, nên dùng bảng tạm `with ... values` thay vì `values` trần.
 */
export function emitAliasesSqlCorrect(dataset: BuiltDataset): string {
  const pairs: string[] = []

  for (const food of dataset.all) {
    for (const alias of food.aliases ?? []) {
      pairs.push(`  (${sqlString(food.slug)}, ${sqlString(alias)})`)
    }
  }

  if (pairs.length === 0) return '-- (không có bí danh nào)'

  return [
    'with alias_seed (slug, alias) as (',
    '  values',
    pairs.join(',\n'),
    ')',
    'insert into public.food_aliases (food_id, alias)',
    'select f.id, s.alias',
    'from alias_seed s',
    'join public.foods f on f.slug = s.slug',
    'on conflict (food_id, alias) do nothing;',
  ].join('\n')
}

export function emitDishComponentsSql(dataset: BuiltDataset): string {
  const triples: string[] = []

  for (const dish of dataset.components) {
    for (const component of dish.components) {
      triples.push(
        `  (${sqlString(dish.dishSlug)}, ${sqlString(component.ingredientSlug)}, ${component.grams})`,
      )
    }
  }

  if (triples.length === 0) return '-- (không có thành phần nào)'

  return [
    'with component_seed (dish_slug, ingredient_slug, grams) as (',
    '  values',
    triples.join(',\n'),
    ')',
    'insert into public.dish_components (dish_id, ingredient_id, grams)',
    'select d.id, i.id, s.grams',
    'from component_seed s',
    'join public.foods d on d.slug = s.dish_slug',
    'join public.foods i on i.slug = s.ingredient_slug',
    'on conflict (dish_id, ingredient_id) do update set grams = excluded.grams;',
  ].join('\n')
}

export function emitSeedSql(dataset: BuiltDataset): string {
  return [
    HEADER,
    '-- 1. Thực phẩm: nguyên liệu và món',
    emitFoodsSql(dataset),
    '',
    '-- 2. Bí danh tên món (biến thể địa phương, cách gọi khác)',
    emitAliasesSqlCorrect(dataset),
    '',
    '-- 3. Thành phần của món',
    emitDishComponentsSql(dataset),
    '',
    '-- 4. Tính lại chỉ số của món từ thành phần vừa nạp.',
    '--    Bước này khiến CSDL trở thành nguồn chân lý: dù file trên có sai sót,',
    '--    con số cuối cùng vẫn nhất quán với thành phần.',
    "select public.recompute_dish_nutrients(id) from public.foods where kind = 'dish';",
    '',
  ].join('\n')
}
