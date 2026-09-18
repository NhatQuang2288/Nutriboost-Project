import type { Metadata } from 'next'

import { BoIcon, CheckIcon, InfoIcon, RepeatIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { MEAL_LABELS, type MealType } from '@/lib/data/today'
import { getWeeklyPlan } from '@/lib/data/plan'

export const metadata: Metadata = { title: 'Kế hoạch' }
export const dynamic = 'force-dynamic'

export default function PlanPage() {
  const { plan, targetKcal, weekLabel } = getWeeklyPlan()

  const isEmpty = plan.days.length === 0

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Kế hoạch tuần</h1>
        <p className="text-caption text-ink-muted">
          Thực đơn 7 ngày dựng từ mục tiêu {targetKcal.toLocaleString('vi-VN')} kcal của bạn.
        </p>
      </header>

      {isEmpty ? (
        <Card className="border-warning/30 bg-warning-surface">
          <p className="text-body text-warning-text font-semibold">Chưa dựng được kế hoạch</p>
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
                  Trung bình {plan.averageKcal.toLocaleString('vi-VN')} kcal và{' '}
                  {plan.averageProteinG} g đạm mỗi ngày. Mục tiêu là{' '}
                  {targetKcal.toLocaleString('vi-VN')} kcal.
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
            <SectionTitle
              action={
                <span className="text-caption text-ink-faint">
                  {plan.days.length} ngày · {plan.days[0]?.meals.length ?? 0} bữa mỗi ngày
                </span>
              }
            >
              Thực đơn
            </SectionTitle>

            {plan.days.map((day) => {
              const deviation = Math.abs(day.totalKcal - targetKcal) / targetKcal
              const onTarget = deviation <= 0.1

              return (
                <Card key={day.date} as="article">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="text-h3">{dayLabel(day.date)}</h3>
                    <span
                      className={`text-caption tabular-nums ${onTarget ? 'text-accent-text' : 'text-warning-text'}`}
                    >
                      {day.totalKcal.toLocaleString('vi-VN')} kcal
                      {onTarget ? null : ' · lệch mục tiêu'}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {day.meals.flatMap((meal) =>
                      meal.items.map((item) => (
                        <li
                          key={`${meal.mealType}-${item.slug}`}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-body text-ink">
                            {item.nameVi}
                            <span className="text-ink-faint">
                              {' '}
                              · {MEAL_LABELS[meal.mealType as MealType]} · {item.grams} g
                            </span>
                          </span>
                          <span className="text-caption text-ink-muted tabular-nums">
                            {item.kcal} kcal
                          </span>
                        </li>
                      )),
                    )}
                  </ul>

                  <p className="text-caption text-ink-faint mt-3 tabular-nums">
                    Đạm {day.totalProteinG} g
                  </p>
                </Card>
              )
            })}
          </section>

          <button
            type="button"
            className="bg-forest-600 text-ink-inverse text-label min-h-12 w-full rounded-md px-6 font-semibold transition-colors duration-(--duration-fast)"
          >
            <span className="inline-flex items-center gap-2">
              <CheckIcon size={18} />
              Dùng kế hoạch này
            </span>
          </button>
        </>
      )}

      <Card>
        <SectionTitle>Kế hoạch này được dựng thế nào</SectionTitle>
        <ul className="text-body text-ink-muted flex flex-col gap-2">
          <li className="flex items-start gap-2">
            <RepeatIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Mục tiêu kcal trong ngày được chia cho từng bữa theo tỉ lệ chuẩn, rồi chọn món và nhân
            khẩu phần cho vừa mục tiêu.
          </li>
          <li className="flex items-start gap-2">
            <RepeatIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Khẩu phần bị kẹp trong khoảng 0,5–2 lần khẩu phần chuẩn, nên không bao giờ có đề xuất
            kiểu “3,7 bát cơm” chỉ để khớp con số.
          </li>
          <li className="flex items-start gap-2">
            <RepeatIcon size={16} className="text-ink-faint mt-1 shrink-0" />
            Mọi con số tính bằng công thức trong mã nguồn, không phải do AI đoán.
          </li>
        </ul>
      </Card>

      <Disclaimer />
    </div>
  )
}

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return `${WEEKDAYS[index] ?? ''} ${day}/${month}`
}
