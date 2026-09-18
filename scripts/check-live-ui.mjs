#!/usr/bin/env node
/**
 * Walkthrough thật trong trình duyệt: đăng nhập bằng magic link → onboarding → màn Hôm nay.
 *
 * Vì sao cần, khi đã có `check:live` và bộ E2E:
 *
 *   • `check:live` gọi thẳng API bằng `@supabase/supabase-js`. Nó chứng minh CSDL và RLS,
 *     nhưng **không** chạm tới luồng đăng nhập của ứng dụng.
 *   • Bộ E2E chạy ở chế độ dữ liệu mẫu (Playwright khai báo ba biến Supabase là chuỗi rỗng),
 *     nên nó chưa bao giờ đi qua `/auth/callback` thật.
 *
 * Chính khoảng trống đó đã giấu một lỗi thật: Supabase từ chối `emailRedirectTo` vì
 * `GOTRUE_URI_ALLOW_LIST` sai giao thức và thiếu đường dẫn, rồi **lặng lẽ** trả người dùng về
 * `site_url`. Không bộ test nào bắt được, vì không bộ nào mở liên kết trong email.
 *
 * Cần: Supabase và dev server đang chạy.
 *
 *   npm run dev            # ở terminal khác
 *   npm run check:live:ui
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'
import { computeEnergyTargets } from '@nutriboost/nutrition'

import { ONBOARDING_RATE_KG_PER_WEEK } from '../apps/web/src/lib/onboarding'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Dev server. Dùng `localhost` chứ không `127.0.0.1`: cookie PKCE gắn với tên miền. */
const BASE_URL = process.env.LIVE_UI_BASE_URL ?? 'http://localhost:3000'
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'

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

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? 'OK   ' : 'LỖI  '} ${name}${detail === undefined ? '' : `  — ${detail}`}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function step(name, run) {
  try {
    record(name, true, await run())
    return true
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error))
    return false
  }
}

