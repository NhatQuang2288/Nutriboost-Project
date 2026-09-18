import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, ChevronRightIcon, ClockIcon, InfoIcon, UserIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { CLIENT_STATUS_LABELS, formatVnd, getPtOverview, type ClientStatus } from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Tổng quan' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = { lose: 'Giảm cân', maintain: 'Giữ cân', gain: 'Tăng cân' } as const

export default function PtOverviewPage() {
  const overview = getPtOverview()
  const { subscription, clients, approvals } = overview

  const attention = clients.filter((client) => client.needsAttention !== null)
  const slotsUsedRatio = subscription.usedSlots / subscription.clientLimit

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Xin chào {overview.ptName}</h1>
          <p className="text-caption text-ink-muted">
            Tuần bắt đầu {overview.weekStart} · {clients.length} khách hàng đang theo
          </p>
        </div>

        <span className="text-accent-text text-caption rounded-full bg-olive-100 px-3 py-1.5">
          Gói {subscription.label} · {formatVnd(subscription.priceVnd)}/tháng
        </span>
      </header>

      {/* Hạn mức khách hàng là thứ phân hạng ba gói, nên nó phải nằm ở chỗ dễ thấy nhất. */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-caption text-ink-muted">Chỗ đã dùng</p>
            <p className="text-display text-ink tabular-nums">
              {subscription.usedSlots}
              <span className="text-h3 text-ink-faint">/{subscription.clientLimit}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption text-ink-muted">Còn nhận được</p>
            <p className="text-h2 text-ink tabular-nums">{overview.slotsLeft} khách</p>
          </div>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200"
          role="progressbar"
          aria-label="Chỗ khách hàng đã dùng"
          aria-valuemin={0}
          aria-valuemax={subscription.clientLimit}
          aria-valuenow={subscription.usedSlots}
        >
          <div
            className={`h-full rounded-full ${slotsUsedRatio >= 1 ? 'bg-warning' : 'bg-olive-500'}`}
            style={{ width: `${Math.min(100, slotsUsedRatio * 100)}%` }}
          />
        </div>

        <p className="text-caption text-ink-faint mt-2">
          Mỗi khách được {subscription.aiTurnsPerClient} lượt trợ lý mỗi tháng · gia hạn{' '}
          {subscription.renewsOn}
        </p>

        {overview.slotsLeft === 0 ? (
          <Link
            href="/pt/goi"
            className="bg-forest-600 text-ink-inverse text-label mt-3 flex min-h-11 items-center justify-center rounded-md px-5 font-semibold transition-colors duration-(--duration-fast)"
          >
            Đã đầy chỗ — xem gói lớn hơn
          </Link>
        ) : null}
      </Card>

      {attention.length > 0 ? (
        <section>
          <SectionTitle>Cần chú ý hôm nay</SectionTitle>
          <div className="flex flex-col gap-3">
            {attention.map((client) => (
              <Card key={client.id} className="border-warning/30 bg-warning-surface">
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

      {approvals.length > 0 ? (
        <Card className="border-olive-200 bg-olive-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
              Xem và duyệt <ChevronRightIcon size={16} />
            </Link>
          </div>
        </Card>
      ) : null}

      <section>
        <SectionTitle
          action={<span className="text-caption text-ink-faint">{clients.length} khách</span>}
        >
          Khách hàng
        </SectionTitle>

        <div className="flex flex-col gap-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/pt/khach/${client.id}`}
              className="border-line-subtle bg-surface flex items-center justify-between gap-3 rounded-lg border p-4 shadow-sm transition-colors duration-(--duration-fast) hover:border-olive-200"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-surface-sunken text-ink-muted flex size-10 shrink-0 items-center justify-center rounded-full">
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
