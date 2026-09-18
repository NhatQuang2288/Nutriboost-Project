import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { REMINDER_LABELS, QUIET_HOURS_END, QUIET_HOURS_START } from '@nutriboost/ai'

import { BoIcon, CalendarIcon, ChevronLeftIcon, FlameIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { MEAL_LABELS, type MealType } from '@/lib/data/today'
import {
  CLIENT_STATUS_LABELS,
  formatReminderDays,
  formatVnd,
  getPtClientDetail,
} from '@/lib/data/pt'

export const metadata: Metadata = { title: 'Hồ sơ khách hàng' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = { lose: 'Giảm cân', maintain: 'Giữ cân', gain: 'Tăng cân' } as const
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export default async function PtClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const detail = await getPtClientDetail(clientId)

  if (detail === null) notFound()

  const { client, plan, workout, targetKcal, reminders } = detail

  return (
    <div className="flex flex-col gap-5">
      <Link href="/pt" className="text-ink-muted text-caption flex items-center gap-1">
        <ChevronLeftIcon size={16} />
        Về tổng quan
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">{client.name}</h1>
          <p className="text-caption text-ink-muted">
            {GOAL_LABELS[client.goal]} · {CLIENT_STATUS_LABELS[client.status]} · hoạt động{' '}
            {client.lastActiveLabel}
          </p>
        </div>
        {client.needsAttention === null ? null : (
          <span className="bg-warning-surface text-warning-text text-caption rounded-full px-3 py-1.5">
            {client.needsAttention}
          </span>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tuân thủ 7 ngày" value={`${client.adherencePct}%`} />
        <Stat label="Ngày có ghi" value={`${client.loggedDays}/7`} />
        <Stat
          label="Cân nặng"
          value={`${client.weightDeltaKg > 0 ? '+' : ''}${client.weightDeltaKg} kg`}
          tone={client.weightDeltaKg > 0 ? 'warning' : 'normal'}
        />
      </div>

      <Card>
        <SectionTitle
          action={
            <span className="text-caption text-ink-faint tabular-nums">
              mục tiêu {targetKcal.toLocaleString('vi-VN')} kcal
            </span>
          }
        >
          Thực đơn tuần này
        </SectionTitle>

        <ul className="flex flex-col gap-3">
          {plan.days.map((day) => {
            const onTarget = Math.abs(day.totalKcal - targetKcal) / targetKcal <= 0.1
            return (
              <li key={day.date} className="border-line-subtle border-b pb-3 last:border-b-0">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-body text-ink font-semibold">{dayLabel(day.date)}</span>
                  <span
                    className={`text-caption tabular-nums ${onTarget ? 'text-accent-text' : 'text-warning-text'}`}
                  >
                    {day.totalKcal.toLocaleString('vi-VN')} kcal
                  </span>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {day.meals.flatMap((meal) =>
                    meal.items.map((item) => (
                      <li
                        key={`${day.date}-${meal.mealType}-${item.slug}`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="text-caption text-ink-muted">
                          {MEAL_LABELS[meal.mealType as MealType]} · {item.nameVi}
                        </span>
                        <span className="text-caption text-ink-faint tabular-nums">
                          {item.grams} g
                        </span>
                      </li>
                    )),
                  )}
                </ul>
              </li>
            )
          })}
        </ul>

        <p className="text-caption text-ink-faint mt-3">
          Trung bình {plan.averageKcal.toLocaleString('vi-VN')} kcal · {plan.averageProteinG} g đạm
          mỗi ngày
        </p>
      </Card>

      <Card>
        <SectionTitle
          action={
            <span className="text-ink-faint text-caption flex items-center gap-1">
              <FlameIcon size={14} /> {workout.weeklyKcal} kcal/tuần
            </span>
          }
        >
          Lịch tập tuần này
        </SectionTitle>

        <ul className="flex flex-col gap-3">
          {workout.sessions.map((session) => (
            <li
              key={`${session.date}-${session.focus}`}
              className="flex items-baseline justify-between gap-3"
            >
              <div>
                <p className="text-body text-ink">{session.focus}</p>
                <p className="text-caption text-ink-faint">
                  {dayLabel(session.date)} · {session.blocks.length} bài
                </p>
              </div>
              <span className="text-caption text-ink-muted shrink-0 tabular-nums">
                {session.totalMinutes} phút · {session.estimatedKcal} kcal
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle
          action={
            <span className="text-caption text-ink-faint">
              {reminders.length === 0 ? 'chưa bật' : `${reminders.length} luật`}
            </span>
          }
        >
          Nhắc nhở đang bật
        </SectionTitle>

        {/*
          Đọc từ `reminder_rules`, không phải chữ viết cứng. Trước đây khối này hiện ba dòng
          "12:30 mỗi ngày", "07:00 thứ Hai", "18:00 các ngày tập" cho MỌI khách — kể cả khách
          chưa bật nhắc nhở nào. Với dữ liệu mẫu thì vô hại; với một khách thật thì đó là nói
          sai về cài đặt của họ.
        */}
        {reminders.length === 0 ? (
          <p className="text-body text-ink-muted">
            Khách chưa bật nhắc nhở nào. Bạn có thể nhắc họ bật trong ứng dụng.
          </p>
        ) : (
          <ul className="text-body text-ink-muted flex flex-col gap-2">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-ink-faint shrink-0" />
                {REMINDER_LABELS[reminder.kind]} — {reminder.timeOfDay}{' '}
                {formatReminderDays(reminder.days)}
              </li>
            ))}
          </ul>
        )}

        <p className="text-caption text-ink-faint mt-3">
          Không gửi trong khung {quietHoursLabel()}. PT chỉnh được giờ nhắc cho từng khách.
        </p>
      </Card>

      <Card className="border-olive-200 bg-olive-50">
        <div className="flex items-start gap-3">
          <span className="text-accent-text mt-0.5 shrink-0">
            <BoIcon size={20} />
          </span>
          <div>
            <p className="text-body text-ink font-semibold">Hỏi Bơ về khách này</p>
            <p className="text-caption text-ink-muted mt-0.5">
              Mở thanh hỏi ở đáy màn hình và hỏi, ví dụ “vì sao tuần này {client.name} tăng cân?”.
            </p>
            <p className="text-caption text-ink-faint mt-1">
              Gói {formatVnd(750_000)}/tháng cho 5 khách — mỗi khách 600 lượt trợ lý.
            </p>
          </div>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'normal' | 'warning'
}) {
  return (
    <Card as="div" className="p-3">
      <p className="text-caption text-ink-muted">{label}</p>
      <p
        className={`text-h2 tabular-nums ${tone === 'warning' ? 'text-warning-text' : 'text-ink'}`}
      >
        {value}
      </p>
    </Card>
  )
}

function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return `${WEEKDAYS[index] ?? ''} ${day}/${month}`
}

/**
 * Khung giờ yên lặng, đọc từ hằng số của `@nutriboost/ai` thay vì chép lại.
 *
 * Chép lại thì sửa một bên là hai bên lệch nhau, và người dùng sẽ thấy ứng dụng nhắc trong
 * đúng khung giờ mà nó tuyên bố là không nhắc.
 */
function quietHoursLabel(): string {
  const format = (minutes: number): string =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return `${format(QUIET_HOURS_START)}–${format(QUIET_HOURS_END)}`
}
