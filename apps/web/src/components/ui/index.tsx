import type { ReactNode } from 'react'

/* =========================================================================
 * Thành phần giao diện dùng chung.
 *
 * Mọi màu, bo góc và đổ bóng đều đi qua token Tailwind sinh từ
 * apps/web/src/app/globals.css. Không viết mã màu trực tiếp ở đây.
 * ======================================================================= */

export function Card({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
}) {
  return (
    <Tag
      className={`border-line-subtle bg-surface rounded-lg border p-4 shadow-sm ${className ?? ''}`}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-h3 text-ink">{children}</h2>
      {action}
    </div>
  )
}

/**
 * Vòng tiến độ năng lượng.
 *
 * Nhận `value` và `max`; khi `max` bằng 0 thì hiển thị vành rỗng thay vì chia cho 0.
 */
export function ProgressRing({
  value,
  max,
  size = 176,
  stroke = 14,
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const safeMax = max > 0 ? max : 1
  const ratio = Math.min(Math.max(value / safeMax, 0), 1)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const over = value > max && max > 0

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={over ? 'stroke-warning' : 'stroke-olive-500'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {children}
      </div>
    </div>
  )
}

/**
 * Bảng tra tĩnh cho sắc độ thanh đa lượng.
 *
 * Bắt buộc phải là hằng tĩnh: Tailwind quét mã nguồn để sinh class, nên một class
 * ghép động kiểu `bg-${tone}` sẽ không bao giờ được sinh ra và thanh mất màu.
 */
const MACRO_TONES = {
  'olive-500': 'bg-olive-500',
  'olive-600': 'bg-olive-600',
  'olive-700': 'bg-olive-700',
} as const

/** Thanh đa lượng. Ba sắc ô-liu phân biệt đạm / tinh bột / béo. */
export function MacroBar({
  label,
  value,
  target,
  tone = 'olive-500',
}: {
  label: string
  value: number
  target: number
  tone?: keyof typeof MACRO_TONES
}) {
  const safeTarget = target > 0 ? target : 1
  const ratio = Math.min(Math.max(value / safeTarget, 0), 1)
  const toneClass = MACRO_TONES[tone]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-caption flex items-baseline justify-between">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink tabular-nums">
          {Math.round(value)}
          <span className="text-ink-faint">/{Math.round(target)} g</span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
      >
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`text-caption text-accent-text inline-flex items-center gap-1 rounded-full border border-olive-200 bg-olive-100 px-3 py-1 ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

/**
 * Trạng thái rỗng.
 *
 * Bắt buộc cho mọi màn hình có dữ liệu — xem mục 7 của docs/REVIEW-MVP.md.
 * Luôn kèm đúng MỘT hành động chính.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="border-line-strong flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center">
      {icon === undefined ? null : <div className="text-ink-faint">{icon}</div>}
      <p className="text-body text-ink font-semibold">{title}</p>
      <p className="text-caption text-ink-muted max-w-[34ch]">{description}</p>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-neutral-100 ${className ?? ''}`} />
}

/** Khối nhắc nhở an toàn — dùng khi hồ sơ có cờ bệnh nền hoặc BMI ngoài ngưỡng. */
export function SafetyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border-warning/30 bg-warning-surface flex gap-3 rounded-lg border p-3">
      <p className="text-caption text-warning-text">{children}</p>
    </div>
  )
}

export function Disclaimer() {
  return (
    <p className="text-caption text-ink-faint">
      Nội dung do trợ lý Bơ đưa ra chỉ mang tính tham khảo và không thay thế tư vấn y khoa.
    </p>
  )
}
