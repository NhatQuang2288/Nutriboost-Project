'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import {
  type ActivityLevel,
  type Goal,
  type Sex,
  ACTIVITY_LABELS,
  BMI_LABELS,
  assessSafety,
  computeBmi,
  computeEnergyTargets,
} from '@nutriboost/nutrition'

import { BoIcon, BoMascot, CheckIcon, ChevronLeftIcon } from '@/components/icons'
import { Card, Disclaimer, SafetyNotice } from '@/components/ui'
import { completeOnboardingAction } from '@/lib/actions/onboarding'

/**
 * Onboarding — 5 câu hỏi, mỗi câu một màn.
 *
 * Mục tiêu của luồng này là **dưới 60 giây** và chỉ hai câu phải gõ số (chiều cao, cân nặng).
 * Mọi thứ khác là chọn.
 *
 * Kết quả hiện ra ngay ở bước cuối vì toàn bộ phép tính nằm ở `@nutriboost/nutrition` —
 * hàm thuần, chạy được ngay trên trình duyệt, không cần chờ máy chủ.
 */

type StepId = 'sex' | 'age' | 'body' | 'activity' | 'goal' | 'result'

const STEPS: readonly StepId[] = ['sex', 'age', 'body', 'activity', 'goal', 'result']

interface Answers {
  sex: Sex | null
  age: number | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: ActivityLevel | null
  goal: Goal | null
}

const INITIAL: Answers = {
  sex: null,
  age: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  goal: null,
}

const GOAL_OPTIONS: readonly { value: Goal; label: string; hint: string }[] = [
  { value: 'lose', label: 'Giảm cân', hint: 'Giảm mỡ, giữ khối nạc' },
  { value: 'maintain', label: 'Giữ cân', hint: 'Ăn đủ theo nhu cầu' },
  { value: 'gain', label: 'Tăng cân', hint: 'Tăng cân từ từ, lành mạnh' },
]

