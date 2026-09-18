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

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Duyệt thực đơn</h1>
        <p className="text-caption text-ink-muted">
          Thực đơn do Bơ dựng sẵn. PT xem qua rồi duyệt hoặc yêu cầu chỉnh lại.
        </p>
      </header>

      {approvals.length === 0 ? (
        <EmptyState
          icon={<CheckIcon size={32} />}
          title="Không có thực đơn nào chờ duyệt"
          description="Khi Bơ dựng xong thực đơn cho một khách, nó sẽ xuất hiện ở đây để bạn duyệt trước khi khách nhìn thấy."
        />
      ) : (
        <section className="flex flex-col gap-4">
          <SectionTitle
            action={
              <span className="text-caption text-ink-faint">{approvals.length} chờ duyệt</span>
            }
          >
            Chờ duyệt
          </SectionTitle>

          {approvals.map((approval) => {
            const onTarget = approval.deviation <= 0.1
            return (
              <Card key={approval.id} as="article">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-surface-sunken text-ink-muted flex size-8 items-center justify-center rounded-full">
                      <UserIcon size={16} />
                    </span>
                    <div>
                      <h3 className="text-h3">{approval.clientName}</h3>
                      <p className="text-caption text-ink-faint">Tuần {approval.weekStart}</p>
                    </div>
                  </div>

                  <Link
                    href={`/pt/khach/${approval.clientId}`}
                    className="text-accent-text text-caption flex items-center gap-1"
                  >
                    Xem hồ sơ <ChevronRightIcon size={14} />
                  </Link>
                </div>

                <dl className="border-line-subtle mb-3 flex flex-col gap-1.5 border-y py-3">
                  <Row label="Số bữa trong tuần" value={`${approval.itemCount}`} />
                  <Row
                    label="Trung bình mỗi ngày"
                    value={`${approval.averageKcal.toLocaleString('vi-VN')} kcal`}
                  />
                  <Row
                    label="Mục tiêu"
                    value={`${approval.targetKcal.toLocaleString('vi-VN')} kcal`}
                  />
                  <Row
                    label="Lệch mục tiêu"
                    value={`${Math.round(approval.deviation * 100)} %${onTarget ? ' — đạt' : ' — cần xem lại'}`}
                  />
                </dl>

                {approval.notes.length > 0 ? (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {approval.notes.map((note) => (
                      <li key={note} className="text-caption text-warning-text flex gap-2">
                        <span aria-hidden="true">·</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="text-ink-faint text-micro mb-3 flex items-center gap-2">
                  <BoIcon size={14} />
                  DỰNG BẰNG CÔNG THỨC TRONG MÃ NGUỒN, KHÔNG PHẢI AI ĐOÁN
                </div>

                <ApprovalActions planId={approval.id} clientName={approval.clientName} />
              </Card>
            )
          })}
        </section>
      )}

      <Card>
        <SectionTitle>Vì sao có bước duyệt</SectionTitle>
        <ul className="text-body text-ink-muted flex flex-col gap-2">
          <li>
            · Thực đơn ảnh hưởng trực tiếp tới khách hàng của bạn, nên bạn là người chịu trách nhiệm
            cuối cùng — không phải hệ thống.
          </li>
          <li>
            · Mọi con số trong thực đơn tính bằng công thức trong mã nguồn và đã qua bộ kiểm tra
            tính hợp lệ, nên bạn chỉ cần xem có hợp khẩu vị và lịch sinh hoạt của khách hay không.
          </li>
          <li>· Thực đơn chưa duyệt sẽ không hiển thị cho khách.</li>
        </ul>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="text-caption text-ink tabular-nums">{value}</dd>
    </div>
  )
}
