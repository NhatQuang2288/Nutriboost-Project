import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { REMINDER_LABELS, QUIET_HOURS_END, QUIET_HOURS_START } from '@nutriboost/ai'

import {
  BoIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
  UserIcon,
} from '@/components/icons'
import { Card, Disclaimer } from '@/components/ui'
import { MEAL_LABELS, type MealType } from '@/lib/data/today'
import { GeneratePlanButton } from './GeneratePlanButton'

import {
  CLIENT_STATUS_LABELS,
  formatReminderDays,
  formatVnd,
  getPtClientDetail,
} from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Hồ sơ khách hàng' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export default async function PtClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const detail = await getPtClientDetail(clientId)

  if (detail === null) notFound()

  const { client, plan, workout, targetKcal, reminders } = detail

  const weightLabel =
    client.weightDeltaKg > 0 ? `+${client.weightDeltaKg} kg` : `${client.weightDeltaKg} kg`

  const weightTone =
    client.weightDeltaKg > 0 ? 'warning' : client.weightDeltaKg < 0 ? 'success' : 'normal'

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/pt"
        className="text-ink-muted hover:text-forest-700 text-caption inline-flex w-fit items-center gap-1.5 font-medium transition-colors"
      >
        <ChevronLeftIcon size={16} />
        Về tổng quan
      </Link>

      {/* Header hồ sơ */}
      <header className="border-line-subtle bg-surface rounded-3xl border p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="text-forest-700 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-olive-100">
                <UserIcon size={24} />
              </div>

              <div className="min-w-0">
                <p className="text-caption text-ink-muted mb-1">Hồ sơ khách hàng</p>

                <h1 className="text-h1 truncate">{client.name}</h1>

                <div className="text-caption text-ink-muted mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{GOAL_LABELS[client.goal]}</span>
                  <span className="text-ink-faint">·</span>
                  <span>{CLIENT_STATUS_LABELS[client.status]}</span>
                  <span className="text-ink-faint">·</span>
                  <span>Hoạt động {client.lastActiveLabel}</span>
                </div>
              </div>
            </div>

            {client.needsAttention === null ? (
              <span className="text-accent-text text-caption shrink-0 rounded-full bg-olive-100 px-3 py-1.5 font-semibold">
                Đang theo dõi
              </span>
            ) : (
              <span className="bg-warning-surface text-warning-text text-caption shrink-0 rounded-full px-3 py-1.5 font-semibold">
                {client.needsAttention}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="Tuân thủ 7 ngày"
              value={`${client.adherencePct}%`}
              helper="Mức độ theo kế hoạch"
            />

            <Stat
              label="Ngày có ghi"
              value={`${client.loggedDays}/7`}
              helper="Trong 7 ngày gần nhất"
            />

            <Stat
              label="Biến động cân nặng"
              value={weightLabel}
              helper="So với mốc theo dõi"
              tone={weightTone}
            />
          </div>
        </div>
      </header>

      {/* Thao tác PT */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-caption text-ink-muted">Công cụ PT</p>
            <h2 className="text-h2 text-ink mt-0.5">Quản lý kế hoạch</h2>
          </div>
        </div>

        <GeneratePlanButton clientId={client.id} clientName={client.name} />
      </section>

      {/* Thực đơn */}
      <Card className="rounded-3xl border border-olive-100 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-ink-muted">Dinh dưỡng</p>
            <h2 className="text-h2 text-ink mt-0.5 font-bold">Thực đơn tuần này</h2>
            <p className="text-caption text-ink-muted mt-1">
              Theo dõi lượng kcal và các món trong từng ngày.
            </p>
          </div>

          <span className="text-accent-text text-caption rounded-full bg-olive-50 px-3 py-1.5 font-semibold tabular-nums">
            Mục tiêu {targetKcal.toLocaleString('vi-VN')} kcal/ngày
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plan.days.map((day) => {
            const onTarget = Math.abs(day.totalKcal - targetKcal) / targetKcal <= 0.1

            return (
              <div key={day.date} className="border-line-subtle rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-body text-ink font-semibold">{dayLabel(day.date)}</p>
                    <p className="text-micro text-ink-faint mt-0.5">{day.meals.length} bữa</p>
                  </div>

                  <span
                    className={[
                      'text-micro shrink-0 rounded-full px-2.5 py-1 font-semibold tabular-nums',
                      onTarget
                        ? 'text-accent-text bg-olive-100'
                        : 'bg-warning-surface text-warning-text',
                    ].join(' ')}
                  >
                    {day.totalKcal.toLocaleString('vi-VN')} kcal
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-2.5">
                  {day.meals.flatMap((meal) =>
                    meal.items.map((item) => (
                      <div
                        key={`${day.date}-${meal.mealType}-${item.slug}`}
                        className="bg-surface-sunken rounded-xl px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-micro text-accent-text font-semibold">
                              {MEAL_LABELS[meal.mealType as MealType]}
                            </p>
                            <p className="text-caption text-ink mt-0.5 truncate">{item.nameVi}</p>
                          </div>

                          <span className="text-micro text-ink-faint shrink-0 tabular-nums">
                            {item.grams} g
                          </span>
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-olive-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-micro text-ink-muted">Trung bình mỗi ngày</p>
            <p className="text-h3 text-ink mt-1 font-bold tabular-nums">
              {plan.averageKcal.toLocaleString('vi-VN')} kcal
            </p>
          </div>

          <div>
            <p className="text-micro text-ink-muted">Protein trung bình</p>
            <p className="text-h3 text-ink mt-1 font-bold tabular-nums">{plan.averageProteinG} g</p>
          </div>
        </div>
      </Card>

      {/* Lịch tập */}
      <Card className="rounded-3xl border border-olive-100 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-ink-muted">Vận động</p>
            <h2 className="text-h2 text-ink mt-0.5 font-bold">Lịch tập tuần này</h2>
            <p className="text-caption text-ink-muted mt-1">Các buổi tập và thời lượng dự kiến.</p>
          </div>

          <span className="bg-surface-sunken text-ink-muted text-caption flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 tabular-nums">
            <FlameIcon size={14} />
            {workout.weeklyKcal} kcal/tuần
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {workout.sessions.map((session) => (
            <div
              key={`${session.date}-${session.focus}`}
              className="border-line-subtle flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-body text-ink font-semibold">{session.focus}</p>
                <p className="text-caption text-ink-faint mt-1">
                  {dayLabel(session.date)} · {session.blocks.length} bài
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="bg-surface-sunken text-ink-muted text-micro rounded-full px-2.5 py-1 tabular-nums">
                  {session.totalMinutes} phút
                </span>
                <span className="text-accent-text text-micro rounded-full bg-olive-50 px-2.5 py-1 tabular-nums">
                  {session.estimatedKcal} kcal
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Nhắc nhở */}
      <Card className="rounded-3xl border border-olive-100 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-ink-muted">Tự động hóa</p>
            <h2 className="text-h2 text-ink mt-0.5 font-bold">Nhắc nhở đang bật</h2>
            <p className="text-caption text-ink-muted mt-1">
              Các quy tắc nhắc nhở hiện được thiết lập cho khách.
            </p>
          </div>

          <span className="bg-surface-sunken text-ink-muted text-caption rounded-full px-3 py-1.5">
            {reminders.length === 0 ? 'Chưa bật' : `${reminders.length} luật`}
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="bg-surface-sunken mt-5 rounded-2xl p-4">
            <p className="text-body text-ink-muted">
              Khách chưa bật nhắc nhở nào. Bạn có thể nhắc họ bật trong ứng dụng.
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="border-line-subtle flex items-start gap-3 rounded-2xl border p-4"
              >
                <span className="text-accent-text flex size-9 shrink-0 items-center justify-center rounded-xl bg-olive-50">
                  <CalendarIcon size={15} />
                </span>

                <div className="min-w-0">
                  <p className="text-body text-ink font-semibold">
                    {REMINDER_LABELS[reminder.kind]}
                  </p>
                  <p className="text-caption text-ink-muted mt-0.5">
                    {reminder.timeOfDay} · {formatReminderDays(reminder.days)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-caption text-ink-faint mt-4">
          Không gửi trong khung {quietHoursLabel()}. PT chỉnh được giờ nhắc cho từng khách.
        </p>
      </Card>

      {/* Bơ AI */}
      <Card className="rounded-3xl border-olive-200 bg-olive-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="text-accent-text flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <BoIcon size={20} />
            </span>

            <div>
              <p className="text-body text-ink font-semibold">Hỏi Bơ về {client.name}</p>

              <p className="text-caption text-ink-muted mt-1">
                Phân tích tình hình khách và hỗ trợ PT đặt câu hỏi về thực đơn, cân nặng hoặc lịch
                tập.
              </p>

              <p className="text-caption text-ink-faint mt-1">
                Gói {formatVnd(750_000)}/tháng cho 5 khách — mỗi khách 600 lượt trợ lý.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="border-line-subtle text-forest-700 text-label flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border bg-white px-4 font-semibold transition-colors hover:bg-olive-50"
          >
            Mở Bơ AI
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Stat({
  label,
  value,
  helper,
  tone = 'normal',
}: {
  label: string
  value: string
  helper: string
  tone?: 'normal' | 'warning' | 'success'
}) {
  const valueClass =
    tone === 'warning' ? 'text-warning-text' : tone === 'success' ? 'text-accent-text' : 'text-ink'

  return (
    <div className="border-line-subtle bg-surface-sunken rounded-2xl border p-4">
      <p className="text-caption text-ink-muted">{label}</p>
      <p className={`text-display mt-1 font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-micro text-ink-faint mt-1">{helper}</p>
    </div>
  )
}

function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) {
    return isoDate
  }

  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()

  return `${WEEKDAYS[index] ?? ''} ${day}/${month}`
}

function quietHoursLabel(): string {
  const format = (minutes: number): string =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

  return `${format(QUIET_HOURS_START)}–${format(QUIET_HOURS_END)}`
}
