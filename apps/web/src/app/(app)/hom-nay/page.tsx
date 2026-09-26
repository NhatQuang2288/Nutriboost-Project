import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { BoIcon, ChevronRightIcon, FlameIcon, LeafIcon, PlusIcon } from '@/components/icons'
import { Disclaimer, MacroBar, ProgressRing, SafetyNotice } from '@/components/ui'
import { ensureProfileReady } from '@/lib/data/require-profile'
import { MEAL_LABELS, MEAL_ORDER, getTodayView } from '@/lib/data/today'
import { weekdayLabel } from '@/lib/date'

export const metadata: Metadata = { title: 'Hôm nay' }

// Dashboard cá nhân hoá: không được dựng tĩnh ở thời điểm build, nếu không ngày sẽ bị cũ.
export const dynamic = 'force-dynamic'

/**
 * Màn Hôm nay — bố cục theo trang tổng quan của console PT (thiết kế của Vy): lời chào, hero
 * xanh, lưới hai cột thẻ bo góc.
 *
 * Mọi con số đến từ `getTodayView`. Hero không mang khẩu hiệu cố định mà mang **gợi ý trong
 * ngày của Bơ** — thứ duy nhất trên màn thay đổi theo từng người, từng ngày.
 */
export default async function TodayPage() {
  const view = await getTodayView()
  await ensureProfileReady(view.source)
  const { targets, consumed, bmi, safety, insight } = view

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
          {/* Hero — gợi ý trong ngày của Bơ */}
          <section className="relative min-h-[210px] overflow-hidden rounded-[23px] bg-olive-100 p-5">
            <Image
              src="/images/pt/pt-hero.jpg"
              alt=""
              fill
              sizes="(min-width: 1280px) 520px, 100vw"
              className="object-cover object-right"
            />
            {/* Màn hẹp: chữ chồng lên ảnh, nên phủ đậm hơn để đọc được. */}
            <div className="absolute inset-0 bg-gradient-to-r from-olive-100 via-olive-100/90 to-olive-100/40 sm:via-olive-100/85 sm:to-transparent" />
            <div className="absolute -bottom-16 -left-12 size-40 rounded-full border-[18px] border-olive-200/60" />

            <div className="relative z-10 flex min-h-[170px] max-w-[300px] flex-col justify-center">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-olive-700 uppercase">
                Bơ · Gợi ý hôm nay
              </p>
              <h2 className="text-forest-700 text-[24px] leading-[1.15] font-bold tracking-[-0.03em]">
                {insight.headline}
              </h2>
              <p className="text-forest-600 mt-3 text-[12px] leading-relaxed">{insight.action}</p>
            </div>
          </section>

          {/* Năng lượng */}
          <DashboardCard eyebrow="Hôm nay" title="Năng lượng">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <ProgressRing value={kcalIn} max={kcalGoal}>
                <span className="text-caption text-ink-muted">
                  {overBudget ? 'Vượt mục tiêu' : 'Còn lại'}
                </span>
                <span className="text-display tabular-nums">
                  {Math.abs(remaining).toLocaleString('vi-VN')}
                </span>
                <span className="text-caption text-ink-faint">kcal</span>
              </ProgressRing>

              <div className="grid w-full flex-1 grid-cols-3 gap-2">
                <StatTile label="Mục tiêu" value={kcalGoal} tone="green" />
                <StatTile label="Đã nạp" value={kcalIn} tone="yellow" />
                <StatTile label="Đã đốt" value={view.kcalBurned} tone="gray" icon />
              </div>
            </div>
          </DashboardCard>

          {/* Đa lượng */}
          <DashboardCard eyebrow="Dinh dưỡng" title="Đa lượng hôm nay">
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
              <p className="text-caption text-ink-faint mt-4">
                Mục tiêu đã được điều chỉnh để an toàn ({targets.floorsApplied.length} yếu tố).
              </p>
            ) : null}
          </DashboardCard>
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

            <div className="border-line-subtle mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-ink-faint text-[11px]">
                Đã ghi {loggedMeals}/{MEAL_ORDER.length} bữa
              </span>
              <Link
                href="/ghi-nhan"
                className="text-accent-text flex items-center gap-1 text-[12px] font-semibold hover:underline"
              >
                <PlusIcon size={14} />
                Ghi bữa ăn
              </Link>
            </div>
          </DashboardCard>

          {/* Lịch tập */}
          <Link
            href="/lich-tap"
            className="border-line-subtle bg-surface group flex items-center justify-between gap-3 rounded-[23px] border p-5 shadow-[0_2px_8px_rgb(40_55_40/0.03)] transition-colors duration-(--duration-fast) hover:bg-olive-50"
          >
            <span className="flex items-center gap-3">
              <span className="text-forest-600 flex size-10 shrink-0 items-center justify-center rounded-xl bg-olive-100">
                <FlameIcon size={18} />
              </span>
              <span>
                <span className="text-ink block text-[14px] font-semibold">Lịch tập tuần này</span>
                <span className="text-ink-muted block text-[12px]">
                  Xem buổi tập hôm nay và kcal đốt
                </span>
              </span>
            </span>
            <ChevronRightIcon
              size={18}
              className="text-ink-faint shrink-0 transition-transform group-hover:translate-x-1"
            />
          </Link>

          {/* Chỉ số cơ thể */}
          <DashboardCard eyebrow="Cơ thể" title="Chỉ số cơ thể">
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
              Phân loại theo ngưỡng dành cho người châu Á.
            </p>
          </DashboardCard>
        </div>
      </div>

      <Disclaimer />
    </div>
  )
}

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

/** Ô số nhỏ, như ba ô "Checked in / Need review / Not updated" của console PT. */
function StatTile({
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
    <div className={`rounded-[15px] p-3 ${styles.box}`}>
      <div className="flex items-center gap-1.5">
        {icon === true ? (
          <FlameIcon size={13} className="text-olive-500" />
        ) : (
          <span className={`size-2 rounded-full ${styles.dot}`} />
        )}
        <span className="text-ink text-[17px] font-semibold tabular-nums">
          {value.toLocaleString('vi-VN')}
        </span>
      </div>
      <p className="text-ink-muted mt-1 text-[11px]">{label}</p>
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
