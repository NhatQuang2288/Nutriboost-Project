#!/usr/bin/env node
/**
 * Nạp **một tuần dữ liệu mẫu** cho một khách hàng thật — dùng cho máy phát triển.
 *
 * Vì sao cần: `/tien-do` chỉ vẽ được khi có ít nhất hai điểm dữ liệu, còn console PT cần
 * khách có nhật ký mới đánh giá được. Ngồi ghi tay 7 ngày × 4 bữa để thử giao diện là việc
 * không ai làm, nên biểu đồ thường xuyên bị kiểm thử trong trạng thái rỗng.
 *
 *   npm run make:week -- khach@example.com
 *   npm run make:week -- khach@example.com --emit-sql
 *
 * Dữ liệu lấy từ `apps/web/src/lib/data/demo-week.ts` — **cùng nguồn** với chế độ dữ liệu mẫu
 * của giao diện. Nhờ vậy số liệu ở chế độ mẫu và số liệu nạp vào CSDL không thể lệch nhau:
 * sửa tuần mẫu một chỗ là cả hai đường cùng đổi.
 *
 * Đây KHÔNG phải tính năng sản phẩm: nó ghi thẳng bằng khoá service role, bỏ qua RLS.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  DEMO_WEEK_DAYS,
  DEMO_WEEK_PROFILE,
  buildDemoWeekDays,
  demoEnergyTargets,
} from '../apps/web/src/lib/data/demo-week.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Nơi ở của tệp SQL mẫu. `scripts/check-sample-week.mjs` đọc lại chính tệp này để đối chiếu. */
export const SQL_PATH = join(ROOT, 'supabase', 'samples', 'khach-mot-tuan.sql')

/** Ngày sinh suy từ năm sinh trong hồ sơ mẫu; chỉ dùng khi tài khoản chưa có hồ sơ sức khoẻ. */
const BIRTH_DATE = `${DEMO_WEEK_PROFILE.birthYear}-01-01`

function readEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
      if (match === null) continue
      const [, key, value] = match
      if (key === undefined || value === undefined) continue
      if (env[key] === undefined || env[key] === '') env[key] = value.trim()
    }
  } catch {
    // Không có tệp thì dựa vào biến môi trường.
  }
  return env
}

function usage() {
  console.log('Nạp một tuần dữ liệu mẫu cho một khách hàng.')
  console.log('')
  console.log('  npm run make:week -- <email> [--emit-sql]')
  console.log('')
  console.log('  <email>      tài khoản khách đã đăng nhập ít nhất một lần')
  console.log('  --emit-sql   chỉ sinh tệp SQL, không ghi vào Supabase')
  console.log('')
  console.log(`Tuần mẫu có ${DEMO_WEEK_DAYS} ngày: 3 ngày thực đơn × 4 bữa, cân nặng, vận động.`)
}

/** Chỉ số đã tính sẵn ở tầng ứng dụng; CSDL chỉ lưu lại. */
function sqlTextArray(values) {
  if (values.length === 0) return `'{}'::text[]`
  return `array[${values.map((value) => `'${value}'`).join(', ')}]::text[]`
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
}

/**
 * Sinh tệp SQL tự chứa, chạy được bằng cách dán vào SQL Editor của Supabase Studio.
 *
 * Ngày viết dạng `current_date - n` chứ không phải ngày cụ thể: tệp sinh hôm nay vẫn đúng khi
 * đem chạy tuần sau, và chạy lại nhiều lần luôn cho cùng một tuần.
 *
 * Xuất ra ngoài để `scripts/check-sample-week.mjs` dùng lại **đúng hàm này** khi đối chiếu tệp
 * trên đĩa. Hai bản sao của phép sinh SQL là hai bản sẽ lệch nhau.
 */
