import type { ReactNode } from 'react'

/**
 * Bộ icon SVG tự vẽ — KHÔNG dùng thư viện icon.
 *
 * Quy ước chung (docs/DESIGN-SYSTEM.md §9):
 *   • khung 24 × 24
 *   • stroke-width 1,5, đầu nét và khớp nét bo tròn
 *   • `fill: none`, `stroke: currentColor` → ăn theo màu chữ
 *   • kích thước theo `1em` để tự khớp cỡ chữ
 */
interface IconProps {
  /** Kích thước, mặc định `1em`. */
  size?: number | string
  /** Nhãn cho trình đọc màn hình. Bỏ trống khi icon đứng cạnh nhãn chữ. */
  title?: string
  className?: string
}

function Icon({ children, size = '1em', title, className }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title === undefined ? undefined : 'img'}
      aria-label={title}
      aria-hidden={title === undefined ? true : undefined}
    >
      {children}
    </svg>
  )
}

/* -------------------------------------------------------------------------
 * Điều hướng
 * ----------------------------------------------------------------------- */

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.6 12 4l8 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.4Z" />
      <path d="M9.5 20.5v-6h5v6" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="5.5" width="15" height="15" rx="2.5" />
      <path d="M4.5 10h15M8.5 3.5v3M15.5 3.5v3" />
    </Icon>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 12c0 4.1-3.8 7.5-8.5 7.5-1 0-2-.2-2.9-.5L4.5 20.5l1.6-3.7A7.1 7.1 0 0 1 3.5 12C3.5 7.9 7.3 4.5 12 4.5s8.5 3.4 8.5 7.5Z" />
    </Icon>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 19.5v-6M12 19.5V8M16.5 19.5v-9" />
    </Icon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M5 20.5c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" />
    </Icon>
  )
}

/* -------------------------------------------------------------------------
 * Hành động
 * ----------------------------------------------------------------------- */

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19.5v-14" />
      <path d="M6.2 11.3 12 5.5l5.8 5.8" />
    </Icon>
  )
}

/** Mở rộng từ thanh hỏi ra panel bên phải. */
export function ExpandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M15.5 5v14" />
      <path d="M18.8 9.5 21 12l-2.2 2.5" />
    </Icon>
  )
}

/** Thu từ panel về thanh hỏi. */
export function CollapseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M15.5 5v14" />
      <path d="M18.2 9.5 16 12l2.2 2.5" />
    </Icon>
  )
}

/** Bung ra toàn màn hình. */
export function MaximizeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9" />
      <path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
    </Icon>
  )
}

/** Thu từ toàn màn hình về panel. */
export function MinimizeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4" />
      <path d="M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4" />
      <path d="M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20" />
      <path d="M15 20v-3.5A1.5 1.5 0 0 1 16.5 15H20" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8 20.5 20.5" />
    </Icon>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 19.5h4L19 9a2.12 2.12 0 0 0-3-3L5.5 16.5l-1 3Z" />
    </Icon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
      <path d="M6.6 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
    </Icon>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.2 3.5h5.6l-.7 5 2.9 3.2H7l2.9-3.2-.7-5Z" />
      <path d="M12 11.7v8.8" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5 9.8 17.5 19 6.8" />
    </Icon>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.2 21 20H3l9-15.8Z" />
      <path d="M12 10v4.5M12 17.3v.1" />
    </Icon>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v5.3M12 7.6v.1" />
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 9.5 12 16l6.5-6.5" />
    </Icon>
  )
}

/* -------------------------------------------------------------------------
 * Dinh dưỡng
 * ----------------------------------------------------------------------- */

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5c3.3 0 5.5-2.2 5.5-5.2 0-4.3-5.5-9.8-5.5-9.8S6.5 11 6.5 15.3c0 3 2.2 5.2 5.5 5.2Z" />
      <path d="M12 20.5c1.4 0 2.4-1 2.4-2.3 0-1.9-2.4-4.2-2.4-4.2s-2.4 2.3-2.4 4.2c0 1.3 1 2.3 2.4 2.3Z" />
    </Icon>
  )
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20.5h16" />
      <path d="M6.5 20.5V9.8A1.8 1.8 0 0 1 8.3 8h7.4a1.8 1.8 0 0 1 1.8 1.8v10.7" />
      <path d="M12 8V5.5M9.5 5.5h5" />
    </Icon>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 4c0 8.3-5 13-11.5 13h-3C5.5 8.6 11 4 20 4Z" />
      <path d="M4.5 20c1.5-4 4-7 8-9" />
    </Icon>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.9 9l5.6 2.1-5.6 2.1L12 18.7l-1.9-5.5L4.5 11.1 10.1 9 12 3.5Z" />
    </Icon>
  )
}

export function RepeatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4.5V10h-5.5" />
    </Icon>
  )
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4.5V10h5.5" />
      <path d="M12 8.5V12l3 2" />
    </Icon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </Icon>
  )
}

/* -------------------------------------------------------------------------
 * Đầu vào thay thế (Release 2)
 * ----------------------------------------------------------------------- */

export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 9A1.5 1.5 0 0 1 6 7.5h1.8l1.2-1.8h6l1.2 1.8H18A1.5 1.5 0 0 1 19.5 9v8.5A1.5 1.5 0 0 1 18 19H6a1.5 1.5 0 0 1-1.5-1.5V9Z" />
      <circle cx="12" cy="13.2" r="3.2" />
    </Icon>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 14.5a3 3 0 0 0 3-3V6.5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
      <path d="M12 17v3.5" />
    </Icon>
  )
}

/* -------------------------------------------------------------------------
 * Tài khoản
 * ----------------------------------------------------------------------- */

export function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5h8" />
      <path d="M17 8.5 20.5 12 17 15.5" />
      <path d="M10.5 12h10" />
    </Icon>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" />
      <path d="m4.5 7.5 7.5 5.2 7.5-5.2" />
    </Icon>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="1.8" />
      <path d="M15 6.5V5.8A1.8 1.8 0 0 0 13.2 4H5.8A1.8 1.8 0 0 0 4 5.8v7.4A1.8 1.8 0 0 0 5.8 15h.7" />
    </Icon>
  )
}

export function UserPlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8.5" r="3.5" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0" />
      <path d="M18 7v6" />
      <path d="M15 10h6" />
    </Icon>
  )
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5A1.5 1.5 0 0 0 5 7h14a1.5 1.5 0 0 0 1.5 1.5v1a2 2 0 0 0 0 4v1A1.5 1.5 0 0 0 19 17H5a1.5 1.5 0 0 0-1.5-1.5v-1a2 2 0 0 0 0-4v-1Z" />
      <path d="M12 9v1.5M12 13.5V15" />
    </Icon>
  )
}

export { BoIcon } from './BoIcon'
export type { BoIconProps, BoIconState } from './BoIcon'
export { BoMascot } from './BoMascot'
export type { BoMascotProps } from './BoMascot'
