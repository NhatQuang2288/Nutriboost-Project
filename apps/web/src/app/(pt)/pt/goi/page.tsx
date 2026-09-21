import type { Metadata } from 'next'

import { CheckIcon, InfoIcon } from '@/components/icons'
import { Card, Disclaimer } from '@/components/ui'
import { formatVnd, getTierOffers } from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Gói dịch vụ' }
export const dynamic = 'force-dynamic'

/**
 * Tab Gói dịch vụ.
 *
 * Giữ nguyên toàn bộ logic và dữ liệu gói dịch vụ hiện tại.
 * Chỉ thay đổi cách trình bày giao diện.
 */
export default async function TiersPage() {
  const offers = await getTierOffers()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <p className="text-caption text-ink-muted mb-1">Quản lý gói PT</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-h1">Gói dịch vụ</h1>

            <p className="text-caption text-ink-muted mt-1 max-w-2xl">
              Chọn gói phù hợp với số lượng khách hàng và nhu cầu sử dụng trợ lý AI của bạn.
            </p>
          </div>

          <span className="text-accent-text text-caption w-fit shrink-0 rounded-full bg-olive-100 px-3 py-1.5 font-semibold">
            3 gói dịch vụ
          </span>
        </div>
      </header>

      {/* Tổng quan */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {offers.map((offer) => (
          <SummaryCard
            key={offer.tier}
            label={offer.label}
            clientLimit={offer.clientLimit}
            price={formatVnd(offer.priceVnd)}
            current={offer.current}
          />
        ))}
      </section>

      {/* Danh sách gói */}
      <section>
        <div className="mb-3">
          <p className="text-caption text-ink-muted">Chi tiết từng gói</p>

          <h2 className="text-h2 text-ink mt-0.5">Chọn gói theo quy mô khách hàng</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {offers.map((offer) => (
            <TierCard key={offer.tier} offer={offer} />
          ))}
        </div>
      </section>

      {/* Giải thích hạn mức AI */}
      <Card className="border-info/30 bg-info-surface rounded-3xl border shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-info-text mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/60">
            <InfoIcon size={18} />
          </span>

          <div className="min-w-0">
            <h2 className="text-h3 text-info-text">Vì sao có hạn mức lượt trợ lý AI?</h2>

            <div className="text-caption text-info-text mt-3 flex flex-col gap-3 leading-relaxed">
              <p>
                Hạn mức giữ cho chi phí vận hành ở mức {`<`} 20 % doanh thu của gói, nhờ đó giá
                không phải tăng khi một khách dùng nhiều.
              </p>

              <p>
                600 lượt mỗi tháng tương đương khoảng 20 lượt mỗi ngày — đủ dùng thoải mái cho một
                người.
              </p>

              <p>Khi khách gần chạm hạn mức, hệ thống báo trước cho cả bạn và khách.</p>

              <p>
                Việc dựng thực đơn và lịch tập không tính vào hạn mức này vì chúng chạy bằng công
                thức, không gọi AI.
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
 * Card tóm tắt nhanh một gói.
 */
function SummaryCard({
  label,
  clientLimit,
  price,
  current,
}: {
  label: string
  clientLimit: number
  price: string
  current: boolean
}) {
  return (
    <Card
      className={[
        'rounded-3xl border shadow-sm',
        current ? 'border-forest-600 bg-olive-50/50' : 'border-olive-100',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption text-ink-muted">{label}</p>

          <p className="text-h2 text-ink mt-1">
            {clientLimit}
            <span className="text-caption text-ink-muted ml-1 font-normal">khách</span>
          </p>
        </div>

        {current ? (
          <span className="bg-forest-600 text-micro shrink-0 rounded-full px-2.5 py-1 font-semibold text-white">
            Hiện tại
          </span>
        ) : null}
      </div>

      <div className="border-line-subtle mt-4 border-t pt-3">
        <p className="text-caption text-ink-muted">Từ</p>

        <p className="text-body text-ink mt-0.5 font-semibold">
          {price}
          <span className="text-micro text-ink-faint ml-1 font-normal">/tháng</span>
        </p>
      </div>
    </Card>
  )
}

/**
 * Card chi tiết của từng gói.
 *
 * Không thay đổi dữ liệu hoặc điều kiện hiển thị tính năng.
 */
function TierCard({ offer }: { offer: Awaited<ReturnType<typeof getTierOffers>>[number] }) {
  return (
    <Card
      as="article"
      className={[
        'relative flex h-full flex-col rounded-3xl shadow-sm',
        offer.current ? 'border-forest-600 border-2' : 'border border-olive-100',
      ].join(' ')}
    >
      {/* Badge gói hiện tại */}
      {offer.current ? (
        <div className="absolute top-5 right-5">
          <span className="bg-forest-600 text-micro rounded-full px-3 py-1.5 font-semibold text-white">
            GÓI HIỆN TẠI
          </span>
        </div>
      ) : null}

      {/* Tên gói */}
      <div className={offer.current ? 'pr-28' : ''}>
        <p className="text-caption text-ink-muted">Gói dịch vụ</p>

        <h2 className="text-h2 text-ink mt-1">{offer.label}</h2>

        <p className="text-caption text-ink-muted mt-1">Tối đa {offer.clientLimit} khách hàng</p>
      </div>

      {/* Giá */}
      <div className="mt-6">
        <p className="text-display text-ink tabular-nums">{formatVnd(offer.priceVnd)}</p>

        <p className="text-caption text-ink-muted mt-1">mỗi tháng</p>

        <div className="mt-4 rounded-2xl bg-olive-50 px-4 py-3">
          <p className="text-micro text-ink-faint">Chi phí trung bình</p>

          <p className="text-body text-forest-700 mt-0.5 font-semibold">
            {formatVnd(offer.pricePerClient)}
            <span className="text-micro text-ink-muted ml-1 font-normal">/khách/tháng</span>
          </p>
        </div>
      </div>

      {/* Tính năng */}
      <div className="border-line-subtle mt-6 flex-1 border-t pt-5">
        <p className="text-caption text-ink font-semibold">Bao gồm</p>

        <ul className="mt-3 flex flex-col gap-3">
          <Feature>Thực đơn cá nhân hoá theo mục tiêu năng lượng</Feature>

          <Feature>Lịch tập dựng theo trình độ và chấn thương</Feature>

          <Feature>Nhắc nhở tự động, giới hạn 4 lần mỗi ngày</Feature>

          <Feature strong>{offer.aiTurnsPerClient} lượt trợ lý AI mỗi khách mỗi tháng</Feature>

          {offer.tier !== 'plus' ? <Feature>Thương hiệu riêng trên ứng dụng khách</Feature> : null}

          {offer.tier === 'diamond' ? <Feature>Nhiều PT trong một tài khoản</Feature> : null}
        </ul>
      </div>

      {/* Footer card */}
      <div className="border-line-subtle mt-6 border-t pt-4">
        <p className="text-micro text-ink-faint">
          {offer.aiTurnsPerClient} lượt AI / khách / tháng
        </p>
      </div>
    </Card>
  )
}

function Feature({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="text-accent-text mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-olive-100">
        <CheckIcon size={13} />
      </span>

      <span
        className={[
          'text-body leading-relaxed',
          strong === true ? 'text-ink font-semibold' : 'text-ink-muted',
        ].join(' ')}
      >
        {children}
      </span>
    </li>
  )
}
