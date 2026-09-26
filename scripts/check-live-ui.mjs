#!/usr/bin/env node
/**
 * Walkthrough thật trong trình duyệt: đăng nhập bằng magic link (lối phụ của màn đăng nhập)
 * → onboarding → màn Hôm nay.
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

/**
 * Nơi liên kết trong thư đưa người dùng về.
 *
 * Mẫu email của dự án (supabase/templates) trỏ thẳng về `/auth/callback?token_hash=…`. Mẫu mặc
 * định của Supabase thì đi qua `/auth/v1/verify?redirect_to=…` — vẫn nhận để script chạy được
 * trên dự án chưa đổi mẫu, nhưng bước kiểm `token_hash` sẽ báo ra.
 */
function callbackTarget(link) {
  const url = new URL(link)
  if (url.pathname.endsWith('/auth/v1/verify')) return url.searchParams.get('redirect_to') ?? ''
  return `${url.origin}${url.pathname}`
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
      // Thư HTML có thể không có phần chữ, và `&` trong href bị viết thành `&amp;`.
      const body = [detail.Text, detail.HTML].filter(Boolean).join('\n').replaceAll('&amp;', '&')
      const links = [...body.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((match) => match[0])
      const verify = links.find(
        (url) => url.includes('/auth/callback?token_hash=') || url.includes('/auth/v1/verify'),
      )
      if (verify !== undefined) return verify
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`không nhận được thư cho ${email} sau ${timeoutMs / 1000} giây`)
}

/**
 * Đăng ký, đăng nhập, quên và đặt lại mật khẩu — toàn bộ qua giao diện, trên Supabase thật.
 *
 * Mỗi bước dùng một phiên trình duyệt mới (cookie sạch), đúng như một người mở máy khác.
 * Trả về id tài khoản tạm để nơi gọi xoá ở `finally`, kể cả khi có bước hỏng giữa chừng.
 */
