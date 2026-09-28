import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  BoIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
  InfoIcon,
  LeafIcon,
} from '@/components/icons'
import { PhotoMealButton } from '@/components/assistant/PhotoMealButton'
import { Disclaimer, MacroBar, ProgressRing, SafetyNotice } from '@/components/ui'
import { ensureProfileReady } from '@/lib/data/require-profile'
import { MEAL_LABELS, MEAL_ORDER, getTodayView } from '@/lib/data/today'
import { getWeeklyWorkout } from '@/lib/data/workout'
import { weekdayLabel } from '@/lib/date'

export const metadata: Metadata = { title: 'Hôm nay' }

// Dashboard cá nhân hoá: không được dựng tĩnh ở thời điểm build, nếu không ngày sẽ bị cũ.
export const dynamic = 'force-dynamic'

/** Kiểu lấy thẳng từ loader của trang Lịch tập, để hai màn không bao giờ lệch nhau. */
type WeeklyWorkout = Awaited<ReturnType<typeof getWeeklyWorkout>>
type WorkoutSession = WeeklyWorkout['plan']['sessions'][number]

/**
 * Màn Hôm nay — bố cục theo trang tổng quan của console PT (thiết kế của Vy): lời chào, lưới
 * hai cột thẻ bo góc. Buổi tập hôm nay đứng đầu cột trái, hiện đủ từng bài ngay trên màn.
 *
 * Số liệu dinh dưỡng đến từ `getTodayView`, lịch tập đến từ `getWeeklyWorkout` — cùng nguồn với
 * trang /lich-tap.
 */
