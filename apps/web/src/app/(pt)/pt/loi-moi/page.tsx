import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { getInviteContext } from '@/lib/data/invites'

import { InviteManager } from './InviteManager'

export const metadata: Metadata = { title: 'Mời khách' }
export const dynamic = 'force-dynamic'

/**
 * Tab Mời khách của console PT.
 *
 * Đây là màn duy nhất trong console PT đọc dữ liệu thật. Phần còn lại (`/pt`, `/pt/duyet`,
 * `/pt/khach/…`) vẫn dựng từ dữ liệu mẫu, nên tab này nói rõ nguồn dữ liệu của nó.
 */
export default async function InvitePage() {
  const context = await getInviteContext()
  const origin = await readOrigin()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Mời khách</h1>
        <p className="text-caption text-ink-muted">
          Gửi mã cho khách. Khi họ nhập mã, họ trở thành khách hàng của bạn.
        </p>
      </header>

      <InviteManager context={context} origin={origin} />
    </div>
  )
}

/**
 * Gốc URL để dựng liên kết mời.
 *
 * Đọc từ header của request thay vì biến môi trường: máy phát triển chạy `localhost:3000`,
 * bản dựng thật chạy tên miền khác, và liên kết dán vào tin nhắn phải mở được đúng nơi
 * người gửi đang dùng.
 */
async function readOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}
