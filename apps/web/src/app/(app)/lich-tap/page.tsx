import type { Metadata } from 'next'
import Link from 'next/link'

import { BoIcon, ClockIcon, FlameIcon, InfoIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { ensureProfileReady } from '@/lib/data/require-profile'
import { getWeeklyWorkout } from '@/lib/data/workout'

export const metadata: Metadata = { title: 'Lịch tập' }
export const dynamic = 'force-dynamic'

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export default async function WorkoutPage() {
  const { plan, weekLabel, todayDate, source } = await getWeeklyWorkout()
  await ensureProfileReady(source)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Lịch tập tuần</h1>
        <p className="text-caption text-ink-muted">
          {plan.sessions.length} buổi, tổng {plan.weeklyMinutes} phút và{' '}
          {plan.weeklyKcal.toLocaleString('vi-VN')} kcal đốt trong tuần.
        </p>
      </header>

      {plan.sessions.length === 0 ? (
        <Card className="border-warning/30 bg-warning-surface">
          <p className="text-body text-warning-text font-semibold">Chưa dựng được lịch tập</p>
          <p className="text-caption text-warning-text mt-1">{plan.notes.join(' ')}</p>
        </Card>
      ) : (
        <>
          <Card className="border-olive-200 bg-olive-50">
            <div className="flex items-start gap-3">
              <span className="text-accent-text mt-0.5">
                <BoIcon size={22} />
              </span>
              <div>
                <p className="text-body text-ink font-semibold">Tuần {weekLabel}</p>
                <p className="text-caption text-ink-muted mt-1">
                  Mục tiêu giảm cân nên bài tập thiên về nhiều hiệp, nghỉ ngắn, có khởi động và giãn
                  cơ ở mỗi buổi.
                </p>
              </div>
            </div>
          </Card>

          {plan.notes.length > 0 ? (
            <Card className="border-warning/30 bg-warning-surface">
              <div className="flex gap-3">
                <span className="text-warning-text mt-0.5 shrink-0">
                  <InfoIcon size={18} />
                </span>
                <ul className="flex flex-col gap-1.5">
                  {plan.notes.map((note) => (
                    <li key={note} className="text-caption text-warning-text">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionTitle>Buổi tập</SectionTitle>

            {plan.sessions.map((session) => {
              const isToday = session.date === todayDate
              return (
                <Card
                  key={`${session.date}-${session.focus}`}
                  as="article"
                  className={isToday ? 'border-olive-200' : undefined}
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <div>
                      <h3 className="text-h3">{session.focus}</h3>
                      <p className="text-caption text-ink-faint">{dayLabel(session.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body text-ink tabular-nums">
                        {session.estimatedKcal} kcal
                      </p>
                      <p className="text-caption text-ink-faint tabular-nums">
                        {session.totalMinutes} phút
                      </p>
                    </div>
                  </div>

                  {isToday ? <p className="text-micro text-accent-text mb-3">HÔM NAY</p> : null}

                  <ul className="flex flex-col gap-2.5">
                    {session.blocks.map((block, index) => (
                      <li key={`${block.exerciseSlug}-${index}`} className="flex flex-col gap-0.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-body text-ink">{block.nameVi}</span>
                          <span className="text-caption text-ink-muted shrink-0 tabular-nums">
                            {describeBlock(block.sets, block.reps, block.seconds)}
                          </span>
                        </div>
                        <span className="text-caption text-ink-faint flex items-center gap-2">
                          <ClockIcon size={12} />
                          nghỉ {block.restSeconds}s · {block.estimatedKcal} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </section>
        </>
      )}

      <Card>
        <SectionTitle>Lịch tập này được dựng thế nào</SectionTitle>
        <ul className="text-body text-ink-muted flex flex-col gap-2">
          <li className="flex items-start gap-2">
            <FlameIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Kcal đốt tính bằng công thức MET × 3,5 × cân nặng / 200 × số phút — cùng công thức với
            phần vận động trong ngày, nên hai nơi luôn khớp nhau.
          </li>
          <li className="flex items-start gap-2">
            <FlameIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Bài tập có vùng chấn thương trùng với chấn thương bạn khai sẽ bị loại tự động. Đây là bộ
            lọc trong mã nguồn, không phụ thuộc vào việc AI có để ý hay không.
          </li>
          <li className="flex items-start gap-2">
            <FlameIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Mỗi buổi đều có khởi động và giãn cơ, không bao giờ vào bài chính ngay.
          </li>
        </ul>
      </Card>

      <Link
        href="/ke-hoach"
        className="border-line bg-surface text-ink text-label flex min-h-12 items-center justify-center rounded-md border px-6 font-semibold transition-colors duration-(--duration-fast)"
      >
        Xem kế hoạch ăn uống
      </Link>

      <Disclaimer />
    </div>
  )
}

function describeBlock(sets: number, reps: string | null, seconds: number | null): string {
  if (seconds !== null) return `${sets} × ${seconds}s`
  return `${sets} × ${reps ?? '—'}`
}

function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return `${WEEKDAYS[index] ?? ''} ${day}/${month}`
}