export default async function TodayPage() {
  const [view, workout] = await Promise.all([getTodayView(), getWeeklyWorkout()])
  await ensureProfileReady(view.source)
  const { targets, consumed, bmi, safety } = view

  const kcalGoal = targets.targetKcal
  const kcalIn = consumed.kcal
  const remaining = view.remainingKcal
  const overBudget = remaining < 0
  const loggedMeals = view.meals.length

  return (
    <div className="flex flex-col gap-4">
      {view.source === 'demo' ? (
        /*
         * Nói thẳng đây là dữ liệu mẫu. Không có dòng này thì một lần chạy chưa cấu hình
         * Supabase vẫn hiện "Chào Minh" kèm 2.120 kcal như thể đó là hồ sơ của người đang xem.
         */
        <p className="border-info/30 bg-info-surface text-info-text text-caption rounded-2xl border px-4 py-3">
          Đang hiện dữ liệu mẫu. Hồ sơ của bạn chưa được thiết lập nên các con số dưới đây không
          phải của bạn.
        </p>
      ) : null}

      {/* ===================== LỜI CHÀO ===================== */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-ink text-[23px] leading-tight font-medium tracking-[-0.03em]">
            Chào {view.profile.fullName}
            <span className="ml-1">🌱</span>
          </h1>
          <p className="text-ink-muted mt-1 text-[12px] first-letter:uppercase">
            {weekdayLabel(new Date(), 'Asia/Ho_Chi_Minh')} ·{' '}
            {overBudget
              ? `đã vượt mục tiêu ${Math.abs(remaining).toLocaleString('vi-VN')} kcal`
              : `còn ${remaining.toLocaleString('vi-VN')} kcal cho hôm nay`}
          </p>
        </div>
        <span className="text-forest-600 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-olive-100">
          <BoIcon size={24} state="idle" />
        </span>
      </header>

      {safety.level === 'ok' ? null : (
        <SafetyNotice>
          <strong className="font-semibold">Lưu ý an toàn. </strong>
          {safety.reasons.join(' ')}
        </SafetyNotice>
      )}

      {/*
        Track lưới dùng minmax(0, …) và hai cột có min-w-0: dòng món ăn không xuống dòng
        (`truncate`), mà ô lưới mặc định không co nhỏ hơn nội dung — thiếu hai thứ này thì cả cột
        bị đẩy rộng ra và trang tràn ngang trên điện thoại.
      */}
      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.82fr)]">
        {/* ===================== CỘT TRÁI ===================== */}
        <div className="flex min-w-0 flex-col gap-3.5">
          <WorkoutTodayCard workout={workout} />
        </div>

        {/* ===================== CỘT PHẢI ===================== */}
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* Bữa ăn — dạng dòng thời gian như lịch làm việc của console PT */}
          <DashboardCard
            eyebrow="Nhật ký"
            title="Bữa ăn hôm nay"
            badge={`${view.streakDays} ngày liên tiếp`}
          >
            <ol className="space-y-2">
              {MEAL_ORDER.map((mealType) => {
                const meal = view.meals.find((item) => item.mealType === mealType)
                return (
                  <li key={mealType}>
                    {meal === undefined ? (
                      <MealRow
                        time="--:--"
                        title={MEAL_LABELS[mealType]}
                        detail="Chưa ghi"
                        tone="empty"
                      />
                    ) : (
                      <MealRow
                        time={meal.timeLabel}
                        title={MEAL_LABELS[mealType]}
                        detail={meal.items
                          .map((item) => `${item.nameVi} · ${item.grams} g`)
                          .join(', ')}
                        kcal={meal.total.kcal}
                        tone="logged"
                      />
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="border-line-subtle mt-4 border-t pt-3">
              <p className="text-ink-faint mb-2 text-[11px]">
                Đã ghi {loggedMeals}/{MEAL_ORDER.length} bữa · chụp món ăn để Bơ ghi giúp
              </p>
              {/* Mở camera ngay tại đây, không chuyển trang. Kết quả hiện ở thẻ xác nhận của Bơ. */}
              <PhotoMealButton variant="compact" />
            </div>
          </DashboardCard>

          {/* Năng lượng, đa lượng và chỉ số cơ thể — gộp một thẻ */}
          <DashboardCard eyebrow="Hôm nay" title="Năng lượng và cơ thể">
            {/* Năng lượng */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <ProgressRing value={kcalIn} max={kcalGoal}>
                  <span className="text-caption text-ink-muted">
                    {overBudget ? 'Vượt mục tiêu' : 'Còn lại'}
                  </span>
                  <span className="text-display tabular-nums">
                    {Math.abs(remaining).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-caption text-ink-faint">kcal</span>
                </ProgressRing>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <StatRow label="Mục tiêu" value={kcalGoal} tone="green" />
                <StatRow label="Đã nạp" value={kcalIn} tone="yellow" />
                <StatRow label="Đã đốt" value={view.kcalBurned} tone="gray" icon />
              </div>
            </div>

            {/* Đa lượng */}
            <div className="border-line-subtle mt-5 border-t pt-4">
              <h3 className="text-ink-muted mb-3 text-[12px] font-medium">Đa lượng</h3>
              <div className="flex flex-col gap-3">
                <MacroBar
                  label="Đạm"
                  value={consumed.proteinG}
                  target={targets.proteinG}
                  tone="olive-500"
                />
                <MacroBar
                  label="Tinh bột"
                  value={consumed.carbG}
                  target={targets.carbG}
                  tone="olive-600"
                />
                <MacroBar
                  label="Chất béo"
                  value={consumed.fatG}
                  target={targets.fatG}
                  tone="olive-700"
                />
              </div>
              {targets.floorsApplied.length > 0 ? (
                <p className="text-caption text-ink-faint mt-3">
                  Mục tiêu đã được điều chỉnh để an toàn ({targets.floorsApplied.length} yếu tố).
                </p>
              ) : null}
            </div>

            {/* Cơ thể */}
            <div className="border-line-subtle mt-5 border-t pt-4">
              <h3 className="text-ink-muted mb-3 text-[12px] font-medium">Cơ thể</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[15px] bg-olive-50 p-3">
                  <p className="text-ink-muted text-[11px]">BMI · {bmi.label}</p>
                  <p className="text-ink mt-1 text-[22px] font-semibold tabular-nums">{bmi.bmi}</p>
                </div>
                <div className="bg-surface-sunken rounded-[15px] p-3">
                  <p className="text-ink-muted text-[11px]">Cân nặng gần nhất</p>
                  <p className="text-ink mt-1 text-[22px] font-semibold tabular-nums">
                    {view.profile.weightKg} kg
                  </p>
                </div>
              </div>
              <p className="text-ink-faint mt-3 flex items-center gap-1.5 text-[11px]">
                <LeafIcon size={13} />
                BMI phân loại theo ngưỡng dành cho người châu Á.
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>

      <Disclaimer />
    </div>
  )
}

/* =====================================================================
 * BUỔI TẬP HÔM NAY
 * ===================================================================== */

function WorkoutTodayCard({ workout }: { workout: WeeklyWorkout }) {
  const { plan, todayDate } = workout

  if (plan.sessions.length === 0) {
    return (
      <DashboardCard eyebrow="Tập luyện" title="Buổi tập hôm nay">
        <div className="border-warning/30 bg-warning-surface rounded-[15px] border p-4">
          <p className="text-warning-text text-[13px] font-semibold">Chưa dựng được lịch tập</p>
          {plan.notes.length > 0 ? (
            <p className="text-warning-text mt-1 text-[12px]">{plan.notes.join(' ')}</p>
          ) : null}
        </div>
      </DashboardCard>
    )
  }

  const todaySessions = plan.sessions.filter((session) => session.date === todayDate)
  const nextSession = plan.sessions
    .filter((session) => session.date > todayDate)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const week = buildWeek(plan.sessions, todayDate)

  return (
    <DashboardCard
      eyebrow="Tập luyện"
      title="Buổi tập hôm nay"
      badge={`${plan.sessions.length} buổi/tuần`}
    >
      {/* Cả tuần — đứng trên cùng */}
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Lịch tập trong tuần">
        {week.map((day) => (
          <li key={day.date}>
            <WeekDayCell day={day} />
          </li>
        ))}
      </ol>

      <div className="border-line-subtle mt-3 flex items-center justify-between gap-3 border-b pb-3">
        <span className="text-ink-faint text-[11px] tabular-nums">
          Cả tuần {plan.weeklyMinutes} phút · {plan.weeklyKcal.toLocaleString('vi-VN')} kcal
        </span>
        <Link
          href="/lich-tap"
          className="text-accent-text group flex shrink-0 items-center gap-1 text-[12px] font-semibold hover:underline"
        >
          Xem cả tuần
          <ChevronRightIcon
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {plan.notes.length > 0 ? (
        <p className="text-warning-text mt-3 flex items-start gap-1.5 text-[11px]">
          <InfoIcon size={13} className="mt-px shrink-0" />
          Lịch tập có {plan.notes.length} lưu ý, xem chi tiết trong trang Lịch tập.
        </p>
      ) : null}

      {/* Buổi tập hôm nay */}
      <div className="mt-4">
        {todaySessions.length === 0 ? (
          <RestDay next={nextSession} />
        ) : (
          <div className="flex flex-col gap-3">
            {todaySessions.map((session) => (
              <SessionDetail key={`${session.date}-${session.focus}`} session={session} />
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

/** Chi tiết một buổi: tổng thời lượng, kcal và từng bài theo thứ tự tập. */
function SessionDetail({ session }: { session: WorkoutSession }) {
  return (
    <article className="rounded-[15px] border border-olive-200 bg-olive-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-ink truncate text-[16px] font-semibold">{session.focus}</h3>
          <p className="text-ink-muted mt-0.5 text-[12px]">{dayLabel(session.date)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-ink flex items-center justify-end gap-1 text-[13px] font-semibold tabular-nums">
            <ClockIcon size={13} className="text-ink-faint" />
            {session.totalMinutes} phút
          </p>
          <p className="text-ink-muted mt-0.5 flex items-center justify-end gap-1 text-[12px] tabular-nums">
            <FlameIcon size={12} className="text-olive-500" />
            {session.estimatedKcal} kcal
          </p>
        </div>
      </div>

      <ol className="mt-3 divide-y divide-olive-200/70">
        {session.blocks.map((block, index) => (
          <li key={`${block.exerciseSlug}-${index}`} className="flex items-center gap-3 py-2.5">
            <span className="text-ink-faint w-4 shrink-0 text-[11px] font-semibold tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-ink block truncate text-[13px]">{block.nameVi}</span>
              <span className="text-ink-faint block text-[11px] tabular-nums">
                nghỉ {block.restSeconds}s · {block.estimatedKcal} kcal
              </span>
            </span>
            <span className="text-ink-muted shrink-0 text-[12px] font-semibold tabular-nums">
              {describeBlock(block.sets, block.reps, block.seconds)}
            </span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function RestDay({ next }: { next: WorkoutSession | undefined }) {
  return (
    <div className="bg-surface-sunken rounded-[15px] p-4">
      <p className="text-ink text-[14px] font-semibold">Hôm nay nghỉ tập</p>
      <p className="text-ink-muted mt-1 text-[12px]">
        Đi bộ nhẹ hoặc giãn cơ 10–15 phút giúp cơ thể hồi phục cho buổi sau.
      </p>
      {next === undefined ? null : (
        <p className="text-ink mt-3 text-[12px]">
          Buổi tới: <span className="font-semibold">{next.focus}</span>, {dayLabel(next.date)} ·{' '}
          {next.totalMinutes} phút
        </p>
      )}
    </div>
  )
}

/* ---------- Dải 7 ngày ---------- */

type DayStatus = 'past' | 'today' | 'planned' | 'rest'

interface WeekDay {
  date: string
  short: string
  status: DayStatus
  isToday: boolean
  focus?: string
}

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  past: 'Đã qua',
  today: 'Hôm nay',
  planned: 'Sắp tới',
  rest: 'Nghỉ',
}

/** Tuần thứ Hai → Chủ nhật chứa `todayDate`, đánh dấu ngày nào có buổi tập. */
function buildWeek(sessions: readonly WorkoutSession[], todayDate: string): WeekDay[] {
  const monday = addDays(todayDate, -mondayIndex(todayDate))

  return WEEKDAY_SHORT.map((short, index) => {
    const date = addDays(monday, index)
    const session = sessions.find((item) => item.date === date)
    const isToday = date === todayDate

    let status: DayStatus
    if (session === undefined) status = 'rest'
    else if (isToday) status = 'today'
    else if (date < todayDate) status = 'past'
    else status = 'planned'

    return { date, short, status, isToday, focus: session?.focus }
  })
}

function WeekDayCell({ day }: { day: WeekDay }) {
  const styles: Record<DayStatus, { box: string; mark: ReactNode }> = {
    today: {
      box: 'bg-olive-500 text-white',
      mark: <span className="size-1.5 rounded-full bg-white" />,
    },
    planned: {
      box: 'bg-olive-50 text-ink',
      mark: <span className="size-1.5 rounded-full bg-olive-500" />,
    },
    past: {
      box: 'bg-olive-50 text-ink-faint',
      mark: <span className="bg-ink-faint size-1.5 rounded-full" />,
    },
    rest: {
      box: 'bg-surface-sunken text-ink-faint',
      mark: <span className="text-[11px] leading-none">–</span>,
    },
  }
  const { box, mark } = styles[day.status]
  const ring = day.isToday ? 'ring-2 ring-forest-600 ring-offset-1 ring-offset-surface' : ''
  const label = [day.short, DAY_STATUS_LABEL[day.status], day.focus].filter(Boolean).join(', ')

  return (
    <div
      className={`flex h-14 flex-col items-center justify-center gap-1.5 rounded-xl ${box} ${ring}`}
      title={day.focus ?? DAY_STATUS_LABEL[day.status]}
      aria-label={label}
      aria-current={day.isToday ? 'date' : undefined}
    >
      <span className="text-[11px] font-semibold">{day.short}</span>
      <span className="flex h-3 items-center justify-center" aria-hidden="true">
        {mark}
      </span>
    </div>
  )
}

/* ---------- Tiện ích ngày & bài tập (giống trang /lich-tap) ---------- */

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** 0 = thứ Hai … 6 = Chủ nhật. */
function mondayIndex(isoDate: string): number {
  return (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7
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

/* =====================================================================
 * THÀNH PHẦN DÙNG CHUNG
 * ===================================================================== */

/** Thẻ trắng bo 23px — cùng dáng các thẻ trên trang tổng quan PT. */
function DashboardCard({
  eyebrow,
  title,
  badge,
  children,
}: {
  eyebrow: string
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <section className="border-line-subtle bg-surface rounded-[23px] border p-5 shadow-[0_2px_8px_rgb(40_55_40/0.03)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-ink-faint text-[10px] font-medium tracking-[0.08em] uppercase">
            {eyebrow}
          </p>
          <h2 className="text-ink mt-1 text-[16px] font-medium">{title}</h2>
        </div>
        {badge === undefined ? null : (
          <span className="text-accent-text shrink-0 rounded-full bg-olive-100 px-2.5 py-1 text-[11px] font-medium">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/** Một dòng số kcal cạnh vòng tiến độ: chấm màu + nhãn bên trái, số bên phải. */
function StatRow({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: 'green' | 'yellow' | 'gray'
  icon?: boolean
}) {
  const styles = {
    green: { box: 'bg-olive-50', dot: 'bg-olive-500' },
    yellow: { box: 'bg-warning-surface', dot: 'bg-warning' },
    gray: { box: 'bg-surface-sunken', dot: 'bg-ink-faint' },
  }[tone]

  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${styles.box}`}>
      <span className="text-ink-muted flex items-center gap-1.5 text-[12px]">
        {icon === true ? (
          <FlameIcon size={13} className="text-olive-500" />
        ) : (
          <span className={`size-2 rounded-full ${styles.dot}`} />
        )}
        {label}
      </span>
      <span className="text-ink text-[15px] font-semibold tabular-nums">
        {value.toLocaleString('vi-VN')}
      </span>
    </div>
  )
}

/** Một dòng trong dòng thời gian bữa ăn — theo `ScheduleItem` của console PT. */
function MealRow({
  time,
  title,
  detail,
  kcal,
  tone,
}: {
  time: string
  title: string
  detail: string
  kcal?: number
  tone: 'logged' | 'empty'
}) {
  const logged = tone === 'logged'

  return (
    <div
      className={[
        'flex items-center gap-2.5 rounded-[15px] border px-3 py-2.5',
        logged ? 'border-olive-200 bg-olive-50' : 'border-line-strong border-dashed',
      ].join(' ')}
    >
      <span className="text-ink-muted w-10 shrink-0 text-[11px] font-semibold tabular-nums">
        {time}
      </span>

      <span
        className="relative flex h-8 w-2 shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        <span
          className={`absolute h-full w-[2px] rounded-full ${logged ? 'bg-olive-400' : 'bg-line-strong'}`}
        />
        <span
          className={`border-surface relative size-2 rounded-full border-2 shadow-sm ${
            logged ? 'bg-olive-500' : 'bg-ink-faint'
          }`}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] font-semibold ${logged ? 'text-ink' : 'text-ink-faint'}`}
        >
          {title}
        </span>
        <span className="text-ink-muted block truncate text-[11px]">{detail}</span>
      </span>

      {kcal === undefined ? null : (
        <span className="text-ink shrink-0 text-[12px] font-semibold tabular-nums">
          {kcal.toLocaleString('vi-VN')} kcal
        </span>
      )}
    </div>
  )
}