export function OnboardingFlow({ next }: { next?: string }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(INITIAL)

  const step = STEPS[stepIndex] ?? 'sex'
  const totalQuestions = STEPS.length - 1

  const update = (patch: Partial<Answers>): void => {
    setAnswers((current) => ({ ...current, ...patch }))
  }

  const goNext = (): void => {
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1))
  }

  const goBack = (): void => {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  // Kết quả chỉ tính khi đã đủ dữ liệu — mọi con số đi qua lõi tất định.
  const result = useMemo(() => {
    const { sex, age, heightCm, weightKg, activityLevel, goal } = answers
    if (
      sex === null ||
      age === null ||
      heightCm === null ||
      weightKg === null ||
      activityLevel === null ||
      goal === null
    ) {
      return null
    }

    const targets = computeEnergyTargets({
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
      rateKgPerWeek: goal === 'maintain' ? undefined : 0.35,
    })
    const bmi = computeBmi(weightKg, heightCm, 'asia')
    const safety = assessSafety({ bmi: bmi.bmi, age, goal, medicalFlags: [] })

    return { targets, bmi, safety }
  }, [answers])

  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[var(--width-content)] px-4 pt-4">
        <div className="mb-3 flex items-center gap-3">
          {stepIndex > 0 && step !== 'result' ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Quay lại"
              className="text-ink-muted touch-target -ml-2 flex size-10 items-center justify-center rounded-md"
            >
              <ChevronLeftIcon size={20} />
            </button>
          ) : null}

          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200"
            role="progressbar"
            aria-label="Tiến độ thiết lập hồ sơ"
            aria-valuemin={0}
            aria-valuemax={totalQuestions}
            aria-valuenow={Math.min(stepIndex, totalQuestions)}
          >
            <div
              className="h-full rounded-full bg-olive-500 transition-[width] duration-(--duration-base)"
              style={{ width: `${(Math.min(stepIndex, totalQuestions) / totalQuestions) * 100}%` }}
            />
          </div>

          <span className="text-caption text-ink-faint tabular-nums">
            {Math.min(stepIndex + 1, totalQuestions)}/{totalQuestions}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[var(--width-content)] flex-1 flex-col px-4 pb-8">
        {step === 'sex' ? (
          <ChoiceStep
            title="Bạn là"
            subtitle="Dùng để tính chuyển hoá cơ bản."
            options={[
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
            ]}
            selected={answers.sex}
            onSelect={(value) => {
              update({ sex: value as Sex })
              goNext()
            }}
          />
        ) : null}

        {step === 'age' ? (
          <NumberStep
            title="Bạn bao nhiêu tuổi?"
            subtitle="Tuổi ảnh hưởng tới chuyển hoá cơ bản."
            value={answers.age}
            min={14}
            max={100}
            unit="tuổi"
            onChange={(value) => update({ age: value })}
            onNext={goNext}
          />
        ) : null}

        {step === 'body' ? (
          <BodyStep
            heightCm={answers.heightCm}
            weightKg={answers.weightKg}
            onChange={(patch) => update(patch)}
            onNext={goNext}
          />
        ) : null}

        {step === 'activity' ? (
          <ChoiceStep
            title="Một tuần bạn vận động thế nào?"
            subtitle="Chọn mức gần đúng nhất, chỉnh lại sau cũng được."
            options={(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => ({
              value: level,
              label: ACTIVITY_LABELS[level],
            }))}
            selected={answers.activityLevel}
            onSelect={(value) => {
              update({ activityLevel: value as ActivityLevel })
              goNext()
            }}
            vertical
          />
        ) : null}

        {step === 'goal' ? (
          <ChoiceStep
            title="Mục tiêu của bạn"
            subtitle="Bơ sẽ tính mục tiêu năng lượng theo lựa chọn này."
            options={GOAL_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              hint: option.hint,
            }))}
            selected={answers.goal}
            onSelect={(value) => {
              update({ goal: value as Goal })
              goNext()
            }}
            vertical
          />
        ) : null}

        {step === 'result' ? (
          result === null ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-body text-ink-muted">Thiếu dữ liệu, bạn quay lại giúp mình nhé.</p>
            </div>
          ) : (
            <ResultStep
              targetKcal={result.targets.targetKcal}
              bmrKcal={result.targets.bmrKcal}
              tdeeKcal={result.targets.tdeeKcal}
              proteinG={result.targets.proteinG}
              carbG={result.targets.carbG}
              fatG={result.targets.fatG}
              bmiLabel={`${result.bmi.bmi} · ${BMI_LABELS[result.bmi.category]}`}
              safetyLevel={result.safety.level}
              safetyReasons={result.safety.reasons}
              answers={answers}
              next={next}
            />
          )
        ) : null}
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------------- */

function QuestionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-4 mb-6 flex flex-col gap-2">
      <h1 className="text-h1">{title}</h1>
      <p className="text-body text-ink-muted">{subtitle}</p>
    </div>
  )
}

