import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, ChevronRightIcon, ClockIcon, InfoIcon, UserIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { CLIENT_STATUS_LABELS, formatVnd, getPtOverview, type ClientStatus } from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Tổng quan' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

export default async function PtOverviewPage() {
  const overview = await getPtOverview()
  const { subscription, clients, approvals } = overview

  const attention = clients.filter((client) => client.needsAttention !== null)

  const slotsUsedRatio =
    subscription === null || subscription.clientLimit === 0
      ? 0
      : subscription.usedSlots / subscription.clientLimit

  return (
    <div className="flex flex-col gap-6">
      {/* Dữ liệu mẫu */}
      {overview.source === 'demo' ? (
        <p className="border-info/30 bg-info-surface text-info-text text-caption rounded-xl border px-4 py-3">
          Đang hiện dữ liệu mẫu. Tài khoản này chưa phải tài khoản PT nên danh sách khách hàng dưới
          đây không phải của bạn.
        </p>
      ) : null}

      {/* ==================== HEADER ==================== */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-ink-muted mb-1">Tổng quan hoạt động</p>

            <h1 className="text-h1">Xin chào, {overview.ptName} 👋</h1>

            <p className="text-caption text-ink-muted mt-1">
              Tuần bắt đầu {overview.weekStart} · Cập nhật tình hình khách hàng
            </p>
          </div>

          {subscription === null ? (
            <span className="text-warning-text text-caption bg-warning-surface rounded-full px-3 py-1.5">
              Chưa có gói đang hiệu lực
            </span>
          ) : (
            <span className="text-accent-text text-caption rounded-full bg-olive-100 px-3 py-1.5">
              Gói {subscription.label} · {formatVnd(subscription.priceVnd)}/tháng
            </span>
          )}
        </div>

        {/* ==================== KPI ==================== */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border-line-subtle bg-surface rounded-2xl border p-4 shadow-sm">
            <p className="text-caption text-ink-muted">Khách hàng</p>

            <p className="text-display text-ink mt-1 tabular-nums">{clients.length}</p>

            <p className="text-micro text-ink-faint mt-1">đang theo dõi</p>
          </div>

          <div className="border-line-subtle bg-surface rounded-2xl border p-4 shadow-sm">
            <p className="text-caption text-ink-muted">Cần chú ý</p>

            <p className="text-display text-ink mt-1 tabular-nums">{attention.length}</p>

            <p className="text-micro text-warning-text mt-1">khách cần theo dõi</p>
          </div>

          <div className="border-line-subtle bg-surface rounded-2xl border p-4 shadow-sm">
            <p className="text-caption text-ink-muted">Chờ duyệt</p>

            <p className="text-display text-ink mt-1 tabular-nums">{approvals.length}</p>

            <p className="text-micro text-ink-faint mt-1">thực đơn</p>
          </div>

          <div className="border-line-subtle bg-surface rounded-2xl border p-4 shadow-sm">
            <p className="text-caption text-ink-muted">Còn nhận</p>

            <p className="text-display text-ink mt-1 tabular-nums">{overview.slotsLeft}</p>

            <p className="text-micro text-ink-faint mt-1">khách hàng</p>
          </div>
        </div>
      </header>

      {/* ==================== GÓI DỊCH VỤ ==================== */}
      {subscription === null ? (
        <Card className="border-warning/30 bg-warning-surface rounded-2xl">
          <SectionTitle>Chưa có gói đang hiệu lực</SectionTitle>

          <p className="text-caption text-warning-text">
            Số khách tối đa là thứ phân hạng ba gói, và nó là điều kiện để mời khách. Chưa có gói
            thì mã mời tạo ra vẫn hiện, nhưng khách nhập vào sẽ bị từ chối.
          </p>

          <Link
            href="/pt/goi"
            className="bg-forest-600 text-ink-inverse text-label mt-4 flex min-h-11 items-center justify-center rounded-xl px-5 font-semibold transition-colors duration-(--duration-fast)"
          >
            Xem ba gói dịch vụ
          </Link>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-olive-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-caption text-ink-muted">Gói hiện tại</p>

              <h2 className="text-h2 text-ink mt-1 font-bold">{subscription.label}</h2>

              <p className="text-caption text-ink-muted mt-1">Gia hạn: {subscription.renewsOn}</p>
            </div>

            <div className="text-right">
              <p className="text-caption text-ink-muted">Khách hàng</p>

              <p className="text-display text-ink font-bold tabular-nums">
                {subscription.usedSlots}
                <span className="text-ink-faint">/{subscription.clientLimit}</span>
              </p>
            </div>
          </div>

          {/* Thanh sử dụng */}
          <div className="mt-5">
            <div
              className="h-3 overflow-hidden rounded-full bg-neutral-200"
              role="progressbar"
              aria-label="Chỗ khách hàng đã dùng"
              aria-valuemin={0}
              aria-valuemax={subscription.clientLimit}
              aria-valuenow={subscription.usedSlots}
            >
              <div
                className={`h-full rounded-full ${
                  slotsUsedRatio >= 1 ? 'bg-warning' : 'bg-olive-500'
                }`}
                style={{
                  width: `${Math.min(100, slotsUsedRatio * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Thông số gói */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-olive-50 p-3">
              <p className="text-micro text-ink-muted">Còn nhận</p>

              <p className="text-h3 text-ink mt-1 font-bold">{overview.slotsLeft}</p>

              <p className="text-micro text-ink-faint">khách hàng</p>
            </div>

            <div className="rounded-xl bg-olive-50 p-3">
              <p className="text-micro text-ink-muted">AI / khách</p>

              <p className="text-h3 text-ink mt-1 font-bold">{subscription.aiTurnsPerClient}</p>

              <p className="text-micro text-ink-faint">lượt / tháng</p>
            </div>

            <div className="rounded-xl bg-olive-50 p-3">
              <p className="text-micro text-ink-muted">Chi phí</p>

              <p className="text-h3 text-ink mt-1 font-bold">{formatVnd(subscription.priceVnd)}</p>

              <p className="text-micro text-ink-faint">mỗi tháng</p>
            </div>
          </div>

          {overview.slotsLeft === 0 ? (
            <Link
              href="/pt/goi"
              className="bg-forest-600 text-ink-inverse text-label mt-4 flex min-h-11 items-center justify-center rounded-xl px-5 font-semibold transition-colors duration-(--duration-fast)"
            >
              Đã đầy chỗ — xem gói lớn hơn
            </Link>
          ) : null}
        </Card>
      )}

      {/* ==================== CẦN CHÚ Ý ==================== */}
      {attention.length > 0 ? (
        <section>
          <SectionTitle>Cần chú ý hôm nay</SectionTitle>

          <div className="mt-3 flex flex-col gap-3">
            {attention.map((client) => (
              <Card key={client.id} className="border-warning/30 bg-warning-surface rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="text-warning-text mt-0.5 shrink-0">
                    <InfoIcon size={18} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-body text-ink font-semibold">{client.name}</p>

                    <p className="text-caption text-warning-text mt-0.5">{client.needsAttention}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ==================== THỰC ĐƠN CHỜ DUYỆT ==================== */}
      {approvals.length > 0 ? (
        <Card className="rounded-2xl border-olive-200 bg-olive-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-accent-text mt-0.5 shrink-0">
                <BoIcon size={20} />
              </span>

              <div>
                <p className="text-body text-ink font-semibold">
                  {approvals.length} thực đơn đang chờ bạn duyệt
                </p>

                <p className="text-caption text-ink-muted mt-0.5">
                  Bơ dựng xong, bạn xem qua rồi duyệt hoặc chỉnh lại.
                </p>
              </div>
            </div>

            <Link
              href="/pt/duyet"
              className="text-accent-text text-label flex items-center gap-1 font-semibold"
            >
              Xem và duyệt
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </Card>
      ) : null}

      {/* ==================== KHÁCH HÀNG ==================== */}
      <section>
        <SectionTitle
          action={<span className="text-caption text-ink-faint">{clients.length} khách</span>}
        >
          Khách hàng
        </SectionTitle>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/pt/khach/${client.id}`}
              className="border-line-subtle bg-surface flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-(--duration-fast) hover:border-olive-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-surface-sunken text-ink-muted flex size-11 shrink-0 items-center justify-center rounded-full">
                  <UserIcon size={18} />
                </span>

                <div className="min-w-0">
                  <p className="text-body text-ink truncate font-semibold">{client.name}</p>

                  <p className="text-caption text-ink-muted">
                    {GOAL_LABELS[client.goal]} · tuân thủ {client.adherencePct}%
                    {client.weightDeltaKg === 0
                      ? ''
                      : ` · ${client.weightDeltaKg > 0 ? '+' : ''}${client.weightDeltaKg} kg`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusChip status={client.status} />

                <span className="text-micro text-ink-faint flex items-center gap-1">
                  <ClockIcon size={11} />
                  {client.lastActiveLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  )
}

const STATUS_TONES: Readonly<Record<ClientStatus, string>> = {
  active: 'bg-olive-100 text-accent-text',
  at_risk: 'bg-warning-surface text-warning-text',
  onboarding: 'bg-surface-sunken text-ink-muted',
  paused: 'bg-surface-sunken text-ink-faint',
}

function StatusChip({ status }: { status: ClientStatus }) {
  return (
    <span className={`text-micro rounded-full px-2.5 py-1 ${STATUS_TONES[status]}`}>
      {CLIENT_STATUS_LABELS[status]}
    </span>
  )
}
