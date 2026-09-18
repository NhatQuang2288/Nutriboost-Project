'use client'

import { useState } from 'react'
import type { z } from 'zod'
// Chỉ dùng ở vị trí kiểu (`typeof GENERATIVE_COMPONENTS`) — không cần giá trị lúc chạy.
import type { GENERATIVE_COMPONENTS } from '@nutriboost/ai/schemas'

import { AlertIcon, CheckIcon, InfoIcon } from '@/components/icons'

/**
 * Các thành phần giao diện mà trợ lý có thể dựng ra trong hội thoại.
 *
 * Mọi props đã được zod kiểm tra trước khi tới đây (xem `generative/registry.tsx`).
 * Những component này KHÔNG tự tính toán dinh dưỡng — con số do server gửi xuống.
 */

type Props<K extends keyof typeof GENERATIVE_COMPONENTS> = z.infer<
  (typeof GENERATIVE_COMPONENTS)[K]
>

/* ------------------------------------------------------------------------- */

export function FoodCandidateChips({ props }: { props: Props<'food_candidate_chips'> }) {
  return (
    <div className="border-line-subtle bg-surface rounded-lg border p-3">
      <p className="text-caption text-ink-muted mb-2">{props.promptText}</p>
      <div className="flex flex-wrap gap-2">
        {props.candidates.map((candidate) => (
          <span
            key={candidate.foodId}
            className="text-caption text-accent-text rounded-full border border-olive-200 bg-olive-100 px-3 py-1.5"
          >
            {candidate.nameVi}
            <span className="text-ink-faint"> · {Math.round(candidate.kcalPer100g)} kcal/100g</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function MealConfirmCard({ props }: { props: Props<'meal_confirm_card'> }) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="border-line bg-surface rounded-lg border shadow-sm">
      <div className="border-line-subtle border-b px-4 py-3">
        <p className="text-body text-ink font-semibold">{props.title}</p>
        <p className="text-caption text-ink-faint">“{props.rawInput}”</p>
      </div>

      <ul className="divide-line-subtle flex flex-col divide-y">
        {props.items.map((item, index) => (
          <li
            key={`${item.displayName}-${index}`}
            className="flex items-baseline justify-between gap-3 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-body text-ink truncate">{item.displayName}</p>
              <p className="text-caption text-ink-faint">
                {item.grams} g{item.confidence < 0.6 ? ' · mình chưa chắc lắm' : ''}
              </p>
            </div>
            <span className="text-caption text-ink-muted shrink-0 tabular-nums">
              {item.kcal} kcal
            </span>
          </li>
        ))}
      </ul>

      <div className="border-line-subtle flex items-center justify-between border-t px-4 py-3">
        <div>
          <p className="text-body text-ink font-semibold tabular-nums">{props.total.kcal} kcal</p>
          <p className="text-caption text-ink-faint tabular-nums">
            Đạm {props.total.proteinG} g · Tinh bột {props.total.carbG} g · Béo {props.total.fatG} g
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmed(true)}
          disabled={confirmed}
          className="touch-target bg-forest-600 text-label text-ink-inverse disabled:text-ink-faint rounded-md px-4 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300"
        >
          {confirmed ? 'Đã lưu' : props.needsConfirmation ? 'Đúng rồi' : 'Lưu bữa này'}
        </button>
      </div>

      {confirmed ? (
        <p className="border-line-subtle text-caption text-accent-text flex items-center gap-1.5 border-t px-4 py-2">
          <CheckIcon size={14} /> Đã ghi vào nhật ký hôm nay.
        </p>
      ) : null}
    </div>
  )
}

export function MealLoggedReceipt({ props }: { props: Props<'meal_logged_receipt'> }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-olive-200 bg-olive-50 px-4 py-3">
      <div className="text-accent-text flex items-center gap-2">
        <CheckIcon size={18} />
        <span className="text-body font-semibold">Đã ghi bữa ăn</span>
      </div>
      <div className="text-right">
        <p className="text-body text-ink tabular-nums">{props.total.kcal} kcal</p>
        <p className="text-caption text-ink-faint tabular-nums">Còn {props.remainingKcal} kcal</p>
      </div>
    </div>
  )
}

export function TargetSummaryCard({ props }: { props: Props<'target_summary_card'> }) {
  return (
    <div className="border-line-subtle bg-surface rounded-lg border p-4">
      <dl className="flex flex-col gap-1.5">
        <Row label="Chuyển hoá cơ bản" value={`${props.bmrKcal} kcal`} />
        <Row label="Tiêu hao mỗi ngày" value={`${props.tdeeKcal} kcal`} />
        <Row label="Mục tiêu" value={`${props.targetKcal} kcal`} strong />
      </dl>
      <p className="text-caption text-ink-muted mt-3">{props.explanation}</p>
    </div>
  )
}

export function ProgressChartCard({ props }: { props: Props<'progress_chart_card'> }) {
  const max = Math.max(...props.points.map((point) => point.value), 1)

  return (
    <div className="border-line-subtle bg-surface rounded-lg border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-caption text-ink-muted">{props.rangeLabel}</p>
        <p className="text-caption text-ink-faint">{props.trendLabel}</p>
      </div>
      {/* Biểu đồ cột nhẹ, không kéo thư viện biểu đồ vào luồng chat. */}
      <div className="flex h-24 items-end gap-1.5" role="img" aria-label={props.trendLabel}>
        {props.points.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
            className="flex-1 rounded-t-sm bg-olive-500"
            style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
            title={`${point.label}: ${point.value} ${props.unit}`}
          />
        ))}
      </div>
    </div>
  )
}

