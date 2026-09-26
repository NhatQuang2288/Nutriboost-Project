import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, ChevronRightIcon, InfoIcon } from '@/components/icons'
import { Disclaimer } from '@/components/ui'

import {
  CLIENT_STATUS_LABELS,
  formatVnd,
  getPtOverview,
  type ClientStatus,
  type PtOverview,
} from '@/lib/data/pt'

export const metadata: Metadata = {
  title: 'Tổng quan',
}

export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

export default async function PtOverviewPage() {
  const overview = await getPtOverview()

  const { clients } = overview

  return (
    <div className="min-h-full bg-[#f7f9f5] pb-10">
      {overview.source === 'demo' ? (
        /*
         * Nói thẳng đây là dữ liệu mẫu. Không có dòng này thì một tài khoản không phải PT vẫn
         * thấy "Coach Linh" kèm năm khách hàng như thể đó là console của họ.
         */
        <p className="border-info/30 bg-info-surface text-info-text text-caption mb-4 rounded-2xl border px-4 py-3">
          Đang hiện dữ liệu mẫu. Tài khoản này chưa phải tài khoản PT nên danh sách khách hàng dưới
          đây không phải của bạn.
        </p>
      ) : null}

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="mb-5">
        <div>
          <h1 className="text-[23px] leading-tight font-medium tracking-[-0.03em] text-[#202f25]">
            Xin chào {overview.ptName}
            <span className="ml-1">🌱</span>
          </h1>

          <p className="mt-1 text-[11px] text-[#899088]">
            Tuần bắt đầu {overview.weekStart} · {clients.length} khách hàng đang theo
          </p>
        </div>
      </header>

      {/* =========================================================
          MAIN DASHBOARD
      ========================================================= */}

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[1.05fr_0.82fr]">
        {/* =======================================================
            LEFT COLUMN
        ======================================================= */}

        <div className="grid gap-3.5">
          {/* =====================================================
              HERO
          ===================================================== */}

          <div className="relative min-h-[225px] overflow-hidden rounded-[23px] bg-[#dff0bd] p-5">
            <div className="absolute inset-0 bg-gradient-to-r from-[#dff0bd] via-[#dff0bd]/70 to-transparent" />
            <Image
              src="/images/pt/pt-hero.jpg"
              alt=""
              fill
              className="object-cover object-center"
            />
            <div className="absolute -bottom-16 -left-12 size-40 rounded-full border-[18px] border-[#c8e39b]/60" />

            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-[#edf7d9]/60" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-1 items-center">
                <div>
                  <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-[#66775d] uppercase">
                    Lối sống lành mạnh
                  </p>

                  <p className="max-w-[290px] text-[27px] leading-[1.15] font-bold tracking-[-0.04em] text-[#263d29]">
                    Sức khoẻ không phải đích đến.
                    <br />
                    Đó là cách sống.
                  </p>

                  <p className="mt-3 max-w-[240px] text-[11px] leading-relaxed text-[#65735f]">
                    Thói quen nhỏ hôm nay làm nên ngày mai khoẻ hơn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              GÓI VÀ CHỖ KHÁCH HÀNG
          ===================================================== */}

          <SubscriptionCard overview={overview} />
        </div>

        {/* =======================================================
            RIGHT COLUMN — VIỆC CẦN LÀM HÔM NAY
        ======================================================= */}

        <TodayCard overview={overview} />
      </div>

      {/* =========================================================
          CUSTOMER LIST
      ========================================================= */}

      {clients.length > 0 && (
        <section className="mt-6">
          {/* SECTION HEADER */}

          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.08em] text-[#7d867b] uppercase">
                Quản lý khách hàng
              </p>

              <h2 className="mt-1 text-[19px] font-medium tracking-[-0.02em] text-[#354139]">
                Khách hàng của bạn
              </h2>
            </div>

            <span className="text-[10px] text-[#91978f]">{clients.length} khách</span>
          </div>

          {/* CUSTOMER LIST */}

          <div className="overflow-hidden rounded-[20px] border border-[#e8ebe4] bg-white shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
            {clients.map((client, index) => (
              <Link
                key={client.id}
                href={`/pt/khach/${client.id}`}
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f8faf5] ${
                  index !== clients.length - 1 ? 'border-b border-[#eef0eb]' : ''
                }`}
              >
                {/* AVATAR */}

                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0d4] text-[12px] font-semibold text-[#66803e]">
                  {client.name.charAt(0)}
                </div>

                {/* NAME + GOAL */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#354139]">{client.name}</p>

                  <p className="mt-0.5 text-[9px] text-[#90978e]">
                    {GOAL_LABELS[client.goal]}
                    <span className="mx-1">·</span>
                    {client.adherencePct}% tuân thủ
                  </p>
                </div>

                {/* STATUS */}

                <StatusChip status={client.status} />

                {/* ARROW */}

                <ChevronRightIcon
                  size={14}
                  className="shrink-0 text-[#a1a79f] transition-transform group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          DISCLAIMER
      ========================================================= */}

      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  )
}

/* ================================================================
   GÓI VÀ CHỖ KHÁCH HÀNG
================================================================ */

/**
 * Hạn mức khách hàng là thứ phân hạng ba gói, nên nó phải nằm ở chỗ dễ thấy nhất.
 *
 * Chưa có gói là trạng thái có thật: `subscriptions` chỉ được ghi bởi khoá service role sau khi
 * cổng thanh toán xác nhận. Hiển thị "Gói Plus · 750.000đ/tháng" cho người chưa mua là nói dối
 * về thứ họ chưa có.
 */
function SubscriptionCard({ overview }: { overview: PtOverview }) {
  const { subscription } = overview

  if (subscription === null) {
    return (
      <div className="rounded-[23px] border border-[#f2e7c5] bg-[#fff8e7] p-5">
        <p className="text-[10px] font-medium tracking-[0.08em] text-[#8f8461] uppercase">
          Gói dịch vụ
        </p>
        <h2 className="mt-1 text-[16px] font-medium text-[#665b37]">Chưa có gói đang hiệu lực</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-[#8f7a45]">
          Số khách tối đa là thứ phân hạng ba gói, và nó là điều kiện để mời khách. Chưa có gói thì
          mã mời tạo ra vẫn hiện, nhưng khách nhập vào sẽ bị từ chối.
        </p>
        <Link
          href="/pt/goi"
          className="bg-forest-600 hover:bg-forest-700 mt-4 flex min-h-11 items-center justify-center rounded-xl px-5 text-[13px] font-semibold text-white transition-colors"
        >
          Xem ba gói dịch vụ
        </Link>
      </div>
    )
  }

  const usedRatio =
    subscription.clientLimit === 0 ? 0 : subscription.usedSlots / subscription.clientLimit

  return (
    <div className="rounded-[23px] border border-[#e8ebe4] bg-white p-5 shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.08em] text-[#929990] uppercase">
            Gói dịch vụ
          </p>
          <h2 className="mt-1 text-[16px] font-medium text-[#354139]">Chỗ khách hàng</h2>
        </div>

        <span className="rounded-full bg-[#eef4df] px-3 py-1 text-[11px] font-medium text-[#718942]">
          Gói {subscription.label} · {formatVnd(subscription.priceVnd)}/tháng
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-[15px] bg-[#f1f6e8] p-3">
          <p className="text-[11px] text-[#7e887b]">Chỗ đã dùng</p>
          <p className="mt-1 text-[20px] font-semibold text-[#465541] tabular-nums">
            {subscription.usedSlots}
            <span className="text-[14px] text-[#9aa097]">/{subscription.clientLimit}</span>
          </p>
        </div>

        <div className="rounded-[15px] bg-[#f3f4f1] p-3">
          <p className="text-[11px] text-[#858c85]">Còn nhận được</p>
          <p className="mt-1 text-[20px] font-semibold text-[#5d655e] tabular-nums">
            {overview.slotsLeft} khách
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-[6px] overflow-hidden rounded-full bg-[#edf0e9]"
        role="progressbar"
        aria-label="Chỗ khách hàng đã dùng"
        aria-valuemin={0}
        aria-valuemax={subscription.clientLimit}
        aria-valuenow={subscription.usedSlots}
      >
        <div
          className={`h-full rounded-full ${usedRatio >= 1 ? 'bg-[#d9b64c]' : 'bg-[#91ad57]'}`}
          style={{ width: `${Math.min(100, usedRatio * 100)}%` }}
        />
      </div>

      <p className="mt-3 border-t border-[#eef0eb] pt-3 text-[11px] text-[#9aa097]">
        Mỗi khách được {subscription.aiTurnsPerClient} lượt trợ lý mỗi tháng · gia hạn{' '}
        {subscription.renewsOn}
      </p>

      {overview.slotsLeft === 0 ? (
        <Link
          href="/pt/goi"
          className="bg-forest-600 hover:bg-forest-700 mt-3 flex min-h-11 items-center justify-center rounded-xl px-5 text-[13px] font-semibold text-white transition-colors"
        >
          Đã đầy chỗ — xem gói lớn hơn
        </Link>
      ) : null}
    </div>
  )
}

/* ================================================================
   VIỆC CẦN LÀM HÔM NAY
================================================================ */

/**
 * Mọi con số ở đây đến từ `getPtOverview`, không viết cứng trong trang.
 *
 * Bản trước của khối này là một lịch làm việc với giờ hẹn, ngày tháng và số liệu gõ tay
 * ("8 đã check-in", "Nguyễn A lúc 17:30"). Với dữ liệu mẫu thì vô hại; với một PT thật thì
 * đó là nói sai về công việc của họ.
 */
function TodayCard({ overview }: { overview: PtOverview }) {
  const { clients, approvals } = overview
  const attention = clients.filter((client) => client.needsAttention !== null)

  const activeCount = clients.filter((client) => client.status === 'active').length
  const atRiskCount = clients.filter((client) => client.status === 'at_risk').length
  const inactiveCount = clients.length - activeCount - atRiskCount

  return (
    <div className="flex flex-col rounded-[23px] border border-[#e8ebe4] bg-white p-5 shadow-[0_2px_8px_rgba(40,55,40,0.03)]">
      <p className="text-[10px] font-medium tracking-[0.1em] text-[#9aa097] uppercase">Hôm nay</p>
      <h2 className="mt-0.5 text-[16px] font-medium tracking-[-0.02em] text-[#303a32]">
        Việc cần làm
      </h2>

      {/* THỰC ĐƠN CHỜ DUYỆT */}

      {approvals.length > 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-[15px] border border-[#f2e7c5] bg-[#fff8e7] px-3 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0c9] text-[#a88428]">
            <BoIcon size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#465248]">
              {approvals.length} thực đơn đang chờ bạn duyệt
            </p>
            <p className="mt-0.5 text-[11px] text-[#8d968d]">
              Bơ dựng xong, bạn xem qua rồi duyệt hoặc chỉnh lại.
            </p>
          </div>

          <Link
            href="/pt/duyet"
            className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#718942] hover:text-[#4f6a2a]"
          >
            Xem và duyệt <ChevronRightIcon size={14} />
          </Link>
        </div>
      ) : (
        <p className="mt-4 rounded-[15px] bg-[#f1f7e7] px-3 py-3 text-[12px] text-[#66863b]">
          Không có thực đơn nào chờ duyệt.
        </p>
      )}

      {/* KHÁCH CẦN CHÚ Ý */}

      <h3 className="mt-5 text-[13px] font-semibold text-[#354139]">Cần chú ý hôm nay</h3>

      {attention.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {attention.map((client) => (
            <li key={client.id}>
              <Link
                href={`/pt/khach/${client.id}`}
                className="flex items-start gap-2.5 rounded-[15px] border border-[#f2e7c5] bg-[#fffbf0] px-3 py-2.5 transition-colors hover:bg-[#fff6dd]"
              >
                <span className="mt-0.5 shrink-0 text-[#a88428]">
                  <InfoIcon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-[#465248]">
                    {client.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#8f7a45]">
                    {client.needsAttention}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] text-[#8d968d]">Chưa có khách nào cần chú ý.</p>
      )}

      {/* TÌNH TRẠNG KHÁCH HÀNG */}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <StatusCount label={CLIENT_STATUS_LABELS.active} value={activeCount} tone="green" />
        <StatusCount label={CLIENT_STATUS_LABELS.at_risk} value={atRiskCount} tone="yellow" />
        <StatusCount label="Chưa hoạt động" value={inactiveCount} tone="gray" />
      </div>
    </div>
  )
}

function StatusCount({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'green' | 'yellow' | 'gray'
}) {
  const styles = {
    green: { card: 'bg-[#f1f7e7]', dot: 'bg-[#91bd55]', value: 'text-[#66863b]' },
    yellow: { card: 'bg-[#fff8e7]', dot: 'bg-[#d9b64c]', value: 'text-[#a88428]' },
    gray: { card: 'bg-[#f3f4f1]', dot: 'bg-[#aeb5ae]', value: 'text-[#5d655e]' },
  }[tone]

  return (
    <div className={`rounded-[14px] p-2.5 ${styles.card}`}>
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${styles.dot}`} />
        <span className={`text-[15px] font-semibold tabular-nums ${styles.value}`}>{value}</span>
      </div>
      <p className="mt-1 text-[10px] text-[#7e887b]">{label}</p>
    </div>
  )
}

/* ================================================================
   STATUS
================================================================ */

const STATUS_TONES: Readonly<Record<ClientStatus, string>> = {
  active: 'bg-[#e8f1d7] text-[#617d35]',

  at_risk: 'bg-[#fff0d7] text-[#a87524]',

  onboarding: 'bg-[#f0f1ed] text-[#777d74]',

  paused: 'bg-[#f0f1ed] text-[#92978e]',
}

function StatusChip({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[8px] font-medium whitespace-nowrap ${STATUS_TONES[status]}`}
    >
      {CLIENT_STATUS_LABELS[status]}
    </span>
  )
}