/** Đợi thư mới nhất gửi tới `email` rồi rút liên kết xác thực ra khỏi nội dung. */
async function waitForMagicLink(email, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const list = await (await fetch(`${MAILPIT_URL}/api/v1/messages?limit=10`)).json()
    const message = (list.messages ?? []).find((item) =>
      (item.To ?? []).some((to) => to.Address === email),
    )

    if (message !== undefined) {
      const detail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json()
      const body = String(detail.Text ?? detail.HTML ?? '')
      const links = [...body.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((match) => match[0])
      const verify = links.find((url) => url.includes('/auth/v1/verify'))
      if (verify !== undefined) return verify
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`không nhận được thư cho ${email} sau ${timeoutMs / 1000} giây`)
}

async function main() {
  const env = readEnv()
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey === undefined) {
    console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const service = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const email = `walkthrough-${Date.now()}@example.com`
  console.log(`Walkthrough trình duyệt trên ${BASE_URL}`)
  console.log(`  email tạm: ${email}`)
  console.log('─'.repeat(64))

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  let userId = null
  /** Con số hiện trên màn kết quả onboarding, để đối chiếu với con số trong CSDL. */
  let shownTargetKcal = null

  try {
    await step('màn đăng nhập hiện form magic link (đã cấu hình Supabase)', async () => {
      await page.goto(`${BASE_URL}/dang-nhap`)
      await page.getByLabel('Email').waitFor({ timeout: 10_000 })
      const demoNotice = await page.getByText('Chưa cấu hình Supabase').count()
      assert(demoNotice === 0, 'trang vẫn ở chế độ dữ liệu mẫu — env chưa được nạp?')
      return 'có ô nhập email'
    })

    const sent = await step('gửi liên kết đăng nhập từ giao diện', async () => {
      await page.getByLabel('Email').fill(email)
      await page.getByRole('button', { name: /Gửi liên kết đăng nhập/ }).click()
      await page.getByText(/Mình đã gửi liên kết đăng nhập/).waitFor({ timeout: 15_000 })
      return 'đã gửi'
    })

    if (!sent) throw new Error('không gửi được liên kết, dừng lại')

    let verifyUrl = null
    await step('Supabase chấp nhận /auth/callback trong liên kết', async () => {
      verifyUrl = await waitForMagicLink(email)
      const redirectTarget = new URL(verifyUrl).searchParams.get('redirect_to')
      assert(
        redirectTarget !== null && redirectTarget.includes('/auth/callback'),
        `redirect_to phải trỏ tới /auth/callback, đang là "${redirectTarget}". ` +
          'Nghĩa là GOTRUE_URI_ALLOW_LIST từ chối — xem CLAUDE.md mục config.toml.',
      )
      return redirectTarget
    })

    await step('mở liên kết trong CÙNG trình duyệt → vào onboarding', async () => {
      assert(verifyUrl !== null, 'không có liên kết')
      await page.goto(verifyUrl, { waitUntil: 'domcontentloaded' })
      await page.waitForURL(/\/onboarding/, { timeout: 20_000 })
      return page.url()
    })

    await step('hoàn tất onboarding và lưu vào CSDL', async () => {
      await page.getByRole('button', { name: 'Nam', exact: true }).click()
      await page.getByLabel('Bạn bao nhiêu tuổi?').fill('30')
      await page.getByRole('button', { name: 'Tiếp tục' }).click()
      await page.getByLabel('Chiều cao').fill('170')
      await page.getByLabel('Cân nặng').fill('70')
      await page.getByRole('button', { name: 'Tiếp tục' }).click()
      await page.getByRole('button', { name: /Vận động vừa/ }).click()
      await page.getByRole('button', { name: 'Giảm cân' }).click()
      await page.getByRole('heading', { name: 'Xong rồi!' }).waitFor({ timeout: 10_000 })

      // Ghi lại con số NGƯỜI DÙNG NHÌN THẤY, để lát nữa so với con số được lưu.
      const shown = await page.locator('.text-display-lg').first().innerText()
      shownTargetKcal = Number(shown.replace(/\D/g, ''))
      assert(
        Number.isFinite(shownTargetKcal) && shownTargetKcal > 0,
        `không đọc được số: "${shown}"`,
      )

      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Vào ứng dụng' }).click()
      await page.waitForURL(/\/hom-nay/, { timeout: 20_000 })
      return `màn kết quả hiện ${shown}`
    })

    await step('màn Hôm nay dùng dữ liệu THẬT, không phải dữ liệu mẫu', async () => {
      await page.goto(`${BASE_URL}/hom-nay`)
      const demoNotice = await page.getByText('Đang hiện dữ liệu mẫu').count()
      assert(demoNotice === 0, 'vẫn hiện dải "dữ liệu mẫu"')

      /*
       * Con số phải khớp công thức, VÀ khớp con số vừa hiện trên màn kết quả onboarding.
       *
       * Bất biến thứ hai chính là thứ đã vỡ: màn onboarding tính bằng 0,35 kg/tuần còn Server
       * Action mặc định 0,5, nên người dùng thấy một đằng và ứng dụng lưu một nẻo. Bộ E2E
       * không bắt được vì nó chạy ở chế độ dữ liệu mẫu, nơi Server Action trả về sớm.
       */
      const expected = computeEnergyTargets({
        weightKg: 70,
        heightCm: 170,
        age: 30,
        sex: 'male',
        activityLevel: 'moderate',
        goal: 'lose',
        rateKgPerWeek: ONBOARDING_RATE_KG_PER_WEEK,
      }).targetKcal

      assert(
        shownTargetKcal === expected,
        `màn kết quả hiện ${shownTargetKcal} nhưng công thức cho ${expected}`,
      )

      await page.getByText(expected.toLocaleString('vi-VN')).first().waitFor({ timeout: 10_000 })
      return `khớp cả hai: ${expected} kcal`
    })

    await step('hồ sơ trong CSDL khớp với câu trả lời', async () => {
      const { data: rows, error } = await service
        .from('profiles')
        .select('id, onboarded_at')
        .eq('full_name', email.split('@')[0])
      if (error !== null) throw new Error(error.message)
      const profile = (rows ?? [])[0]
      assert(profile !== undefined, 'không tìm thấy hồ sơ')
      userId = profile.id
      assert(profile.onboarded_at !== null, 'onboarded_at chưa được đặt')

      const { data: health } = await service
        .from('health_profiles')
        .select('height_cm, goal')
        .eq('user_id', userId)
        .maybeSingle()
      assert(health !== null, 'thiếu health_profiles')
      assert(Number(health.height_cm) === 170, `chiều cao phải là 170, đang ${health.height_cm}`)
      return `hồ sơ ${userId}, cao ${health.height_cm} cm, mục tiêu ${health.goal}`
    })

    await step('màn /toi đọc hồ sơ thật', async () => {
      await page.goto(`${BASE_URL}/toi`)
      await page.getByText('170 cm').waitFor({ timeout: 10_000 })
      await page.getByText('70 kg').first().waitFor({ timeout: 10_000 })
      return 'chiều cao và cân nặng khớp'
    })
  } finally {
    await browser.close()
    if (userId !== null) {
      await service.auth.admin.deleteUser(userId)
      console.log('─'.repeat(64))
      console.log('Đã xoá người dùng tạm.')
    }
  }

  const failed = results.filter((item) => !item.ok)
  console.log('')
  if (failed.length > 0) {
    console.error(`${failed.length}/${results.length} bước THẤT BẠI:`)
    for (const item of failed) console.error(`  • ${item.name} — ${item.detail}`)
    process.exit(1)
  }
  console.log(`${results.length}/${results.length} bước đạt. Luồng đăng nhập chạy thật.`)
}

await main()