export function buildSql(email, days, targets) {
  const lines = []

  lines.push('-- ============================================================================')
  lines.push('-- NutriBoost — một tuần dữ liệu mẫu cho MỘT khách hàng')
  lines.push('--')
  lines.push('-- TỆP NÀY ĐƯỢC SINH TỰ ĐỘNG. Đừng sửa tay:')
  lines.push(`--   npm run make:week -- ${email} --emit-sql`)
  lines.push('--')
  lines.push('-- Cách dùng: Supabase Studio → SQL Editor → dán toàn bộ tệp → Run.')
  lines.push('--')
  lines.push('-- Đặc tính:')
  lines.push(
    `--   • Thay thế đúng ${DEMO_WEEK_DAYS} ngày gần nhất của khách, nên chạy lại vẫn ra một tuần.`,
  )
  lines.push('--   • Món ăn trỏ tới `foods` thật theo `slug`, không phải bản ghi mồ côi.')
  lines.push('--   • Tổng ngày do `refresh_daily_summary` tính, không phải số chép tay.')
  lines.push('-- ============================================================================')
  lines.push('')
  lines.push('do $$')
  lines.push('declare')
  lines.push(`  v_email text := '${email}';  -- ĐỔI DÒNG NÀY thành email khách của bạn`)
  lines.push('  v_user uuid;')
  lines.push('  v_today date := current_date;')
  lines.push('  v_meal uuid;')
  lines.push('begin')
  lines.push('  select id into v_user from auth.users where lower(email) = lower(v_email);')
  lines.push('')
  lines.push('  if v_user is null then')
  lines.push(
    "    raise exception 'Không tìm thấy tài khoản % — tài khoản được tạo ở lần đăng nhập đầu tiên.', v_email;",
  )
  lines.push('  end if;')
  lines.push('')
  lines.push('  -- Hồ sơ tối thiểu: chỉ tạo khi chưa có, không ghi đè hồ sơ khách đã tự thiết lập.')
  lines.push(
    `  insert into public.profiles (id, full_name) values (v_user, '${DEMO_WEEK_PROFILE.fullName}')`,
  )
  lines.push('  on conflict (id) do nothing;')
  lines.push('')
  lines.push('  insert into public.health_profiles (')
  lines.push('    user_id, sex, date_of_birth, height_cm, activity_level, goal, rate_kg_per_week')
  lines.push('  )')
  lines.push(
    `  values (v_user, '${DEMO_WEEK_PROFILE.sex}', '${BIRTH_DATE}', ${DEMO_WEEK_PROFILE.heightCm}, ` +
      `'${DEMO_WEEK_PROFILE.activityLevel}', '${DEMO_WEEK_PROFILE.goal}', ${DEMO_WEEK_PROFILE.rateKgPerWeek})`,
  )
  lines.push('  on conflict (user_id) do nothing;')
  lines.push('')
  lines.push(`  -- Dọn tuần cũ trước khi nạp, để chạy lại không sinh ra hai bữa cho một ngày.`)
  lines.push(
    `  delete from public.meal_logs where user_id = v_user and local_date >= v_today - ${DEMO_WEEK_DAYS - 1};`,
  )
  lines.push(
    `  delete from public.activity_logs where user_id = v_user and local_date >= v_today - ${DEMO_WEEK_DAYS - 1};`,
  )
  lines.push(
    `  delete from public.body_metrics where user_id = v_user and measured_on >= v_today - ${DEMO_WEEK_DAYS - 1};`,
  )
  lines.push(
    `  delete from public.daily_summaries where user_id = v_user and local_date >= v_today - ${DEMO_WEEK_DAYS - 1};`,
  )
  lines.push(
    `  delete from public.energy_targets where user_id = v_user and effective_from >= v_today - ${DEMO_WEEK_DAYS - 1};`,
  )
  lines.push('')
  lines.push('  -- Cân nặng theo ngày.')
  lines.push('  insert into public.body_metrics (user_id, measured_on, weight_kg) values')
  lines.push(
    days
      .map((day, index) => `    (v_user, v_today - ${DEMO_WEEK_DAYS - 1 - index}, ${day.weightKg})`)
      .join(',\n') + ';',
  )
  lines.push('')
  lines.push('  -- Mục tiêu năng lượng, hiệu lực từ đầu tuần.')
  lines.push('  insert into public.energy_targets (')
  lines.push('    user_id, effective_from, bmr_kcal, tdee_kcal, target_kcal,')
  lines.push('    protein_g, carb_g, fat_g, formula_version, inputs, floors_applied')
  lines.push('  )')
  lines.push('  values (')
  lines.push(
    `    v_user, v_today - ${DEMO_WEEK_DAYS - 1}, ${targets.bmrKcal}, ${targets.tdeeKcal}, ${targets.targetKcal},`,
  )
  lines.push(
    `    ${targets.proteinG}, ${targets.carbG}, ${targets.fatG}, '${targets.formulaVersion}',`,
  )
  lines.push(
    '    ' +
      sqlJson({
        sex: DEMO_WEEK_PROFILE.sex,
        dateOfBirth: BIRTH_DATE,
        heightCm: DEMO_WEEK_PROFILE.heightCm,
        weightKg: DEMO_WEEK_PROFILE.weightKg,
        activityLevel: DEMO_WEEK_PROFILE.activityLevel,
        goal: DEMO_WEEK_PROFILE.goal,
        rateKgPerWeek: DEMO_WEEK_PROFILE.rateKgPerWeek,
      }) +
      ',',
  )
  lines.push(`    ${sqlTextArray(targets.floorsApplied)}`)
  lines.push('  );')
  lines.push('')

  days.forEach((day, index) => {
    const offset = DEMO_WEEK_DAYS - 1 - index

    /*
     * Chú thích ghi theo **số thứ tự ngày**, không ghi ngày cụ thể.
     *
     * Ngày cụ thể sẽ khiến tệp sinh hôm nay khác tệp sinh ngày mai, dù dữ liệu y hệt — và khi
     * đó không thể kiểm chứng "tệp trên đĩa có khớp với tuần mẫu hiện tại" được nữa.
     */
    lines.push(
      `  -- Ngày ${index + 1}/${DEMO_WEEK_DAYS} (v_today - ${offset}), ${day.total.kcal} kcal`,
    )

    for (const meal of day.meals) {
      /*
       * Giờ ăn tính từ `v_today`, KHÔNG nhúng ngày cụ thể.
       *
       * Ngày cụ thể làm tệp sinh hôm nay khác tệp sinh ngày mai dù dữ liệu y hệt — và khi đó
       * lệnh `check:sample` báo "tệp đã cũ" một cách sai lệch chỉ vì qua nửa đêm.
       * `at time zone` giữ đúng giờ Việt Nam như trước.
       */
      const eatenAt = `((v_today - ${offset}) + time '${meal.timeLabel}') at time zone 'Asia/Ho_Chi_Minh'`

      lines.push('  insert into public.meal_logs (')
      lines.push('    user_id, eaten_at, local_date, meal_type, source, raw_input,')
      lines.push('    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at')
      lines.push('  )')
      lines.push('  values (')
      lines.push(
        `    v_user, ${eatenAt}, v_today - ${offset}, '${meal.mealType}', 'ai_chat',` +
          ` '${meal.rawInput.replace(/'/g, "''")}',`,
      )
      lines.push(
        `    ${meal.total.kcal}, ${meal.total.proteinG}, ${meal.total.carbG}, ${meal.total.fatG},` +
          ` ${eatenAt}`,
      )
      lines.push('  ) returning id into v_meal;')
      lines.push('')
      lines.push('  insert into public.meal_log_items (')
      lines.push('    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,')
      lines.push('    fiber_g, sugar_g, sodium_mg, match_method')
      lines.push('  ) values')
      lines.push(
        meal.items
          .map(
            (item) =>
              `    (v_meal, (select id from public.foods where slug = '${item.slug}'), ` +
              `'${item.displayName.replace(/'/g, "''")}', ${item.grams}, ${item.kcal}, ` +
              `${item.proteinG}, ${item.carbG}, ${item.fatG}, ${item.fiberG}, ${item.sugarG}, ` +
              `${item.sodiumMg}, 'ai')`,
          )
          .join(',\n') + ';',
      )
      lines.push('')
    }

    if (day.activity !== null) {
      lines.push('  -- Vận động')
      lines.push('  insert into public.activity_logs (')
      lines.push(
        '    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source',
      )
      lines.push('  )')
      lines.push('  values (')
      lines.push(
        `    v_user, ((v_today - ${offset}) + time '18:00') at time zone 'Asia/Ho_Chi_Minh',` +
          ` v_today - ${offset}, '${day.activity.code}', ${day.activity.minutes},` +
          ` ${day.activity.met}, ${day.kcalBurned}, 'manual'`,
      )
      lines.push('  );')
      lines.push('')
    }
  })

  lines.push('  -- Tổng hợp ngày: kcal nạp vào, kcal đốt, độ tuân thủ, chuỗi ngày.')
  lines.push(
    '  -- Tính bằng hàm của CSDL chứ không chép tay, để khớp với đường ghi thật của ứng dụng.',
  )
  days.forEach((day, index) => {
    lines.push(
      `  perform public.refresh_daily_summary(v_user, v_today - ${DEMO_WEEK_DAYS - 1 - index});`,
    )
  })
  lines.push('')
  lines.push(`  raise notice 'Đã nạp ${DEMO_WEEK_DAYS} ngày dữ liệu mẫu cho %', v_email;`)
  lines.push('end $$;')
  lines.push('')

  return lines.join('\n')
}

