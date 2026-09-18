import type { Metadata } from 'next'

import { CheckIcon, InfoIcon } from '@/components/icons'
import { Card, Disclaimer } from '@/components/ui'
import { formatVnd, getTierOffers } from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Gói dịch vụ' }
export const dynamic = 'force-dynamic'

/**
 * Tab Gói dịch vụ.
 *
 * Hiển thị đúng ba gói đang bán, kèm **hạn mức lượt AI mỗi khách mỗi tháng** — con số
 * mà bảng giá gốc chưa nêu, và là ràng buộc quyết định biên lợi nhuận (docs/PRICING.md §2).
 * Nói rõ ngay trên giao diện để tránh tranh chấp về sau.
 */
export default function TiersPage() {
  const offers = getTierOffers()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Gói dịch vụ</h1>
        <p className="text-caption text-ink-muted">
          Ba gói khác nhau ở số khách hàng tối đa. Mọi gói đều có đủ tính năng trợ lý AI.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        {offers.map((offer) => (
          <Card
            key={offer.tier}
            as="article"
            className={offer.current ? 'border-forest-600' : undefined}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-h2">{offer.label}</h2>
                <p className="text-caption text-ink-muted">Tối đa {offer.clientLimit} khách hàng</p>
              </div>
              {offer.current ? (
                <span className="bg-forest-600 text-ink-inverse text-micro rounded-full px-3 py-1">
                  GÓI HIỆN TẠI
                </span>
              ) : null}
            </div>

            <p className="text-display text-ink mb-1 tabular-nums">
              {formatVnd(offer.priceVnd)}
              <span className="text-h3 text-ink-faint">/tháng</span>
            </p>
            <p className="text-caption text-ink-muted mb-4">
              {formatVnd(offer.pricePerClient)} mỗi khách mỗi tháng
            </p>

            <ul className="border-line-subtle flex flex-col gap-2 border-t pt-4">
              <Feature>Thực đơn cá nhân hoá theo mục tiêu năng lượng</Feature>
              <Feature>Lịch tập dựng theo trình độ và chấn thương</Feature>
              <Feature>Nhắc nhở tự động, giới hạn 4 lần mỗi ngày</Feature>
              <Feature strong>{offer.aiTurnsPerClient} lượt trợ lý AI mỗi khách mỗi tháng</Feature>
              {offer.tier !== 'plus' ? (
                <Feature>Thương hiệu riêng trên ứng dụng khách</Feature>
              ) : null}
              {offer.tier === 'diamond' ? <Feature>Nhiều PT trong một tài khoản</Feature> : null}
            </ul>
          </Card>
        ))}
      </section>

      <Card className="border-info/30 bg-info-surface">
        <div className="flex gap-3">
          <span className="text-info-text mt-0.5 shrink-0">
            <InfoIcon size={18} />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-body text-info-text font-semibold">Vì sao có hạn mức lượt trợ lý</p>
            <p className="text-caption text-info-text">
              Hạn mức giữ cho chi phí vận hành ở mức {`<`} 20 % doanh thu của gói, nhờ đó giá không
              phải tăng khi một khách dùng nhiều. 600 lượt mỗi tháng tương đương khoảng 20 lượt mỗi
              ngày — đủ dùng thoải mái cho một người.
            </p>
            <p className="text-caption text-info-text">
              Khi khách gần chạm hạn mức, hệ thống báo trước cho cả bạn và khách. Việc dựng thực đơn
              và lịch tập không tính vào hạn mức này vì chúng chạy bằng công thức, không gọi AI.
            </p>
          </div>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Feature({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-accent-text mt-0.5 shrink-0">
        <CheckIcon size={15} />
      </span>
      <span
        className={`text-body ${strong === true ? 'text-ink font-semibold' : 'text-ink-muted'}`}
      >
        {children}
      </span>
    </li>
  )
}