async function passwordFlow(browser, service) {
  const email = `mat-khau-${Date.now()}@example.com`
  const fullName = 'Kiểm Chứng'
  const firstPassword = `Mat-khau-${Date.now()}-aA1`
  const secondPassword = `Doi-moi-${Date.now()}-bB2`
  let createdId = null
  let resetLink = null

  async function signIn(password) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/dang-nhap`)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    return { context, page }
  }

  await step('mật khẩu dưới 8 ký tự bị chặn ngay trên form đăng ký', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/dang-ky`)
    await page.getByLabel('Tên của bạn').fill(fullName)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill('ngan')
    await page.getByLabel('Nhập lại mật khẩu').fill('ngan')
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click()
    await page.getByText('Mật khẩu cần ít nhất 8 ký tự.').waitFor({ timeout: 5_000 })
    await context.close()
    return 'báo lỗi, không gửi lên máy chủ'
  })

  const created = await step('đăng ký bằng mật khẩu → vào onboarding', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/dang-ky`)
    await page.getByLabel('Tên của bạn').fill(fullName)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(firstPassword)
    await page.getByLabel('Nhập lại mật khẩu').fill(firstPassword)
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click()
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 })
    await context.close()

    const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
    assert(error === null, error?.message)
    const user = data.users.find((item) => item.email === email)
    assert(user !== undefined, 'không thấy tài khoản vừa tạo trong auth.users')
    createdId = user.id
    return user.id
  })

  if (!created) return createdId

  await step('hồ sơ lấy đúng tên nhập ở form đăng ký', async () => {
    const { data, error } = await service
      .from('profiles')
      .select('full_name, role')
      .eq('id', createdId)
      .single()
    assert(error === null, error?.message)
    assert(data.full_name === fullName, `full_name là "${data.full_name}"`)
    assert(data.role === 'client', `đăng ký không được tự cấp vai trò, đang là "${data.role}"`)
    return `${data.full_name} · ${data.role}`
  })

  await step('đăng nhập bằng mật khẩu ở phiên mới', async () => {
    const { context, page } = await signIn(firstPassword)
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 })
    await context.close()
    return 'có phiên, vào onboarding vì hồ sơ chưa xong'
  })

  await step('sai mật khẩu báo lỗi tiếng Việt, không lộ email nào có tài khoản', async () => {
    const { context, page } = await signIn('sai-mat-khau-hoan-toan')
    await page.getByText('Email hoặc mật khẩu không đúng.').waitFor({ timeout: 10_000 })
    assert(page.url().includes('/dang-nhap'), `không được rời màn đăng nhập, đang ở ${page.url()}`)
    await context.close()
    return 'đúng câu chung'
  })

  await step('quên mật khẩu → liên kết trong email → đặt mật khẩu mới', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/quen-mat-khau`)
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Gửi liên kết đặt lại' }).click()
    await page.getByText('Kiểm tra hộp thư của bạn').waitFor({ timeout: 15_000 })

    resetLink = await waitForMagicLink(email)
    const target = callbackTarget(resetLink)
    assert(
      target.includes('/auth/callback'),
      `liên kết phải về /auth/callback, đang là "${target}"`,
    )
    await context.close()

    /*
     * Mở ở một TRÌNH DUYỆT KHÁC (phiên mới, không cookie) — đúng cảnh bấm "Quên mật khẩu" trên
     * máy tính rồi mở thư trên điện thoại. Với mẫu email mặc định (PKCE) bước này hỏng: chỉ
     * trình duyệt đã gửi yêu cầu mới giữ code verifier.
     */
    const other = await browser.newContext()
    const phone = await other.newPage()
    await phone.goto(resetLink, { waitUntil: 'domcontentloaded' })
    await phone.waitForURL(/\/dat-lai-mat-khau/, { timeout: 20_000 })
    await phone.getByLabel('Mật khẩu mới', { exact: true }).fill(secondPassword)
    await phone.getByLabel('Nhập lại mật khẩu mới').fill(secondPassword)
    await phone.getByRole('button', { name: 'Lưu mật khẩu mới' }).click()
    await phone.getByText('Đã đổi mật khẩu.').waitFor({ timeout: 15_000 })
    await other.close()
    return 'mở ở trình duyệt khác vẫn đổi được'
  })

  await step('liên kết đặt lại chỉ dùng được một lần', async () => {
    assert(resetLink !== null, 'không có liên kết')
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(resetLink, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/dang-nhap\?loi=link-khong-dung/, { timeout: 20_000 })
    await context.close()
    return 'báo liên kết không dùng được'
  })

  await step('mật khẩu mới dùng được, mật khẩu cũ thì không', async () => {
    const fresh = await signIn(secondPassword)
    await fresh.page.waitForURL(/\/onboarding/, { timeout: 20_000 })
    await fresh.context.close()

    const old = await signIn(firstPassword)
    await old.page.getByText('Email hoặc mật khẩu không đúng.').waitFor({ timeout: 10_000 })
    await old.context.close()
    return 'đúng cả hai chiều'
  })

  return createdId
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
  let clientId = null
  /** Tài khoản tạo bằng form đăng ký mật khẩu — xoá ở `finally` như hai tài khoản kia. */
  let passwordUserId = null
  /** Con số hiện trên màn kết quả onboarding, để đối chiếu với con số trong CSDL. */
  let shownTargetKcal = null

  try {
    await step('màn đăng nhập hiện form (đã cấu hình Supabase)', async () => {
      await page.goto(`${BASE_URL}/dang-nhap`)
      await page.getByLabel('Email').waitFor({ timeout: 10_000 })
      const demoNotice = await page.getByText('Chưa cấu hình Supabase').count()
      assert(demoNotice === 0, 'trang vẫn ở chế độ dữ liệu mẫu — env chưa được nạp?')
      return 'có ô nhập email'
    })

    const sent = await step('gửi liên kết đăng nhập từ giao diện', async () => {
      // Đường chính là email + mật khẩu; magic link nằm sau nút phụ. Chuyển sang đó trước.
      await page.getByRole('button', { name: /Đăng nhập bằng liên kết qua email/ }).click()
      await page.getByLabel('Email').fill(email)
      await page.getByRole('button', { name: /Gửi liên kết đăng nhập/ }).click()
      await page.getByText(/Mình đã gửi liên kết đăng nhập/).waitFor({ timeout: 15_000 })
      return 'đã gửi'
    })

    if (!sent) throw new Error('không gửi được liên kết, dừng lại')

    let verifyUrl = null
    await step('Supabase chấp nhận /auth/callback trong liên kết', async () => {
      verifyUrl = await waitForMagicLink(email)
      const target = callbackTarget(verifyUrl)
      assert(
        target.includes('/auth/callback'),
        `liên kết phải về /auth/callback, đang là "${target}". ` +
          'Nghĩa là GOTRUE_URI_ALLOW_LIST từ chối — xem CLAUDE.md mục config.toml.',
      )
      return target
    })

    await step('liên kết dùng token_hash — mở được ở thiết bị khác', async () => {
      assert(verifyUrl !== null, 'không có liên kết')
      assert(
        new URL(verifyUrl).searchParams.has('token_hash'),
        'thư vẫn dùng mẫu mặc định (PKCE): mở ở trình duyệt khác sẽ hỏng. ' +
          'Xem supabase/templates và mục mẫu email trong CLAUDE.md.',
      )
      return 'có token_hash'
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

    await step('trợ lý Bơ trả lời trong phiên thật', async () => {
      /*
       * Chưa có khoá DeepSeek thì trợ lý rơi về **đường tất định** — bộ ước lượng bữa ăn chạy
       * tại chỗ, dựng thẻ xác nhận kèm kcal. Đó là hành vi đúng khi thiếu khoá, và bước này
       * khoá lại rằng nó vẫn hoạt động trong phiên thật (bộ E2E chỉ kiểm ở chế độ dữ liệu mẫu).
       *
       * Khi có khoá thì cùng câu này đi qua model và cũng phải ra thẻ — nhờ cầu nối
       * `bridgeToolOutputsToDataParts`. Bước này vì thế đúng ở cả hai trường hợp.
       */
      await page.goto(`${BASE_URL}/hom-nay`)
      await page.fill('#ask-bar-input', 'sáng nay mình ăn phở bò và uống cà phê sữa đá')
      await page.click('[data-action="send"]')

      const list = page.getByTestId('message-list')
      await list.getByText('Phở bò').first().waitFor({ timeout: 30_000 })
      await list.getByText('kcal').first().waitFor({ timeout: 10_000 })
      return 'có thẻ xác nhận bữa ăn kèm kcal'
    })

    /* ---------------------------------------------------------------------
     * Vòng PT: nâng vai trò → khách thật → dựng thực đơn → duyệt
     *
     * Đây là phần sản phẩm được bán, và là thứ chưa từng chạy qua giao diện.
     * ------------------------------------------------------------------- */

    if (userId === null) throw new Error('chưa có người dùng để nâng thành PT')

    // Khách thứ hai, tạo thẳng bằng service role để không phải chạy lại cả luồng magic link.
    await step('nâng tài khoản thành PT và cấp gói', async () => {
      const { error: roleError } = await service
        .from('profiles')
        .update({ role: 'pt' })
        .eq('id', userId)
      assert(roleError === null, roleError?.message)

      const today = new Date().toISOString().slice(0, 10)
      const { error } = await service.from('subscriptions').insert({
        owner_id: userId,
        tier: 'plus',
        status: 'active',
        price_vnd: 750_000,
        client_limit: 5,
        ai_turns_per_client: 600,
        current_period_start: today,
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      })
      assert(error === null, error?.message)
      return 'PT gói Plus, 5 khách'
    })

    /*
     * Trang tổng quan PT là bản thiết kế của Vy (xem e2e/pt-console.spec.ts): chưa hiện gói và
     * dải dữ liệu mẫu, nên kiểm bằng lời chào — phải là tên thật của PT, không phải "Coach Linh"
     * của dữ liệu mẫu.
     */
    await step('console PT dùng hồ sơ thật (chưa có khách)', async () => {
      const { data: profile } = await service
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
      await page.goto(`${BASE_URL}/pt`)
      await page.getByText(`Hello ${profile.full_name}`).waitFor({ timeout: 10_000 })
      const demoName = await page.getByText('Coach Linh').count()
      assert(demoName === 0, 'vẫn hiện "Coach Linh" của dữ liệu mẫu')
      return `chào ${profile.full_name}`
    })

    await step('liên kết một khách và thấy khách đó trong console', async () => {
      const { data: created, error: createError } = await service.auth.admin.createUser({
        email: `khach-${Date.now()}@example.com`,
        password: `Khach-${Date.now()}-aA1!`,
        email_confirm: true,
      })
      assert(createError === null, createError?.message)
      clientId = created.user?.id ?? null
      assert(clientId !== null, 'không tạo được khách')

      // Hồ sơ sức khoẻ tối thiểu, để `readClientTargets` có gì mà đọc.
      await service.from('profiles').update({ full_name: 'Khách Kiểm Chứng' }).eq('id', clientId)
      const { error: healthError } = await service.from('health_profiles').insert({
        user_id: clientId,
        sex: 'female',
        date_of_birth: '1996-09-18',
        height_cm: 160,
        activity_level: 'light',
        goal: 'lose',
        rate_kg_per_week: 0.35,
      })
      assert(healthError === null, healthError?.message)
      await service.from('body_metrics').insert({
        user_id: clientId,
        measured_on: new Date().toISOString().slice(0, 10),
        weight_kg: 58,
      })

      const { error: linkError } = await service
        .from('pt_clients')
        .insert({ pt_id: userId, client_id: clientId, status: 'active' })
      assert(linkError === null, linkError?.message)

      await page.goto(`${BASE_URL}/pt`)
      await page.getByText('Khách Kiểm Chứng').first().waitFor({ timeout: 10_000 })
      return 'khách hiện trong danh sách'
    })

    await step('PT dựng thực đơn cho khách qua giao diện', async () => {
      assert(clientId !== null, 'chưa có khách')
      await page.goto(`${BASE_URL}/pt/khach/${clientId}`)
      await page.getByRole('button', { name: /Dựng thực đơn tuần này/ }).click()
      await page.getByText(/Đã dựng thực đơn nháp/).waitFor({ timeout: 20_000 })
      return 'đã dựng bản nháp'
    })

    await step('thực đơn nháp hiện trong hàng đợi duyệt', async () => {
      await page.goto(`${BASE_URL}/pt/duyet`)
      await page.getByText('Khách Kiểm Chứng').first().waitFor({ timeout: 10_000 })
      return 'có trong hàng đợi'
    })

    await step('PT duyệt thực đơn qua giao diện', async () => {
      await page.getByRole('button', { name: 'Duyệt thực đơn' }).first().click()
      await page.getByText(/Đã duyệt\. Khách thấy thực đơn này/).waitFor({ timeout: 20_000 })
      return 'đã duyệt'
    })

    await step('thực đơn trong CSDL đã thành active', async () => {
      assert(clientId !== null, 'chưa có khách')
      const { data: plans, error } = await service
        .from('plans')
        .select('id, status, accepted_at')
        .eq('user_id', clientId)
      assert(error === null, error?.message)
      const plan = (plans ?? [])[0]
      assert(plan !== undefined, 'không có thực đơn nào')
      assert(plan.status === 'active', `trạng thái phải là active, đang ${plan.status}`)
      assert(plan.accepted_at !== null, 'thiếu mốc duyệt')

      const { count } = await service
        .from('plan_items')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', plan.id)
      assert((count ?? 0) > 0, 'thực đơn không có món nào')
      return `active, ${count} món`
    })

    passwordUserId = await passwordFlow(browser, service)
  } finally {
    await browser.close()
    if (passwordUserId !== null) await service.auth.admin.deleteUser(passwordUserId)
    if (clientId !== null) await service.auth.admin.deleteUser(clientId)
    if (userId !== null) {
      await service.auth.admin.deleteUser(userId)
      console.log('─'.repeat(64))
      console.log('Đã xoá người dùng tạm và khách tạm.')
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
