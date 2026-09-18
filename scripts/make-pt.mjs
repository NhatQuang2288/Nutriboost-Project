#!/usr/bin/env node
/**
 * Nâng một tài khoản thành PT và cấp gói — dùng cho máy phát triển.
 *
 * Vì sao cần: console PT chỉ mở cho vai trò `pt`, mà **chưa có giao diện nào để nâng vai trò**
 * và cũng chưa có cổng thanh toán. Không có công cụ này thì không cách nào chạy thử được phần
 * sản phẩm được bán — phải mở Studio rồi gõ SQL tay.
 *
 * Đây KHÔNG phải tính năng sản phẩm. Vai trò và gói gắn với tiền, nên việc cấp chúng phải do
 * người vận hành làm sau khi thanh toán xác nhận. Tệp này chỉ để dựng cảnh thử.
 *
 *   npm run make:pt -- ban@example.com
 *   npm run make:pt -- ban@example.com diamond 20
 *
 * Chạy `npm run make:pt` không tham số để xem danh sách tài khoản hiện có.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Giá và hạn mức theo docs/PRICING.md. Không lấy từ `TIER_CONFIG` vì tệp đó là mã ứng dụng. */
const TIERS = {
  trial: { priceVnd: 0, clientLimit: 2, aiTurns: 100 },
  plus: { priceVnd: 750_000, clientLimit: 5, aiTurns: 600 },
  premium: { priceVnd: 1_125_000, clientLimit: 10, aiTurns: 600 },
  diamond: { priceVnd: 1_800_000, clientLimit: 20, aiTurns: 600 },
}

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

function usage(client, accounts) {
  console.log('Nâng một tài khoản thành PT và cấp gói.')
  console.log('')
  console.log('  npm run make:pt -- <email> [tier] [clientLimit]')
  console.log('')
  console.log('  tier: trial | plus | premium | diamond   (mặc định: plus)')
  console.log('')
  if (accounts.length === 0) {
    console.log('Chưa có tài khoản nào. Đăng nhập một lần trong ứng dụng trước.')
    return
  }
  console.log('Tài khoản hiện có:')
  for (const account of accounts) {
    const sub = account.subscription
    const detail =
      sub === null ? 'chưa có gói' : `gói ${sub.tier} (${sub.client_limit} khách, ${sub.status})`
    console.log(`  ${account.role.padEnd(6)} ${account.email ?? '(không email)'}  — ${detail}`)
  }
}

async function main() {
  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [email, tierArg = 'plus', limitArg] = process.argv.slice(2)

  // Không có email: liệt kê tài khoản để người dùng biết gõ gì.
  if (email === undefined) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, role, full_name')
      .order('created_at', { ascending: false })
      .limit(20)
    const { data: subscriptions } = await service
      .from('subscriptions')
      .select('owner_id, tier, client_limit, status')

    const byOwner = new Map((subscriptions ?? []).map((row) => [row.owner_id, row]))
    const accounts = []
    for (const profile of profiles ?? []) {
      const { data: user } = await service.auth.admin.getUserById(profile.id)
      accounts.push({
        role: profile.role,
        email: user?.user?.email ?? null,
        subscription: byOwner.get(profile.id) ?? null,
      })
    }

    usage(service, accounts)
    return
  }

  const tier = TIERS[tierArg]
  if (tier === undefined) {
    console.error(
      `Gói "${tierArg}" không tồn tại. Chọn một trong: ${Object.keys(TIERS).join(', ')}`,
    )
    process.exit(1)
  }

  const clientLimit = limitArg === undefined ? tier.clientLimit : Number(limitArg)
  if (!Number.isInteger(clientLimit) || clientLimit <= 0) {
    console.error(`Hạn mức khách "${limitArg}" không hợp lệ — phải là số nguyên dương.`)
    process.exit(1)
  }

  // Tìm người dùng theo email. `listUsers` phân trang; với CSDL phát triển thì một trang là đủ.
  const { data: list, error: listError } = await service.auth.admin.listUsers({ perPage: 200 })
  if (listError !== null) {
    console.error(`Không đọc được danh sách người dùng: ${listError.message}`)
    process.exit(1)
  }

  const target = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  if (target === undefined) {
    console.error(`Không tìm thấy tài khoản "${email}".`)
    console.error('Tài khoản được tạo ở lần đăng nhập đầu tiên — vào ứng dụng đăng nhập trước.')
    process.exit(1)
  }

  const { error: roleError } = await service
    .from('profiles')
    .update({ role: 'pt' })
    .eq('id', target.id)
  if (roleError !== null) {
    console.error(`Không nâng được vai trò: ${roleError.message}`)
    process.exit(1)
  }

  /*
   * Gói cũ (nếu có) phải hết hiệu lực trước khi thêm gói mới: `active_subscription` lấy hàng
   * có `current_period_end` xa nhất, nên để hai gói cùng sống thì gói mới không chắc thắng.
   */
  const today = new Date().toISOString().slice(0, 10)
  await service
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      current_period_end: today,
    })
    .eq('owner_id', target.id)
    .in('status', ['trialing', 'active', 'past_due'])

  const { error: subError } = await service.from('subscriptions').insert({
    owner_id: target.id,
    tier: tierArg,
    status: 'active',
    price_vnd: tier.priceVnd,
    client_limit: clientLimit,
    ai_turns_per_client: tier.aiTurns,
    current_period_start: today,
    current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  })
  if (subError !== null) {
    console.error(`Không tạo được gói: ${subError.message}`)
    process.exit(1)
  }

  console.log(`Đã nâng ${email} thành PT.`)
  console.log(`  Gói         ${tierArg} — ${clientLimit} khách, ${tier.aiTurns} lượt AI mỗi khách`)
  console.log(`  Giá         ${tier.priceVnd.toLocaleString('vi-VN')}đ/tháng`)
  console.log('')
  console.log('Mở http://localhost:3000/pt và tải lại trang.')
}

await main()
