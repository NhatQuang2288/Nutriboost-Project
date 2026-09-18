#!/usr/bin/env node
/**
 * Kiểm chứng đường dữ liệu THẬT trên Supabase đang chạy.
 *
 * Vì sao cần script riêng, khi đã có `db:check` và bộ test RLS trên PGlite:
 *
 *   • `db:check` chạy migration trên PostgreSQL thuần — nó không đi qua **PostgREST**, mà
 *     PostgREST mới là thứ tầng ứng dụng nói chuyện. Cách nó chuyển mảng JavaScript thành
 *     tham số `text[]`/`enum[]` là hành vi riêng của nó, và **không** giống trình điều khiển
 *     thô. Đây là chỗ dễ vỡ nhất khi thêm hàm nhận tham số mảng.
 *   • Bộ test RLS trên PGlite tự dựng `auth.uid()`. Ở đây phiên là thật: JWT thật, RLS thật,
 *     `auth.uid()` thật.
 *   • Không có gì trong hai bộ trên chứng minh **quyền gọi hàm** đã siết đúng trên môi
 *     trường thật — một `grant` sai chỉ lộ ra khi có vai trò `authenticated` thật.
 *
 *   npx supabase start && npm run db:reset && npm run check:live
 *
 * Script tự tạo một người dùng tạm, chạy kiểm tra, rồi xoá nó. Không đụng vào dữ liệu có sẵn.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Đọc `.env.local` ở gốc. Không dùng dotenv: chỉ cần vài dòng phân tích. */
function readEnv() {
  const env = { ...process.env }
  try {
    const text = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
      if (match === null) continue
      const [, key, rawValue] = match
      if (key === undefined || rawValue === undefined) continue
      if (env[key] === undefined || env[key] === '') env[key] = rawValue.trim()
    }
  } catch {
    // Không có tệp thì dựa hết vào biến môi trường.
  }
  return env
}