/** Tìm người dùng theo email. `listUsers` phân trang; CSDL phát triển thì một trang là đủ. */
async function findUserId(service, email) {
  const { data, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error !== null) {
    console.error(`Không đọc được danh sách người dùng: ${error.message}`)
    process.exit(1)
  }

  const target = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  if (target === undefined) {
    console.error(`Không tìm thấy tài khoản "${email}".`)
    console.error('Tài khoản được tạo ở lần đăng nhập đầu tiên — vào ứng dụng đăng nhập trước.')
    process.exit(1)
  }

  return target.id
}

async function main() {
  const args = process.argv.slice(2)
  const email = args.find((arg) => !arg.startsWith('--'))
  const emitSql = args.includes('--emit-sql')

  if (email === undefined) {
    usage()
    process.exit(1)
  }

  const days = buildDemoWeekDays()
  const targets = demoEnergyTargets()
  const firstDate = days[0]?.localDate

  if (firstDate === undefined) {
    console.error('Tuần mẫu rỗng — kiểm tra `demo-week.ts`.')
    process.exit(1)
  }

  // Nhánh này không cần Supabase: ai không muốn cấp khoá service role vẫn dùng được.
  if (emitSql) {
    const sql = buildSql(email, days, targets)
    mkdirSync(dirname(SQL_PATH), { recursive: true })
    writeFileSync(SQL_PATH, sql, 'utf8')
    console.log(`Đã sinh ${SQL_PATH}`)
    console.log(
      `  Tuần: ${firstDate} → ${days[days.length - 1]?.localDate} (${DEMO_WEEK_DAYS} ngày)`,
    )
    console.log(`  Mục tiêu mỗi ngày: ${targets.targetKcal} kcal`)
    console.log('')
    console.log('Mở Supabase Studio → SQL Editor → dán tệp đó → Run.')
    return
  }

  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local')
    console.error('Muốn lấy SQL để tự chạy thì thêm cờ --emit-sql.')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const userId = await findUserId(service, email)

  // Hồ sơ tối thiểu, chỉ tạo khi chưa có — không ghi đè hồ sơ khách đã tự thiết lập.
  await service.from('profiles').upsert({ id: userId, full_name: DEMO_WEEK_PROFILE.fullName })
  const { data: health } = await service
    .from('health_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (health === null) {
    const { error } = await service.from('health_profiles').insert({
      user_id: userId,
      sex: DEMO_WEEK_PROFILE.sex,
      date_of_birth: BIRTH_DATE,
      height_cm: DEMO_WEEK_PROFILE.heightCm,
      activity_level: DEMO_WEEK_PROFILE.activityLevel,
      goal: DEMO_WEEK_PROFILE.goal,
      rate_kg_per_week: DEMO_WEEK_PROFILE.rateKgPerWeek,
    })
    if (error !== null) {
      console.error(`Không tạo được hồ sơ sức khoẻ: ${error.message}`)
      process.exit(1)
    }
    console.log('Tài khoản chưa có hồ sơ sức khoẻ — đã tạo hồ sơ tối thiểu theo tuần mẫu.')
  }

  // Bảng `foods` để gắn `food_id` theo slug; món mẫu nào không có thì để NULL và báo lại.
  const { data: foods, error: foodError } = await service.from('foods').select('id, slug')
  if (foodError !== null) {
    console.error(`Không đọc được danh mục món: ${foodError.message}`)
    process.exit(1)
  }
  const foodIds = new Map((foods ?? []).map((row) => [row.slug, row.id]))

  // Dọn tuần cũ để chạy lại nhiều lần vẫn ra đúng một tuần.
  const cleanup = [
    service.from('meal_logs').delete().eq('user_id', userId).gte('local_date', firstDate),
    service.from('activity_logs').delete().eq('user_id', userId).gte('local_date', firstDate),
    service.from('body_metrics').delete().eq('user_id', userId).gte('measured_on', firstDate),
    service.from('daily_summaries').delete().eq('user_id', userId).gte('local_date', firstDate),
    service.from('energy_targets').delete().eq('user_id', userId).gte('effective_from', firstDate),
  ]
  for (const result of await Promise.all(cleanup)) {
    if (result.error !== null) {
      console.error(`Không dọn được dữ liệu cũ: ${result.error.message}`)
      process.exit(1)
    }
  }

  const { error: weightError } = await service.from('body_metrics').insert(
    days.map((day) => ({
      user_id: userId,
      measured_on: day.localDate,
      weight_kg: day.weightKg,
    })),
  )
  if (weightError !== null) {
    console.error(`Không ghi được cân nặng: ${weightError.message}`)
    process.exit(1)
  }

  const { error: targetError } = await service.from('energy_targets').insert({
    user_id: userId,
    effective_from: firstDate,
    bmr_kcal: targets.bmrKcal,
    tdee_kcal: targets.tdeeKcal,
    target_kcal: targets.targetKcal,
    protein_g: targets.proteinG,
    carb_g: targets.carbG,
    fat_g: targets.fatG,
    formula_version: targets.formulaVersion,
    inputs: {
      sex: DEMO_WEEK_PROFILE.sex,
      dateOfBirth: BIRTH_DATE,
      heightCm: DEMO_WEEK_PROFILE.heightCm,
      weightKg: DEMO_WEEK_PROFILE.weightKg,
      activityLevel: DEMO_WEEK_PROFILE.activityLevel,
      goal: DEMO_WEEK_PROFILE.goal,
      rateKgPerWeek: DEMO_WEEK_PROFILE.rateKgPerWeek,
    },
    floors_applied: targets.floorsApplied,
  })
  if (targetError !== null) {
    console.error(`Không ghi được mục tiêu năng lượng: ${targetError.message}`)
    process.exit(1)
  }

  let mealCount = 0
  let itemCount = 0
  const missingSlugs = new Set()

  for (const day of days) {
    for (const meal of day.meals) {
      const eatenAt = `${day.localDate}T${meal.timeLabel}:00+07:00`
      const { data: log, error } = await service
        .from('meal_logs')
        .insert({
          user_id: userId,
          eaten_at: eatenAt,
          local_date: day.localDate,
          meal_type: meal.mealType,
          source: 'ai_chat',
          raw_input: meal.rawInput,
          total_kcal: meal.total.kcal,
          total_protein_g: meal.total.proteinG,
          total_carb_g: meal.total.carbG,
          total_fat_g: meal.total.fatG,
          confirmed_at: eatenAt,
        })
        .select('id')
        .single()

      if (error !== null || log === null) {
        console.error(`Không ghi được bữa ăn ${day.localDate} ${meal.mealType}: ${error?.message}`)
        process.exit(1)
      }

      const { error: itemsError } = await service.from('meal_log_items').insert(
        meal.items.map((item) => {
          const foodId = foodIds.get(item.slug) ?? null
          if (foodId === null) missingSlugs.add(item.slug)

          return {
            meal_log_id: log.id,
            food_id: foodId,
            display_name: item.displayName,
            grams: item.grams,
            kcal: item.kcal,
            protein_g: item.proteinG,
            carb_g: item.carbG,
            fat_g: item.fatG,
            fiber_g: item.fiberG,
            sugar_g: item.sugarG,
            sodium_mg: item.sodiumMg,
            match_method: 'ai',
          }
        }),
      )
      if (itemsError !== null) {
        console.error(`Không ghi được món của bữa ${day.localDate}: ${itemsError.message}`)
        process.exit(1)
      }

      mealCount += 1
      itemCount += meal.items.length
    }

    if (day.activity !== null) {
      const { error } = await service.from('activity_logs').insert({
        user_id: userId,
        performed_at: `${day.localDate}T18:00:00+07:00`,
        local_date: day.localDate,
        activity_code: day.activity.code,
        minutes: day.activity.minutes,
        met: day.activity.met,
        kcal_burned: day.kcalBurned,
        source: 'manual',
      })
      if (error !== null) {
        console.error(`Không ghi được vận động ${day.localDate}: ${error.message}`)
        process.exit(1)
      }
    }
  }

  /*
   * Tổng hợp ngày do CSDL tính — không chép tay. Hàm này chỉ cấp cho `service_role`
   * (migration 006), đúng vai trò mà script đang dùng.
   */
  for (const day of days) {
    const { error } = await service.rpc('refresh_daily_summary', {
      p_user_id: userId,
      p_local_date: day.localDate,
    })
    if (error !== null) {
      console.error(`Không tổng hợp được ngày ${day.localDate}: ${error.message}`)
      process.exit(1)
    }
  }

  console.log(`Đã nạp ${DEMO_WEEK_DAYS} ngày dữ liệu mẫu cho ${email}.`)
  console.log(`  Tuần        ${firstDate} → ${days[days.length - 1]?.localDate}`)
  console.log(`  Bữa ăn      ${mealCount} bữa · ${itemCount} món`)
  console.log(`  Cân nặng    ${days.length} lần đo`)
  console.log(`  Mục tiêu    ${targets.targetKcal} kcal/ngày`)

  if (missingSlugs.size > 0) {
    console.log('')
    console.log(
      `CẢNH BÁO: ${missingSlugs.size} món mẫu không có trong bảng foods (đã ghi với food_id NULL):`,
    )
    console.log(`  ${[...missingSlugs].join(', ')}`)
    console.log('Chạy `npm run seed` để nạp danh mục món.')
  }

  console.log('')
  console.log('Mở http://localhost:3000/tien-do và /hom-nay để xem.')
}

/*
 * Chỉ tự chạy khi được gọi trực tiếp.
 *
 * `scripts/check-sample-week.mjs` import tệp này để dùng lại `buildSql`. Không có hàng rào này
 * thì việc import cũng kéo theo `main()`, và nó thoát ngay vì thiếu tham số email.
 */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) await main()