export function PlanPreviewWeek({ props }: { props: Props<'plan_preview_week'> }) {
  return (
    <div className="border-line-subtle bg-surface rounded-lg border p-4">
      <p className="text-caption text-ink-muted mb-3">Tuần bắt đầu {props.weekStart}</p>
      <ul className="flex flex-col gap-2">
        {props.days.map((day) => (
          <li key={day.dayLabel} className="flex items-baseline justify-between gap-3">
            <span className="text-body text-ink">{day.dayLabel}</span>
            <span className="text-caption text-ink-faint">
              {day.meals.map((meal) => meal.displayName).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SafetyNoticeCard({ props }: { props: Props<'safety_notice_card'> }) {
  const tone =
    props.severity === 'refer'
      ? 'border-danger/30 bg-danger-surface text-danger-text'
      : 'border-warning/30 bg-warning-surface text-warning-text'

  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <p className="text-body mb-2 flex items-center gap-2 font-semibold">
        {props.severity === 'refer' ? <AlertIcon size={18} /> : <InfoIcon size={18} />}
        {props.severity === 'refer' ? 'Cần chuyên gia xem qua' : 'Lưu ý'}
      </p>
      <ul className="flex flex-col gap-1.5">
        {props.reasons.map((reason) => (
          <li key={reason} className="text-caption">
            · {reason}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChoiceChips({ props }: { props: Props<'choice_chips'> }) {
  const [chosen, setChosen] = useState<string | null>(null)

  return (
    <div className="border-line-subtle bg-surface rounded-lg border p-3">
      <p className="text-body text-ink mb-2">{props.question}</p>
      <div className="flex flex-wrap gap-2">
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setChosen(option.value)}
            className={`touch-target text-caption rounded-full border px-4 transition-colors duration-(--duration-fast) ${
              chosen === option.value
                ? 'border-forest-600 bg-forest-600 text-ink-inverse'
                : 'text-accent-text border-olive-200 bg-olive-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd
        className={`text-caption tabular-nums ${strong === true ? 'text-ink font-semibold' : 'text-ink'}`}
      >
        {value}
      </dd>
    </div>
  )
}