const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? 'OK   ' : 'LỖI  '} ${name}${detail === undefined ? '' : `  — ${detail}`}`)
}

/** Chạy một bước, coi việc ném lỗi là thất bại chứ không làm đổ cả script. */
async function step(name, run) {
  try {
    const detail = await run()
    record(name, true, detail)
    return true
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error))
    return false
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY trong .env.local')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const stamp = Date.now()
  const email = `kiem-chung-${stamp}@example.com`
  const password = `Kiem-chung-${stamp}-aA1!`

  console.log(`Kiểm chứng đường dữ liệu thật trên ${url}`)
  console.log('─'.repeat(64))

  let userId = null

  try {
    await step('tạo người dùng tạm bằng khoá service role', async () => {
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error !== null) throw new Error(error.message)
      userId = data.user?.id ?? null
      assert(userId !== null, 'không lấy được id người dùng')
      return userId
    })

    if (userId === null) {
      // Không thoát bằng ngoại lệ: thông báo cần nói *phải làm gì*, không phải một stack trace.
      console.log('─'.repeat(64))
      console.error('Không tạo được người dùng tạm, nên không kiểm chứng được gì.')
      console.error('Kiểm tra: Supabase đã chạy chưa (`npx supabase start`), và migration đã')
      console.error('được nạp chưa (`npm run db:reset` — lệnh này XOÁ dữ liệu local).')
      process.exit(1)
    }

    await step('hồ sơ được trigger handle_new_user tạo tự động', async () => {
      const { data, error } = await service
        .from('profiles')
        .select('id, onboarded_at')
        .eq('id', userId)
        .maybeSingle()
      if (error !== null) throw new Error(error.message)
      assert(data !== null, 'trigger không tạo hồ sơ')
      assert(data.onboarded_at === null, 'hồ sơ mới phải chưa onboarded')
      return 'có hồ sơ, onboarded_at = null'
    })

    await step('đăng nhập bằng mật khẩu để có phiên THẬT', async () => {
      const { data, error } = await anon.auth.signInWithPassword({ email, password })
      if (error !== null) throw new Error(error.message)
      assert(data.session !== null, 'không có phiên')
      return 'có JWT'
    })

    /*
     * Bước quan trọng nhất. Đây là chỗ kiểm chứng PostgREST chuyển được mảng JavaScript
     * thành tham số `medical_flag[]` và `text[]`. Trình điều khiển thô trong test PGlite
     * KHÔNG làm giống PostgREST, nên lỗi ở đây không lộ ra ở đâu khác.
     */
    await step('complete_onboarding — tham số mảng đi qua PostgREST', async () => {
      const { error } = await anon.rpc('complete_onboarding', {
        p_sex: 'male',
        p_date_of_birth: '1996-09-18',
        p_height_cm: 170,
        p_activity_level: 'moderate',
        p_goal: 'lose',
        p_rate_kg_per_week: 0.35,
        p_weight_kg: 70,
        p_medical_flags: [],
        p_consent_version: '2026-09-18',
        p_bmr_kcal: 1618,
        p_tdee_kcal: 2508,
        p_target_kcal: 2120,
        p_protein_g: 125,
        p_carb_g: 270,
        p_fat_g: 60,
        p_formula_version: 'mifflin-st-jeor@v1',
        p_floors_applied: ['deficit_cap'],
      })
      if (error !== null) throw new Error(error.message)
      return 'không lỗi'
    })

    await step('hồ sơ đã đầy đủ sau khi thiết lập', async () => {
      const [{ data: health }, { data: profile }, { count }] = await Promise.all([
        anon.from('health_profiles').select('height_cm, goal').eq('user_id', userId).maybeSingle(),
        anon.from('profiles').select('onboarded_at').eq('id', userId).maybeSingle(),
        anon.from('consents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ])
      assert(health !== null, 'thiếu health_profiles')
      assert(profile?.onboarded_at != null, 'onboarded_at chưa được đặt')
      assert(count === 3, `phải có 3 loại đồng ý, đang có ${count}`)
      return 'health_profiles + onboarded_at + 3 đồng ý'
    })

    await step('nhật ký ngày mới là mảng rỗng, không phải null', async () => {
      const { data, error } = await anon.rpc('read_day_meals', {
        p_user_id: userId,
        p_local_date: '2026-09-18',
      })
      if (error !== null) throw new Error(error.message)
      assert(Array.isArray(data) && data.length === 0, `nhận được ${JSON.stringify(data)}`)
      return '[]'
    })

    await step('log_meal_with_items — ghi bữa ăn thật', async () => {
      const { data: food, error: lookupError } = await anon
        .from('foods')
        .select('id')
        .limit(1)
        .maybeSingle()
      if (lookupError !== null) throw new Error(lookupError.message)
      assert(food !== null, 'danh mục thực phẩm rỗng — đã chạy `npm run db:reset` chưa?')

      const { data, error } = await anon.rpc('log_meal_with_items', {
        p_local_date: '2026-09-18',
        p_meal_type: 'breakfast',
        p_raw_input: 'kiểm chứng tự động',
        p_items: [
          {
            foodId: food.id,
            displayName: 'Món kiểm chứng',
            grams: 200,
            kcal: 300,
            proteinG: 20,
            carbG: 30,
            fatG: 8,
            fiberG: 2.5,
            sugarG: 1.5,
            sodiumMg: 400,
            matchMethod: 'ai',
          },
        ],
      })
      if (error !== null) throw new Error(error.message)
      assert(typeof data === 'string', 'không nhận được id bữa ăn')
      return data
    })

    await step('đọc lại: tổng tính từ món, và giữ được chất xơ', async () => {
      const { data, error } = await anon.rpc('read_day_meals', {
        p_user_id: userId,
        p_local_date: '2026-09-18',
      })
      if (error !== null) throw new Error(error.message)
      assert(Array.isArray(data) && data.length === 1, `phải có 1 bữa, có ${data?.length}`)
      const meal = data[0]
      assert(meal.totalKcal === 300, `tổng kcal phải là 300, đang ${meal.totalKcal}`)
      assert(
        meal.items?.[0]?.fiberG === 2.5,
        `chất xơ phải là 2.5, đang ${meal.items?.[0]?.fiberG}`,
      )
      return `1 bữa, ${meal.totalKcal} kcal, chất xơ ${meal.items[0].fiberG} g`
    })

    await step('daily_summaries khớp ngay sau khi ghi', async () => {
      const { data, error } = await anon
        .from('daily_summaries')
        .select('kcal_in')
        .eq('user_id', userId)
        .eq('local_date', '2026-09-18')
        .maybeSingle()
      if (error !== null) throw new Error(error.message)
      assert(data !== null, 'không có hàng tổng hợp ngày')
      assert(data.kcal_in === 300, `kcal_in phải là 300, đang ${data.kcal_in}`)
      return 'kcal_in = 300'
    })

    await step('invite_code_status trả mảng rỗng cho người không phải PT', async () => {
      const { data, error } = await anon.rpc('invite_code_status')
      if (error !== null) throw new Error(error.message)
      assert(Array.isArray(data) && data.length === 0, `nhận được ${JSON.stringify(data)}`)
      return '[]'
    })

    /*
     * SÁU KIỂM TRA BẢO MẬT. Migration 006 siết quyền bốn hàm `security definer`; ở đây
     * kiểm chứng trên môi trường thật, vì một `grant` sai chỉ lộ ra khi có vai trò
     * `authenticated` thật.
     */
    await step('[bảo mật] người dùng KHÔNG gọi được active_subscription', async () => {
      const { error } = await anon.rpc('active_subscription', { p_owner: userId })
      assert(error !== null, 'GỌI ĐƯỢC — hàm này lộ điều khoản gói của PT khác!')
      return 'bị từ chối'
    })

    await step('[bảo mật] người dùng KHÔNG tự nâng hạn mức AI', async () => {
      const { error } = await anon.rpc('claim_ai_quota', {
        p_user_id: userId,
        p_purpose: 'chat',
        p_limit: 1000000,
      })
      assert(error !== null, 'GỌI ĐƯỢC — tự nâng trần AI của mình là được!')
      return 'bị từ chối'
    })

    await step('[bảo mật] người dùng KHÔNG ghi đè tổng hợp ngày của người khác', async () => {
      const { error } = await anon.rpc('refresh_daily_summary', {
        p_user_id: userId,
        p_local_date: '2026-09-18',
      })
      // LƯU Ý: `auth.uid()` = chính người này, nên nếu hàm được cấp quyền thì nó CHẠY ĐƯỢC.
      // Điều cần kiểm là quyền gọi, không phải logic bên trong.
      assert(error !== null, 'GỌI ĐƯỢC trực tiếp — nên chỉ service role gọi được')
      return 'bị từ chối'
    })

    await step('[bảo mật] người dùng KHÔNG tính lại chỉ số món ăn', async () => {
      const { error } = await anon.rpc('recompute_dish_nutrients', {
        p_dish_id: '00000000-0000-0000-0000-000000000000',
      })
      assert(error !== null, 'GỌI ĐƯỢC — sửa được bảng mà chính sách chỉ cho quản trị viên ghi')
      return 'bị từ chối'
    })

    await step('[bảo mật] người dùng KHÔNG tự thêm mình vào pt_clients', async () => {
      const { error } = await anon.from('pt_clients').insert({ pt_id: userId, client_id: userId })
      assert(error !== null, 'INSERT ĐƯỢC — bỏ qua được cả hạn mức gói lẫn mã mời')
      return 'bị từ chối'
    })

    await step('[bảo mật] người dùng KHÔNG đọc được bảng invite_codes', async () => {
      const { data, error } = await anon.from('invite_codes').select('code')
      // RLS lọc hàng nên trả về mảng rỗng, không phải lỗi.
      assert(error === null || data === null, `lỗi bất ngờ: ${error?.message}`)
      assert((data ?? []).length === 0, 'ĐỌC ĐƯỢC mã mời của người khác!')
      return '0 hàng'
    })
  } finally {
    if (userId !== null) {
      const { error } = await service.auth.admin.deleteUser(userId)
      console.log('─'.repeat(64))
      console.log(error === null ? 'Đã xoá người dùng tạm.' : `Không xoá được: ${error.message}`)
    }
  }

  const failed = results.filter((item) => !item.ok)
  console.log('')
  if (failed.length > 0) {
    console.error(`${failed.length}/${results.length} kiểm tra THẤT BẠI:`)
    for (const item of failed) console.error(`  • ${item.name} — ${item.detail}`)
    process.exit(1)
  }
  console.log(`${results.length}/${results.length} kiểm tra đạt. Đường dữ liệu thật hoạt động.`)
}

await main()
