import styles from './bo-icon.module.css'

export type BoIconState = 'idle' | 'thinking' | 'speaking'

export interface BoIconProps {
  state?: BoIconState
  /** Kích thước, mặc định `1em` để tự khớp cỡ chữ xung quanh. */
  size?: number | string
  /** Nhãn cho trình đọc màn hình. Bỏ trống khi icon đứng cạnh nhãn chữ. */
  title?: string
  className?: string
}

/**
 * Mặt trợ lý Bơ — SVG tự vẽ, không dùng thư viện icon.
 *
 * Lấy đúng linh vật trong logo: đầu robot bo tròn, hai tai nhỏ hai bên,
 * mặt kính, hai mắt cong `^^`, và mầm hai lá trên đỉnh.
 *
 * Toàn bộ icon dùng `currentColor` nên ăn theo màu chữ của ngữ cảnh.
 */
export function BoIcon({ state = 'idle', size = '1em', title, className }: BoIconProps) {
  const stateClass = styles[state]
  const classes = [styles.icon, stateClass, className].filter(Boolean).join(' ')

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
      className={classes}
      role={title === undefined ? undefined : 'img'}
      aria-label={title}
      aria-hidden={title === undefined ? true : undefined}
    >
      {/* Mầm hai lá trên đỉnh đầu — chi tiết nhận diện của thương hiệu */}
      <g className={styles.leaves}>
        <path d="M12 7.4V4.9" />
        <path d="M12 5.9c0-1.7-1.3-3-3-3-.3 0-.5.2-.5.5 0 1.6 1.3 3 3 3h.5Z" />
        <path d="M12 6.2c0-1.6 1.2-2.9 2.8-2.9.3 0 .5.2.5.5 0 1.6-1.2 2.9-2.8 2.9H12Z" />
      </g>

      {/* Tai hai bên */}
      <path d="M4.6 11.9H3.1" />
      <path d="M19.4 11.9h1.5" />

      {/* Đầu */}
      <rect x="4.6" y="7.6" width="14.8" height="10" rx="4.6" />

      {/* Mặt kính */}
      <rect x="7.5" y="9.9" width="9" height="5.4" rx="2.7" />

      {/* Mắt cong kiểu `^^` như logo — trạng thái idle và thinking (mắt trái) */}
      <path className={styles.eyeArc} d="M9.2 12.8c.45-1 1.75-1 2.2 0" />
      <path
        className={`${styles.eyeArc} ${styles.eyeArcRight}`}
        d="M12.6 12.8c.45-1 1.75-1 2.2 0"
      />

      {/* Mắt mở tròn — trạng thái speaking */}
      <circle
        className={styles.eyeOpen}
        cx="10.3"
        cy="12.4"
        r="0.75"
        fill="currentColor"
        stroke="none"
      />
      <circle
        className={styles.eyeOpen}
        cx="13.7"
        cy="12.4"
        r="0.75"
        fill="currentColor"
        stroke="none"
      />

      {/* Mặt đồng hồ — trạng thái thinking, lấy từ chi tiết đồng hồ ở thân robot trong logo */}
      <g className={styles.dial}>
        <circle cx="13.7" cy="12.6" r="1.5" />
        <path className={styles.tick} d="M13.7 12.6V11.6" />
      </g>
    </svg>
  )
}
