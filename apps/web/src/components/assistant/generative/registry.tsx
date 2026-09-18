'use client'

import { GENERATIVE_COMPONENTS, type GenerativePayload } from '@nutriboost/ai/schemas'

import {
  ChoiceChips,
  FoodCandidateChips,
  MealConfirmCard,
  MealLoggedReceipt,
  PlanPreviewWeek,
  ProgressChartCard,
  SafetyNoticeCard,
  TargetSummaryCard,
} from './components'

/**
 * Sổ đăng ký component generative UI.
 *
 * ĐÂY LÀ HÀNG RÀO AN NINH, không phải bảng tra tiện lợi.
 * Model chỉ được yêu cầu dựng những thành phần có tên trong sổ này, và props phải
 * khớp schema tương ứng. Tên lạ → thẻ dự phòng.
 *
 * Không `eval`. Không `import()` theo tên do model sinh.
 */

const REGISTRY = {
  food_candidate_chips: FoodCandidateChips,
  meal_confirm_card: MealConfirmCard,
  meal_logged_receipt: MealLoggedReceipt,
  target_summary_card: TargetSummaryCard,
  progress_chart_card: ProgressChartCard,
  plan_preview_week: PlanPreviewWeek,
  safety_notice_card: SafetyNoticeCard,
  choice_chips: ChoiceChips,
} as const

export type RegisteredComponentName = keyof typeof REGISTRY

/** Số thành phần đã đăng ký — test E2E đối chiếu với `GENERATIVE_COMPONENTS`. */
export const REGISTERED_COMPONENT_NAMES = Object.keys(REGISTRY) as RegisteredComponentName[]

export function isRegisteredComponent(name: string): name is RegisteredComponentName {
  return Object.prototype.hasOwnProperty.call(REGISTRY, name)
}

/** Mọi tên trong schema phải có component tương ứng, và ngược lại. */
export function registryMatchesSchema(): boolean {
  const schemaNames = Object.keys(GENERATIVE_COMPONENTS).sort()
  const registryNames = [...REGISTERED_COMPONENT_NAMES].sort()
  return (
    schemaNames.length === registryNames.length &&
    schemaNames.every((name, index) => name === registryNames[index])
  )
}

/**
 * Dựng một phần giao diện từ payload đã được kiểm tra.
 *
 * Trả về thẻ dự phòng khi tên không có trong sổ đăng ký — giao diện không bao giờ
 * được vỡ vì model trả về thứ lạ.
 */
export function GenerativePart({ payload }: { payload: GenerativePayload }) {
  if (!isRegisteredComponent(payload.component)) {
    return <UnknownPart name={String(payload.component)} />
  }

  const Component = REGISTRY[payload.component] as unknown as (props: {
    props: unknown
  }) => React.ReactElement

  return <Component props={payload.props} />
}

/** Thẻ dự phòng khi model yêu cầu một thành phần không có trong sổ đăng ký. */
export function UnknownPart({ name }: { name: string }) {
  return (
    <div className="border-line-strong bg-surface-sunken rounded-lg border border-dashed p-3">
      <p className="text-caption text-ink-muted">
        Mình chưa hiển thị được phần này ({name}). Nội dung vẫn được giữ nguyên trong hội thoại.
      </p>
    </div>
  )
}
