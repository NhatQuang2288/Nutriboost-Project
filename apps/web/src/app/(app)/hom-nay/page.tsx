import type { Metadata } from 'next'

import Link from 'next/link'

import { BoIcon, ChevronRightIcon, FlameIcon, LeafIcon, SparkIcon } from '@/components/icons'
import {
  Card,
  Disclaimer,
  ProgressRing,
  MacroBar,
  SafetyNotice,
  SectionTitle,
} from '@/components/ui'
import { ensureProfileReady } from '@/lib/data/require-profile'
import { MEAL_LABELS, MEAL_ORDER, getTodayView } from '@/lib/data/today'
import { weekdayLabel } from '@/lib/date'

export const metadata: Metadata = { title: 'Hôm nay' }

// Dashboard cá nhân hoá: không được dựng tĩnh ở thời điểm build, nếu không ngày sẽ bị cũ.
export const dynamic = 'force-dynamic'

export default async function TodayPage() {
  const view = await getTodayView()
  await ensureProfileReady(view.source)
  const { targets, consumed, bmi, safety, insight } = view

  const kcalGoal = targets.targetKcal
  const kcalIn = consumed.kcal
  const remaining = view.remainingKcal
  const overBudget = remaining < 0

  return (
    <div className="flex flex-col gap-5">
      {view.source === 'demo' ? (
        /*
         * Nói thẳng đây là dữ liệu mẫu. Không có dòng này thì một lần chạy chưa cấu hình
         * Supabase vẫn hiện "Chào Minh" kèm 2.120 kcal như thể đó là hồ sơ của người đang xem.
         */
        <p className="border-info/30 bg-info-surface text-info-text text-caption rounded-lg border px-3 py-2">
          Đang hiện dữ liệu mẫu. Hồ sơ của bạn chưa được thiết lập nên các con số dưới đây không
          phải của bạn.
        </p>
      ) : null}

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-ink-muted capitalize">
            {weekdayLabel(new Date(), 'Asia/Ho_Chi_Minh')}
          </p>
          <h1 className="text-h1">Chào {view.profile.fullName}</h1>
        </div>
        <span className="text-forest-600 flex size-11 items-center justify-center rounded-full bg-olive-100">
          <BoIcon size={26} state="idle" />
        </span>
      </header>

      {safety.level === 'ok' ? null : (
        <SafetyNotice>
          <strong className="font-semibold">Lưu ý an toàn. </strong>
          {safety.reasons.join(' ')}
        </SafetyNotice>
      )}

      <Card className="flex flex-col items-center gap-4">
        <ProgressRing value={kcalIn} max={kcalGoal}>
          <span className="text-caption text-ink-muted">
            {overBudget ? 'Vượt mục tiêu' : 'Còn lại'}
          </span>
          <span className="text-display tabular-nums">
            {Math.abs(remaining).toLocaleString('vi-VN')}
          </span>
          <span className="text-caption text-ink-faint">kcal</span>
        </ProgressRing>

        <div className="border-line-subtle flex w-full items-center justify-around border-t pt-4 text-center">
          <Stat label="Mục tiêu" value={kcalGoal} />
          <Stat label="Đã nạp" value={kcalIn} />
          <Stat label="Đã đốt" value={view.kcalBurned} icon />
        </div>
      </Card>

      <Card>
        <SectionTitle>Đa lượng hôm nay</SectionTitle>
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
          <MacroBar label="Chất béo" value={consumed.fatG} target={targets.fatG} tone="olive-700" />
        </div>
        {targets.floorsApplied.length > 0 ? (
          <p className="text-caption text-ink-faint mt-4">
            Mục tiêu đã được điều chỉnh để an toàn ({targets.floorsApplied.length} yếu tố).
          </p>
        ) : null}
      </Card>

      <Card className="border-olive-200 bg-olive-50">
        <div className="flex gap-3">
          <span className="text-accent-text mt-0.5">
            <SparkIcon size={20} />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-body text-ink font-semibold">{insight.headline}</p>
            <p className="text-body text-ink-muted">{insight.action}</p>
            <span className="text-micro text-ink-faint">BƠ · MỘT GỢI Ý MỖI NGÀY</span>
          </div>
        </div>
      </Card>

      <Link
        href="/lich-tap"
        className="border-line bg-surface flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors duration-(--duration-fast) hover:border-olive-200"
      >
        <span className="flex items-center gap-3">
          <span className="text-forest-600 flex size-9 shrink-0 items-center justify-center rounded-full bg-olive-100">
            <FlameIcon size={18} />
          </span>
          <span>
            <span className="text-body text-ink block font-semibold">Lịch tập tuần này</span>
            <span className="text-caption text-ink-muted block">
              Xem buổi tập hôm nay và kcal đốt
            </span>
          </span>
        </span>
        <ChevronRightIcon size={18} className="text-ink-faint shrink-0" />
      </Link>

      <section>
        <SectionTitle
          action={
            <span className="text-caption text-ink-faint">{view.streakDays} ngày liên tiếp</span>
          }
        >
          Bữa ăn hôm nay
        </SectionTitle>

        <div className="flex flex-col gap-3">
          {MEAL_ORDER.map((mealType) => {
            const meal = view.meals.find((item) => item.mealType === mealType)
            if (meal === undefined) {
              return (
                <div
                  key={mealType}
                  className="border-line-strong flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
                >
                  <span className="text-body text-ink-faint">{MEAL_LABELS[mealType]}</span>
                  <span className="text-caption text-ink-faint">Chưa ghi</span>
                </div>
              )
            }
            return (
              <Card key={mealType} as="article">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-h3">{MEAL_LABELS[mealType]}</h3>
                  <span className="text-caption text-ink-faint tabular-nums">
                    {meal.timeLabel} · {meal.total.kcal} kcal
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3">
                      <span className="text-body text-ink">
                        {item.nameVi}
                        <span className="text-ink-faint"> · {item.grams} g</span>
                      </span>
                      <span className="text-caption text-ink-muted tabular-nums">
                        {item.nutrients.kcal} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      </section>

      <Card>
        <SectionTitle>Chỉ số cơ thể</SectionTitle>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-display tabular-nums">{bmi.bmi}</p>
            <p className="text-caption text-ink-muted">BMI · {bmi.label}</p>
          </div>
          <div className="text-right">
            <p className="text-h2 tabular-nums">{view.profile.weightKg} kg</p>
            <p className="text-caption text-ink-muted">Cân nặng gần nhất</p>
          </div>
        </div>
        <p className="text-caption text-ink-faint mt-3 flex items-center gap-1.5">
          <LeafIcon size={14} />
          Phân loại theo ngưỡng dành cho người châu Á.
        </p>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-h3 text-ink flex items-center gap-1 tabular-nums">
        {icon === true ? <FlameIcon size={15} className="text-olive-500" /> : null}
        {value.toLocaleString('vi-VN')}
      </span>
      <span className="text-caption text-ink-faint">{label}</span>
    </div>
  )
}