function ChoiceStep({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  vertical,
}: {
  title: string
  subtitle: string
  options: readonly { value: string; label: string; hint?: string }[]
  selected: string | null
  onSelect: (value: string) => void
  vertical?: boolean
}) {
  return (
    <section className="flex flex-1 flex-col">
      <QuestionHeader title={title} subtitle={subtitle} />

      <div className={`flex gap-3 ${vertical === true ? 'flex-col' : 'flex-row'}`}>
        {options.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={isSelected}
              className={`flex min-h-14 flex-1 flex-col items-start justify-center rounded-lg border px-4 py-3 text-left transition-colors duration-(--duration-fast) ${
                isSelected
                  ? 'border-forest-600 bg-forest-600 text-ink-inverse'
                  : 'border-line bg-surface text-ink'
              }`}
            >
              <span className="text-body font-semibold">{option.label}</span>
              {option.hint === undefined ? null : (
                <span
                  className={`text-caption ${isSelected ? 'text-ink-inverse' : 'text-ink-muted'}`}
                >
                  {option.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function NumberStep({
  title,
  subtitle,
  value,
  min,
  max,
  unit,
  onChange,
  onNext,
}: {
  title: string
  subtitle: string
  value: number | null
  min: number
  max: number
  unit: string
  onChange: (value: number | null) => void
  onNext: () => void
}) {
  const valid = value !== null && value >= min && value <= max

  return (
    <section className="flex flex-1 flex-col">
      <QuestionHeader title={title} subtitle={subtitle} />

      <div className="border-line bg-surface focus-within:border-forest-600 flex items-center gap-3 rounded-lg border px-4 py-3">
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={value ?? ''}
          min={min}
          max={max}
          aria-label={title}
          placeholder={`${min}–${max}`}
          onChange={(event) => {
            const raw = event.target.value
            if (raw === '') {
              onChange(null)
              return
            }
            const parsed = Number(raw)
            onChange(Number.isFinite(parsed) ? parsed : null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && valid) onNext()
          }}
          className="text-display text-ink w-full bg-transparent tabular-nums outline-none"
        />
        <span className="text-body text-ink-faint shrink-0">{unit}</span>
      </div>

      <PrimaryButton disabled={!valid} onClick={onNext}>
        Tiếp tục
      </PrimaryButton>
    </section>
  )
}

function BodyStep({
  heightCm,
  weightKg,
  onChange,
  onNext,
}: {
  heightCm: number | null
  weightKg: number | null
  onChange: (patch: Partial<Answers>) => void
  onNext: () => void
}) {
  const valid =
    heightCm !== null &&
    heightCm >= 120 &&
    heightCm <= 220 &&
    weightKg !== null &&
    weightKg >= 30 &&
    weightKg <= 250

  return (
    <section className="flex flex-1 flex-col">
      <QuestionHeader
        title="Chiều cao và cân nặng"
        subtitle="Hai câu duy nhất cần gõ số. Bạn có thể cập nhật lại bất cứ lúc nào."
      />

      <div className="flex flex-col gap-3">
        <Field
          label="Chiều cao"
          unit="cm"
          value={heightCm}
          min={120}
          max={220}
          autoFocus
          onChange={(value) => onChange({ heightCm: value })}
        />
        <Field
          label="Cân nặng"
          unit="kg"
          value={weightKg}
          min={30}
          max={250}
          onChange={(value) => onChange({ weightKg: value })}
        />
      </div>

      <PrimaryButton disabled={!valid} onClick={onNext}>
        Tiếp tục
      </PrimaryButton>
    </section>
  )
}

function Field({
  label,
  unit,
  value,
  min,
  max,
  autoFocus,
  onChange,
}: {
  label: string
  unit: string
  value: number | null
  min: number
  max: number
  autoFocus?: boolean
  onChange: (value: number | null) => void
}) {
  return (
    <label className="border-line bg-surface focus-within:border-forest-600 flex items-center gap-3 rounded-lg border px-4 py-3">
      <span className="text-body text-ink-muted w-24 shrink-0">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value ?? ''}
        min={min}
        max={max}
        aria-label={label}
        placeholder={`${min}–${max}`}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          onChange(event.target.value === '' ? null : parsed)
        }}
        className="text-h2 text-ink w-full bg-transparent tabular-nums outline-none"
      />
      <span className="text-body text-ink-faint shrink-0">{unit}</span>
    </label>
  )
}

function ResultStep({
  targetKcal,
  bmrKcal,
  tdeeKcal,
  proteinG,
  carbG,
  fatG,
  bmiLabel,
  safetyLevel,
  safetyReasons,
  answers,
  next,
}: {
  targetKcal: number
  bmrKcal: number
  tdeeKcal: number
  proteinG: number
  carbG: number
  fatG: number
  bmiLabel: string
  safetyLevel: 'ok' | 'caution' | 'refer'
  safetyReasons: readonly string[]
  /** Câu trả lời gốc, để gửi lên máy chủ khi lưu hồ sơ. */
  answers: Answers
  /**
   * Nơi cần tới sau khi thiết lập xong. Có giá trị khi người dùng bị đưa qua onboarding từ
   * một liên kết sâu — ví dụ liên kết mời khách `/tham-gia?ma=…`. Không giữ lại thì mã mời
   * rơi mất ở giữa luồng và khách phải nhờ PT gửi lại.
   */
  next?: string
}) {
  const router = useRouter()
  const [consent, setConsent] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  /**
   * Lưu hồ sơ rồi mới đi tiếp.
   *
   * Trước đây nút này là một liên kết thẳng vào ứng dụng, và onboarding **không ghi gì cả** —
   * câu trả lời chỉ nằm trong bộ nhớ trình duyệt. Hệ quả: `/auth/callback` thấy
   * `profiles.onboarded_at` vẫn null nên lần đăng nhập sau lại đưa qua onboarding, mãi mãi.
   *
   * Đi tiếp chỉ khi máy chủ xác nhận đã lưu. Nếu lưu hỏng mà vẫn đi tiếp thì người dùng vào
   * ứng dụng với hồ sơ mẫu và không biết vì sao mọi con số đều sai.
   */
  function submit(): void {
    if (!consent || pending) return

    const form = new FormData()
    form.set('sex', answers.sex ?? '')
    form.set('age', String(answers.age ?? ''))
    form.set('heightCm', String(answers.heightCm ?? ''))
    form.set('weightKg', String(answers.weightKg ?? ''))
    form.set('activityLevel', answers.activityLevel ?? '')
    form.set('goal', answers.goal ?? '')
    form.set('consent', 'true')

    startTransition(async () => {
      const result = await completeOnboardingAction(form)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.push((next ?? '/hom-nay') as Route)
    })
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-5 text-center">
      <BoMascot size={132} />

      <div>
        <h1 className="text-h1">Xong rồi!</h1>
        <p className="text-body text-ink-muted mt-1">
          Đây là mục tiêu của bạn, tính bằng công thức chứ không phải do AI đoán.
        </p>
      </div>

      <Card className="w-full">
        <p className="text-caption text-ink-muted">Mục tiêu mỗi ngày</p>
        <p className="text-display-lg text-ink tabular-nums">
          {targetKcal.toLocaleString('vi-VN')}
          <span className="text-h3 text-ink-faint"> kcal</span>
        </p>
        <dl className="border-line-subtle mt-3 flex flex-col gap-1.5 border-t pt-3 text-left">
          <Row label="Chuyển hoá cơ bản" value={`${bmrKcal.toLocaleString('vi-VN')} kcal`} />
          <Row label="Tiêu hao mỗi ngày" value={`${tdeeKcal.toLocaleString('vi-VN')} kcal`} />
          <Row label="Đạm · Tinh bột · Béo" value={`${proteinG} · ${carbG} · ${fatG} g`} />
          <Row label="BMI" value={bmiLabel} />
        </dl>
      </Card>

      {safetyLevel === 'ok' ? null : <SafetyNotice>{safetyReasons.join(' ')}</SafetyNotice>}

      <div className="flex w-full flex-col gap-3 text-left">
        {/*
         * Đồng ý xử lý dữ liệu sức khoẻ là bắt buộc, và phải là hành động chủ động: kho lưu
         * `consents` là bằng chứng pháp lý cho việc xử lý dữ liệu nhạy cảm, nên nó không
         * được sinh ra từ một nút "Tiếp tục" mà người dùng bấm cho việc khác.
         */}
        <label className="border-line bg-surface flex cursor-pointer items-start gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              if (error !== null) setError(null)
            }}
            className="accent-forest-600 mt-0.5 size-4 shrink-0"
          />
          <span className="text-caption text-ink-muted">
            Tôi đồng ý cho NutriBoost xử lý dữ liệu sức khoẻ của tôi (chiều cao, cân nặng, mục tiêu)
            để tạo gợi ý dinh dưỡng và lịch tập. Tôi có thể yêu cầu xoá toàn bộ dữ liệu bất cứ lúc
            nào ở mục “Tôi”.
          </span>
        </label>

        {error === null ? null : (
          <p className="text-caption text-danger-text" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!consent || pending}
          onClick={submit}
          className="bg-forest-600 text-ink-inverse text-label flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-6 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          <CheckIcon size={18} />
          {pending ? 'Đang lưu hồ sơ…' : 'Vào ứng dụng'}
        </button>

        <p className="text-caption text-ink-faint">
          Mình hiểu bạn muốn bắt đầu ngay — bạn có thể chỉnh lại hồ sơ ở mục “Tôi”.
        </p>
      </div>

      <span className="text-ink-faint text-micro flex items-center gap-1.5">
        <BoIcon size={14} /> BƠ ĐÃ SẴN SÀNG
      </span>

      <Disclaimer />
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="text-caption text-ink tabular-nums">{value}</dd>
    </div>
  )
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="bg-forest-600 text-ink-inverse text-label mt-auto min-h-12 w-full rounded-md px-6 font-semibold transition-colors duration-(--duration-fast) disabled:bg-neutral-300 disabled:text-neutral-500"
    >
      {children}
    </button>
  )
}
