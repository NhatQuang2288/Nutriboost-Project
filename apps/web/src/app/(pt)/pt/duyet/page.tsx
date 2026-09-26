import type { Metadata } from 'next'
import Link from 'next/link'

import { CheckIcon, ChevronRightIcon, UserIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState, SectionTitle } from '@/components/ui'
import { getPtOverview } from '@/lib/data/pt'

import { ApprovalActions } from './ApprovalActions'

export const metadata: Metadata = {
  title: 'Duyệt thực đơn',
}

export const dynamic = 'force-dynamic'

export default async function ApprovalQueuePage() {
  const { approvals } = await getPtOverview()

  const totalApprovals = approvals.length

  const onTargetCount = approvals.filter((approval) => approval.deviation <= 0.1).length

  const needsReviewCount = approvals.filter((approval) => approval.deviation > 0.1).length

  return (
    <div className="min-h-full bg-[#f7f9f5] pb-10">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="mb-6 rounded-[26px] border border-[#e4eadb] bg-white p-6 shadow-[0_3px_12px_rgba(40,55,40,0.04)]">
        <div className="flex flex-col gap-6">
          {/* TITLE */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-[#81906f] uppercase">
                Quản lý thực đơn
              </p>

              <h1 className="text-[30px] font-bold tracking-[-0.035em] text-[#26362b]">
                Duyệt thực đơn
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#7f8980]">
                Kiểm tra thực đơn do Bơ dựng trước khi khách hàng nhìn thấy.
              </p>
            </div>

            {/* TOTAL */}

            <div className="flex w-fit items-center gap-2.5 rounded-full bg-[#eaf3d9] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#8caf4f]" />

              <span className="text-[12px] font-bold text-[#627b39]">
                {totalApprovals} chờ duyệt
              </span>
            </div>
          </div>

          {/* KPI */}

          {totalApprovals > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi
                label="Chờ duyệt"
                value={totalApprovals}
                helper="thực đơn"
                tone="normal"
                icon="📋"
              />

              <Kpi
                label="Đúng mục tiêu"
                value={onTargetCount}
                helper="trong phạm vi kcal"
                tone="success"
                icon="✓"
              />

              <Kpi
                label="Cần xem lại"
                value={needsReviewCount}
                helper="lệch mục tiêu"
                tone={needsReviewCount > 0 ? 'warning' : 'normal'}
                icon="!"
              />
            </div>
          )}
        </div>
      </header>

      {/* =========================================================
          EMPTY STATE
      ========================================================= */}

      {approvals.length === 0 ? (
        <EmptyState
          icon={<CheckIcon size={32} />}
          title="Không có thực đơn nào chờ duyệt"
          description="Khi Bơ dựng xong thực đơn cho một khách, nó sẽ xuất hiện ở đây để bạn duyệt trước khi khách nhìn thấy."
        />
      ) : (
        <section>
          {/* SECTION HEADER */}

          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.1em] text-[#899487] uppercase">
                Meal plans
              </p>

              <SectionTitle>Danh sách chờ duyệt</SectionTitle>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#788279] shadow-sm">
              {approvals.length} thực đơn
            </span>
          </div>

          {/* APPROVAL LIST */}

          <div className="flex flex-col gap-5">
            {approvals.map((approval) => {
              const onTarget = approval.deviation <= 0.1

              return (
                <Card
                  key={approval.id}
                  as="article"
                  className="overflow-hidden rounded-[25px] border border-[#e3e9df] bg-white shadow-[0_3px_14px_rgba(40,55,40,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(40,55,40,0.08)]"
                >
                  {/* =================================================
                      CUSTOMER HEADER
                  ================================================= */}

                  <div className={`h-1.5 ${onTarget ? 'bg-[#9fc968]' : 'bg-[#e3bb54]'}`} />

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5">
                      {/* CUSTOMER */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                              onTarget
                                ? 'bg-[#e8f2d7] text-[#68853d]'
                                : 'bg-[#fff1d4] text-[#ad8327]'
                            }`}
                          >
                            <UserIcon size={21} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-[18px] font-bold tracking-[-0.02em] text-[#304035]">
                              {approval.clientName}
                            </h3>

                            <p className="mt-1 text-[11px] font-medium text-[#89938a]">
                              Thực đơn tuần {approval.weekStart}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/pt/khach/${approval.clientId}`}
                          className="flex w-fit items-center gap-1.5 rounded-full bg-[#f2f6ed] px-3.5 py-2 text-[11px] font-bold text-[#6e8646] transition-colors hover:bg-[#e6efd9]"
                        >
                          Xem hồ sơ
                          <ChevronRightIcon size={14} />
                        </Link>
                      </div>

                      {/* STATUS */}

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3.5 py-2 text-[11px] font-bold ${
                            onTarget ? 'bg-[#e8f2d7] text-[#64803c]' : 'bg-[#fff1d7] text-[#a87c27]'
                          }`}
                        >
                          {onTarget ? '✓ Trong mục tiêu kcal' : '! Cần xem lại kcal'}
                        </span>

                        <span className="rounded-full bg-[#f2f4f1] px-3.5 py-2 text-[11px] font-semibold text-[#737d75]">
                          {approval.itemCount} bữa
                        </span>
                      </div>

                      {/* =================================================
                          METRICS
                      ================================================= */}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Metric
                          label="Trung bình"
                          value={`${approval.averageKcal.toLocaleString('vi-VN')} kcal`}
                          icon="🔥"
                        />

                        <Metric
                          label="Mục tiêu"
                          value={`${approval.targetKcal.toLocaleString('vi-VN')} kcal`}
                          icon="🎯"
                        />

                        <Metric
                          label="Lệch mục tiêu"
                          value={`${Math.round(approval.deviation * 100)}%`}
                          tone={onTarget ? 'success' : 'warning'}
                          icon={onTarget ? '✓' : '!'}
                        />

                        <Metric label="Số bữa" value={`${approval.itemCount}`} icon="🍽️" />
                      </div>

                      {/* =================================================
                          NOTES
                      ================================================= */}

                      {approval.notes.length > 0 && (
                        <div className="rounded-[18px] border border-[#f1dfb2] bg-[#fff8e8] p-4">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#ffedc2] text-[12px] font-bold text-[#a77d27]">
                              !
                            </span>

                            <p className="text-[12px] font-bold text-[#987225]">
                              Lưu ý trước khi duyệt
                            </p>
                          </div>

                          <ul className="mt-3 flex flex-col gap-2">
                            {approval.notes.map((note) => (
                              <li
                                key={note}
                                className="flex gap-2 text-[11px] leading-relaxed text-[#907d51]"
                              >
                                <span>•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <div className="border-t border-[#edf0eb] pt-4">
                        <ApprovalActions planId={approval.id} clientName={approval.clientName} />
                      </div>
                    </div>
                  ) : null}

                  {/* Source */}
                  <div className="border-line-subtle text-ink-faint mt-4 flex items-center gap-2 border-t pt-4">
                    <BoIcon size={14} />

                    <p className="text-micro">
                      Dựng bằng công thức trong mã nguồn, không phải AI đoán
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* =========================================================
          WHY APPROVAL
      ========================================================= */}

      <Card className="mt-6 rounded-[24px] border border-[#e4eadf] bg-white shadow-[0_2px_10px_rgba(40,55,40,0.03)]">
        <div className="flex items-start gap-4 p-1">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f2d7] text-[#66813e]">
            <CheckIcon size={19} />
          </span>

          <div className="min-w-0">
            <SectionTitle>Vì sao có bước duyệt?</SectionTitle>

            <ul className="mt-4 flex flex-col gap-3">
              <li className="flex gap-2.5 text-[12px] leading-relaxed text-[#7c867e]">
                <span className="font-bold text-[#8caf4f]">•</span>

                <span>
                  Thực đơn ảnh hưởng trực tiếp tới khách hàng nên PT là người kiểm tra và quyết định
                  cuối cùng.
                </span>
              </li>

              <li className="flex gap-2.5 text-[12px] leading-relaxed text-[#7c867e]">
                <span className="font-bold text-[#8caf4f]">•</span>

                <span>
                  Các con số trong thực đơn được tính bằng công thức trong mã nguồn và đã qua bộ
                  kiểm tra tính hợp lệ.
                </span>
              </li>

              <li className="flex gap-2.5 text-[12px] leading-relaxed text-[#7c867e]">
                <span className="font-bold text-[#8caf4f]">•</span>

                <span>Thực đơn chưa được duyệt sẽ không hiển thị cho khách hàng.</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  )
}

/* ================================================================
   KPI
================================================================ */

function Kpi({
  label,
  value,
  helper,
  tone = 'normal',
  icon,
}: {
  label: string
  value: number
  helper: string
  tone?: 'normal' | 'success' | 'warning'
  icon: string
}) {
  const styles = {
    normal: {
      card: 'bg-[#f3f6f1]',
      icon: 'bg-[#e4eadf] text-[#68746a]',
      value: 'text-[#344238]',
    },

    success: {
      card: 'bg-[#eef6df]',
      icon: 'bg-[#dcebc2] text-[#64813b]',
      value: 'text-[#66813c]',
    },

    warning: {
      card: 'bg-[#fff6df]',
      icon: 'bg-[#ffebbd] text-[#a47b26]',
      value: 'text-[#a47b26]',
    },
  }

  const style = styles[tone]

  return (
    <div className={`rounded-[19px] p-4 ${style.card}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#778178]">{label}</p>

          <p className={`mt-1 text-[27px] font-bold tracking-[-0.03em] ${style.value}`}>{value}</p>

          <p className="mt-0.5 text-[9px] font-medium text-[#969e96]">{helper}</p>
        </div>

        <span
          className={`flex size-9 items-center justify-center rounded-xl text-[14px] font-bold ${style.icon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  )
}

/* ================================================================
   METRIC
    </div>
  )
}
