import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, CheckIcon, ChevronRightIcon, UserIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState, SectionTitle } from '@/components/ui'
import { getPtOverview } from '@/lib/data/pt'

import { ApprovalActions } from './ApprovalActions'

export const metadata: Metadata = { title: 'Duyệt thực đơn' }
export const dynamic = 'force-dynamic'

export default async function ApprovalQueuePage() {
  const { approvals } = await getPtOverview()

  const totalApprovals = approvals.length

  const onTargetCount = approvals.filter((approval) => approval.deviation <= 0.1).length

  const needsReviewCount = approvals.filter((approval) => approval.deviation > 0.1).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div>
          <p className="text-caption text-ink-muted mb-1">Quản lý thực đơn</p>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-h1">Duyệt thực đơn</h1>

              <p className="text-caption text-ink-muted mt-1">
                Kiểm tra thực đơn do Bơ dựng trước khi khách hàng nhìn thấy.
              </p>
            </div>

            <span className="text-accent-text text-caption shrink-0 rounded-full bg-olive-100 px-3 py-1.5 font-semibold">
              {totalApprovals} chờ duyệt
            </span>
          </div>
        </div>

        {totalApprovals > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi label="Chờ duyệt" value={totalApprovals} helper="thực đơn" />

            <Kpi
              label="Đang đúng mục tiêu"
              value={onTargetCount}
              helper="trong phạm vi kcal"
              tone="success"
            />

            <Kpi
              label="Cần xem lại"
              value={needsReviewCount}
              helper="lệch mục tiêu"
              tone={needsReviewCount > 0 ? 'warning' : 'normal'}
            />
          </div>
        ) : null}
      </header>

      {/* Empty */}
      {approvals.length === 0 ? (
        <EmptyState
          icon={<CheckIcon size={32} />}
          title="Không có thực đơn nào chờ duyệt"
          description="Khi Bơ dựng xong thực đơn cho một khách, nó sẽ xuất hiện ở đây để bạn duyệt trước khi khách nhìn thấy."
        />
      ) : (
        <section>
          <SectionTitle
            action={
              <span className="text-caption text-ink-faint">{approvals.length} thực đơn</span>
            }
          >
            Danh sách chờ duyệt
          </SectionTitle>

          <div className="mt-3 flex flex-col gap-4">
            {approvals.map((approval) => {
              const onTarget = approval.deviation <= 0.1

              return (
                <Card
                  key={approval.id}
                  as="article"
                  className="rounded-3xl border border-olive-100 shadow-sm"
                >
                  {/* Customer header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-forest-700 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-olive-100">
                        <UserIcon size={20} />
                      </span>

                      <div className="min-w-0">
                        <h3 className="text-h3 text-ink truncate">{approval.clientName}</h3>

                        <p className="text-caption text-ink-muted mt-0.5">
                          Thực đơn tuần {approval.weekStart}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/pt/khach/${approval.clientId}`}
                      className="text-accent-text hover:text-forest-700 text-caption flex w-fit items-center gap-1 font-semibold transition-colors"
                    >
                      Xem hồ sơ
                      <ChevronRightIcon size={15} />
                    </Link>
                  </div>

                  {/* Status */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'text-micro rounded-full px-2.5 py-1 font-semibold',
                        onTarget
                          ? 'text-accent-text bg-olive-100'
                          : 'bg-warning-surface text-warning-text',
                      ].join(' ')}
                    >
                      {onTarget ? 'Trong mục tiêu kcal' : 'Cần xem lại kcal'}
                    </span>

                    <span className="bg-surface-sunken text-ink-muted text-micro rounded-full px-2.5 py-1">
                      {approval.itemCount} bữa
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric
                      label="Trung bình"
                      value={`${approval.averageKcal.toLocaleString('vi-VN')} kcal`}
                    />

                    <Metric
                      label="Mục tiêu"
                      value={`${approval.targetKcal.toLocaleString('vi-VN')} kcal`}
                    />

                    <Metric
                      label="Lệch mục tiêu"
                      value={`${Math.round(approval.deviation * 100)}%`}
                      tone={onTarget ? 'success' : 'warning'}
                    />

                    <Metric label="Số bữa" value={`${approval.itemCount}`} />
                  </div>

                  {/* Notes */}
                  {approval.notes.length > 0 ? (
                    <div className="bg-warning-surface mt-4 rounded-2xl p-4">
                      <p className="text-caption text-warning-text font-semibold">
                        Lưu ý trước khi duyệt
                      </p>

                      <ul className="mt-2 flex flex-col gap-1.5">
                        {approval.notes.map((note) => (
                          <li key={note} className="text-caption text-warning-text flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Source */}
                  <div className="border-line-subtle text-ink-faint mt-4 flex items-center gap-2 border-t pt-4">
                    <BoIcon size={14} />

                    <p className="text-micro">
                      Dựng bằng công thức trong mã nguồn, không phải AI đoán
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4">
                    <ApprovalActions planId={approval.id} clientName={approval.clientName} />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Why approval */}
      <Card className="rounded-3xl border border-olive-100 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-accent-text flex size-10 shrink-0 items-center justify-center rounded-xl bg-olive-100">
            <CheckIcon size={18} />
          </span>

          <div className="min-w-0">
            <SectionTitle>Vì sao có bước duyệt?</SectionTitle>

            <ul className="text-body text-ink-muted mt-4 flex flex-col gap-3">
              <li className="flex gap-2">
                <span className="text-accent-text">•</span>
                <span>
                  Thực đơn ảnh hưởng trực tiếp tới khách hàng nên PT là người kiểm tra và quyết định
                  cuối cùng.
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-accent-text">•</span>
                <span>
                  Các con số trong thực đơn được tính bằng công thức trong mã nguồn và đã qua bộ
                  kiểm tra tính hợp lệ.
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-accent-text">•</span>
                <span>Thực đơn chưa được duyệt sẽ không hiển thị cho khách hàng.</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Kpi({
  label,
  value,
  helper,
  tone = 'normal',
}: {
  label: string
  value: number
  helper: string
  tone?: 'normal' | 'success' | 'warning'
}) {
  const valueClass =
    tone === 'warning' ? 'text-warning-text' : tone === 'success' ? 'text-accent-text' : 'text-ink'

  return (
    <div className="border-line-subtle bg-surface rounded-2xl border p-4 shadow-sm">
      <p className="text-caption text-ink-muted">{label}</p>

      <p className={`text-display mt-1 font-bold tabular-nums ${valueClass}`}>{value}</p>

      <p className="text-micro text-ink-faint mt-1">{helper}</p>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: string
  tone?: 'normal' | 'success' | 'warning'
}) {
  const valueClass =
    tone === 'warning' ? 'text-warning-text' : tone === 'success' ? 'text-accent-text' : 'text-ink'

  return (
    <div className="bg-surface-sunken rounded-2xl p-3">
      <p className="text-micro text-ink-muted">{label}</p>

      <p className={`text-body mt-1 font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
