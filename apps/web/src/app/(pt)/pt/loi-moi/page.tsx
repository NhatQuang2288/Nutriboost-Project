import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { Card, Disclaimer } from '@/components/ui'
import { getInviteContext } from '@/lib/data/invites'

import { InviteManager } from './InviteManager'

export const metadata: Metadata = { title: 'Mời khách' }
export const dynamic = 'force-dynamic'

/**
 * Tab Mời khách của console PT.
 *
 * Phần dữ liệu và logic mời khách vẫn được giữ nguyên:
 * - getInviteContext()
 * - InviteManager
 * - readOrigin()
 *
 * Chỉ thay đổi phần bố cục giao diện bên ngoài để đồng bộ
 * với các màn hình PT khác.
 */
export default async function InvitePage() {
  const context = await getInviteContext()
  const origin = await readOrigin()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <p className="text-caption text-ink-muted mb-1">Quản lý khách hàng</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-h1">Mời khách</h1>

            <p className="text-caption text-ink-muted mt-1 max-w-2xl">
              Tạo mã mời để khách tham gia vào hệ thống và trở thành khách hàng của bạn.
            </p>
          </div>

          <span className="text-accent-text text-caption w-fit shrink-0 rounded-full bg-olive-100 px-3 py-1.5 font-semibold">
            Mời khách hàng
          </span>
        </div>
      </header>

      {/* Hướng dẫn nhanh */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoCard
          number="01"
          title="Tạo mã mời"
          description="Tạo mã dành riêng cho khách hàng bạn muốn kết nối."
        />

        <InfoCard
          number="02"
          title="Gửi mã cho khách"
          description="Gửi mã qua tin nhắn hoặc bất kỳ kênh liên lạc nào."
        />

        <InfoCard
          number="03"
          title="Khách nhập mã"
          description="Khi nhập mã thành công, khách sẽ được liên kết với bạn."
        />
      </section>

      {/* Khu vực mời khách */}
      <section>
        <div className="mb-3">
          <p className="text-caption text-ink-muted">Tạo và quản lý lời mời</p>

          <h2 className="text-h2 text-ink mt-0.5">Mã mời khách hàng</h2>
        </div>

        <Card className="rounded-3xl border border-olive-100 shadow-sm">
          <InviteManager context={context} origin={origin} />
        </Card>
      </section>

      {/* Giải thích */}
      <Card className="rounded-3xl border border-olive-100 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-accent-text flex size-10 shrink-0 items-center justify-center rounded-xl bg-olive-100">
            <InviteIcon />
          </span>

          <div className="min-w-0">
            <h2 className="text-h3 text-ink">Cách hoạt động</h2>

            <div className="text-body text-ink-muted mt-3 flex flex-col gap-3">
              <p>Mỗi mã mời được dùng để kết nối một khách hàng với tài khoản PT của bạn.</p>

              <p>
                Sau khi khách nhập mã thành công, thông tin kết nối sẽ được hệ thống ghi nhận để bạn
                có thể quản lý khách trong console PT.
              </p>

              <p>
                Bạn có thể gửi mã trực tiếp cho khách qua tin nhắn hoặc sao chép liên kết mời để
                chia sẻ.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

/**
 * Card hướng dẫn từng bước.
 */
function InfoCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <Card className="rounded-3xl border border-olive-100 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="bg-forest-600 flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white">
          {number}
        </span>

        <div className="min-w-0">
          <h3 className="text-caption text-ink font-semibold">{title}</h3>

          <p className="text-micro text-ink-muted mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  )
}

/**
 * Icon đơn giản cho khu vực giải thích.
 */
function InviteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 21V19C16 17.3431 14.6569 16 13 16H7C5.34315 16 4 17.3431 4 19V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10 12C12.2091 12 14 10.2091 14 8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8C6 10.2091 7.79086 12 10 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path d="M19 8V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

      <path d="M22 11H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Gốc URL để dựng liên kết mời.
 *
 * Đọc từ header của request thay vì biến môi trường: máy phát triển chạy
 * localhost:3000, bản dựng thật chạy tên miền khác.
 */
async function readOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'

  return `${proto}://${host}`
}
