export interface BoMascotProps {
  /**
   * Tỉ lệ nạp năng lượng trong ngày, từ 0 tới 1.
   * Kim đồng hồ ở thân robot quay theo giá trị này — cùng một hình, hai chức năng:
   * vừa là linh vật, vừa là chỉ báo tiến độ.
   */
  progress?: number
  /** Chiều cao hiển thị, tính bằng px. */
  size?: number
  className?: string
}

/**
 * Linh vật NutriBoost — SVG tự vẽ, dựng theo đúng logo.
 *
 * Dùng ở màn chào mừng, trạng thái rỗng và màn hoàn tất onboarding.
 * Màu lấy từ token design system, không viết mã màu trực tiếp.
 */
export function BoMascot({ progress = 0, size = 160, className }: BoMascotProps) {
  const clamped = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0
  // Kim quay từ −62° (rỗng) tới +62° (đầy), quanh tâm mặt đồng hồ.
  const needleAngle = -62 + clamped * 124

  return (
    <svg
      viewBox="0 0 96 122"
      width={size}
      height={(size * 122) / 96}
      className={className}
      role="img"
      aria-label={`Linh vật NutriBoost, mức nạp năng lượng ${Math.round(clamped * 100)} phần trăm`}
    >
      {/* Mầm hai lá */}
      <g className="fill-olive-500">
        <path
          d="M48 30V17"
          stroke="currentColor"
          className="stroke-olive-600"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <path d="M48 19c0-7.2-5.8-13-13-13-1.3 0-2.3 1-2.3 2.3C32.7 15.5 38.5 21.3 45.7 21.3H48V19Z" />
        <path d="M48 20.4c0-6.9 5.6-12.5 12.5-12.5 1.3 0 2.3 1 2.3 2.3 0 6.9-5.6 12.5-12.5 12.5H48v-2.3Z" />
      </g>

      {/* Tai hai bên */}
      <rect x="2" y="46" width="12" height="20" rx="6" className="fill-olive-500" />
      <rect x="82" y="46" width="12" height="20" rx="6" className="fill-olive-500" />

      {/* Đầu */}
      <rect x="12" y="30" width="72" height="50" rx="20" className="fill-olive-500" />

      {/* Mặt kính */}
      <rect x="25" y="42" width="46" height="24" rx="11" className="fill-forest-600" />

      {/* Mắt cong `^^` như logo */}
      <g className="stroke-neutral-0" strokeWidth={3.2} strokeLinecap="round" fill="none">
        <path d="M34 55.5c1.5-3.2 5.5-3.2 7 0" />
        <path d="M55 55.5c1.5-3.2 5.5-3.2 7 0" />
      </g>

      {/* Cổ */}
      <rect x="41" y="78" width="14" height="8" className="fill-olive-600" />

      {/* Thân */}
      <rect x="16" y="84" width="64" height="36" rx="17" className="fill-olive-500" />

      {/* Mặt đồng hồ */}
      <rect x="28" y="91" width="40" height="22" rx="11" className="fill-neutral-0" />

      {/* Vạch chia */}
      <g className="stroke-neutral-400" strokeWidth={1.4} strokeLinecap="round">
        <path d="M36 96.5v3" />
        <path d="M48 95.5v3" />
        <path d="M60 96.5v3" />
      </g>

      {/* Kim đồng hồ — quay theo mức nạp năng lượng */}
      <g transform={`rotate(${needleAngle} 48 102)`}>
        <path
          d="M48 102V95.5"
          className="stroke-forest-600"
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <circle cx="48" cy="102" r="2.6" className="fill-forest-600" />
    </svg>
  )
}
