import type { Metadata } from 'next'

import { CheckIcon, InfoIcon } from '@/components/icons'
import { Card, Disclaimer } from '@/components/ui'
import { formatVnd, getTierOffers } from '@/lib/data/pt'

export const metadata: Metadata = {
  title: 'Gói dịch vụ',
}

export const dynamic = 'force-dynamic'

export default async function TiersPage() {
  const offers = await getTierOffers()

  return (
    <div className="flex flex-col gap-7 pb-8">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="relative overflow-hidden rounded-[28px] border border-[#e5eadc] bg-white p-6 shadow-[0_4px_18px_rgba(50,70,45,0.05)] sm:p-7">
        {/* DECORATION */}

        <div className="absolute -top-14 -right-14 size-40 rounded-full bg-[#e9f5d7]" />

        <div className="absolute top-8 right-16 size-12 rounded-full bg-[#f5d98c]/50" />

        <div className="absolute -bottom-12 left-1/3 size-28 rounded-full bg-[#e5f1f7]/60" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* HEADER TEXT */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-[#e8f2d7] text-[13px]">
                  ✦
                </span>

                <p className="text-[9px] font-bold tracking-[0.12em] text-[#6c873f]">
                  QUẢN LÝ GÓI PT
                </p>
              </div>

              <h1 className="text-[28px] font-bold tracking-[-0.035em] text-[#29352d]">
                Gói dịch vụ
              </h1>

              <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-[#899188]">
                Chọn gói phù hợp với số lượng khách hàng và nhu cầu sử dụng trợ lý AI của bạn.
              </p>
            </div>

            {/* TOTAL */}

            <div className="flex w-fit items-center gap-2 rounded-full bg-[#eef5df] px-4 py-2.5">
              <span className="size-2 rounded-full bg-[#91bd55]" />

              <span className="text-[9px] font-bold text-[#617b39]">
                {offers.length} gói dịch vụ
              </span>
            </div>
          </div>

          {/* QUICK SUMMARY */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {offers.map((offer) => (
              <SummaryCard
                key={offer.tier}
                label={offer.label}
                clientLimit={offer.clientLimit}
                price={formatVnd(offer.priceVnd)}
                current={offer.current}
                tier={offer.tier}
              />
            ))}
          </div>
        </div>
      </header>

      {/* =========================================================
          PLANS
      ========================================================= */}

      <section>
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[9px] font-semibold tracking-[0.08em] text-[#9aa198] uppercase">
            Chi tiết từng gói
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[21px] font-bold tracking-[-0.025em] text-[#344139]">
              Chọn gói theo quy mô khách hàng
            </h2>

            <p className="text-[9px] text-[#a0a69d]">Có thể thay đổi theo nhu cầu sử dụng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {offers.map((offer) => (
            <TierCard key={offer.tier} offer={offer} />
          ))}
        </div>
      </section>

      {/* =========================================================
          AI LIMIT
      ========================================================= */}

      <Card className="overflow-hidden rounded-[26px] border border-[#e3ead7] bg-white shadow-[0_3px_14px_rgba(50,70,45,0.04)]">
        <div className="relative overflow-hidden bg-[#f2f7e9] p-5 sm:p-6">
          <div className="absolute -top-8 -right-8 size-28 rounded-full bg-[#e2efc8]" />

          <div className="absolute right-20 bottom-0 size-12 rounded-full bg-[#f7df9d]/60" />

          <div className="relative z-10 flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6e8e40] shadow-sm">
              <InfoIcon size={19} />
            </span>

            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-[0.1em] text-[#6e8e40] uppercase">
                Trợ lý Bơ AI
              </p>

              <h2 className="mt-1 text-[17px] font-bold text-[#354139]">
                Vì sao có hạn mức lượt trợ lý AI?
              </h2>

              <div className="mt-4 flex flex-col gap-3 text-[10px] leading-relaxed text-[#788278]">
                <p>
                  Hạn mức giữ cho chi phí vận hành ở mức {'<'} 20 % doanh thu của gói, nhờ đó giá
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
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

/* ================================================================
   SUMMARY CARD
================================================================ */

function SummaryCard({
  label,
  clientLimit,
  price,
  current,
  tier,
}: {
  label: string
  clientLimit: number
  price: string
  current: boolean
  tier: string
}) {
  const icon = tier === 'plus' ? '🌱' : tier === 'diamond' ? '💎' : '⭐'

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[20px] border p-4 transition-all duration-200',
        current
          ? 'border-[#b8d88b] bg-[#f1f7e7] shadow-[0_4px_12px_rgba(110,140,65,0.08)]'
          : 'border-[#e8ece4] bg-[#fafbf9] hover:border-[#cbdcb1] hover:bg-[#f5f9ed]',
      ].join(' ')}
    >
      {/* DECORATIVE CIRCLE */}
      {current ? (
        <div className="absolute -top-6 -right-6 size-20 rounded-full bg-[#dfedc5]" />
      ) : null}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={[
                'flex size-8 items-center justify-center rounded-xl text-[15px]',
                current ? 'bg-white' : 'bg-[#eef1ea]',
              ].join(' ')}
            >
              {icon}
            </span>

            <p className="text-[10px] font-semibold text-[#69736b]">{label}</p>
          </div>

          {current ? (
            <span className="rounded-full bg-[#66833b] px-2.5 py-1 text-[7px] font-bold text-white">
              HIỆN TẠI
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-[23px] font-bold tracking-[-0.03em] text-[#354139]">
          {clientLimit}

          <span className="ml-1 text-[9px] font-medium text-[#8c958c]">khách</span>
        </p>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[8px] text-[#9aa198]">Từ</span>

          <span className="text-[11px] font-bold text-[#56654d]">{price}</span>

          <span className="text-[7px] text-[#a0a69d]">/tháng</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TIER CARD
================================================================ */

function TierCard({ offer }: { offer: Awaited<ReturnType<typeof getTierOffers>>[number] }) {
  const theme =
    offer.tier === 'plus'
      ? {
          border: 'border-[#dce8c8]',
          bg: 'bg-[#fbfcf8]',
          icon: 'bg-[#e9f3d8] text-[#729145]',
          accent: 'bg-[#9bc565]',
          soft: 'bg-[#f0f6e5]',
          text: 'text-[#627d3c]',
        }
      : offer.tier === 'diamond'
        ? {
            border: 'border-[#d9e7ed]',
            bg: 'bg-[#fbfdfe]',
            icon: 'bg-[#e2f0f4] text-[#648f9a]',
            accent: 'bg-[#8db8c2]',
            soft: 'bg-[#eef7f8]',
            text: 'text-[#628b95]',
          }
        : {
            border: 'border-[#eee1bc]',
            bg: 'bg-[#fffdfa]',
            icon: 'bg-[#fff1c9] text-[#a1812e]',
            accent: 'bg-[#d5b64f]',
            soft: 'bg-[#fff8e7]',
            text: 'text-[#9a7b29]',
          }

  const icon = offer.tier === 'plus' ? '🌱' : offer.tier === 'diamond' ? '💎' : '⭐'

  return (
    <Card
      as="article"
      className={[
        'relative flex h-full flex-col overflow-hidden rounded-[26px] transition-all duration-200',
        offer.current
          ? `${theme.border} ${theme.bg} border-2 shadow-[0_7px_20px_rgba(70,90,60,0.09)]`
          : `border ${theme.border} ${theme.bg} shadow-[0_3px_12px_rgba(50,70,55,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(50,70,55,0.08)]`,
      ].join(' ')}
    >
      {/* TOP COLOR */}

      <div className={`h-1.5 w-full ${theme.accent}`} />

      <div className="flex h-full flex-col p-5 sm:p-6">
        {/* BADGE */}

        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[8px] font-bold ${theme.soft} ${theme.text}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            GÓI DỊCH VỤ
          </span>

          {offer.current ? (
            <span className="rounded-full bg-[#5e7d38] px-3 py-1.5 text-[7px] font-bold text-white">
              GÓI HIỆN TẠI
            </span>
          ) : null}
        </div>

        {/* TITLE */}

        <div className="mt-5 flex items-center gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-[21px] ${theme.icon}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.025em] text-[#354139]">
              {offer.label}
            </h2>

            <p className="mt-0.5 text-[9px] text-[#8b948b]">
              Tối đa {offer.clientLimit} khách hàng
            </p>
          </div>
        </div>

        {/* PRICE */}

        <div className="mt-6">
          <p className="text-[29px] font-bold tracking-[-0.04em] text-[#303c34]">
            {formatVnd(offer.priceVnd)}
          </p>

          <p className="mt-1 text-[9px] text-[#929a92]">mỗi tháng</p>
        </div>

        {/* PRICE PER CLIENT */}

        <div className={`mt-5 rounded-[18px] p-4 ${theme.soft}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[7px] font-medium text-[#9aa198]">CHI PHÍ TRUNG BÌNH</p>

              <p className={`mt-1 text-[13px] font-bold ${theme.text}`}>
                {formatVnd(offer.pricePerClient)}
              </p>
            </div>

            <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-medium text-[#8b948b]">
              / khách
            </span>
          </div>
        </div>

        {/* FEATURES */}

        <div className="mt-6 flex-1 border-t border-[#edf0ea] pt-5">
          <p className="text-[11px] font-bold text-[#465248]">Bao gồm</p>

          <ul className="mt-4 flex flex-col gap-3.5">
            <Feature>Thực đơn cá nhân hoá theo mục tiêu năng lượng</Feature>

            <Feature>Lịch tập dựng theo trình độ và chấn thương</Feature>

            <Feature>Nhắc nhở tự động, giới hạn 4 lần mỗi ngày</Feature>

            <Feature strong>{offer.aiTurnsPerClient} lượt trợ lý AI mỗi khách mỗi tháng</Feature>

            {offer.tier !== 'plus' ? (
              <Feature>Thương hiệu riêng trên ứng dụng khách</Feature>
            ) : null}

            {offer.tier === 'diamond' ? <Feature>Nhiều PT trong một tài khoản</Feature> : null}
          </ul>
        </div>

        {/* FOOTER */}

        <div className="mt-6 rounded-[18px] border border-[#e9ede5] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-8 items-center justify-center rounded-full ${theme.soft} ${theme.text}`}
            >
              <CheckIcon size={15} />
            </span>

            <div>
              <p className="text-[9px] font-bold text-[#465248]">Trợ lý AI</p>

              <p className="mt-0.5 text-[8px] text-[#9aa198]">
                {offer.aiTurnsPerClient} lượt / khách / tháng
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ================================================================
   FEATURE
================================================================ */

function Feature({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf2dc] text-[#6f8d42]">
        <CheckIcon size={13} />
      </span>

      <span
        className={[
          'text-[10px] leading-relaxed',
          strong ? 'font-bold text-[#46553f]' : 'text-[#788278]',
        ].join(' ')}
      >
        {children}
      </span>
    </li>
  )
}
