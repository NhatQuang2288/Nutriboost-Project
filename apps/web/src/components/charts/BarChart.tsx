import { ChartDataTable, describeSeries, type ChartPoint } from './chart-parts'

/**
 * Biểu đồ cột — dùng cho đại lượng có gốc bằng 0 (kcal nạp vào, kcal đốt).
 *
 * SVG được kéo giãn theo bề rộng khung chứa (`preserveAspectRatio="none"`), nên toạ độ ở đây
 * chỉ có ý nghĩa **tương đối**: trục dọc là 96 đơn vị ảo, trục ngang là 320. Cách này cho biểu
 * đồ tự khớp mọi bề rộng màn hình mà không cần đo bằng JavaScript.
 *
 * Hai hệ quả phải nhớ khi sửa tệp này:
 *   • **Không dùng `rx`** trên cột. Kéo giãn phi đều biến bo góc tròn thành bo ellipse méo.
 *   • Nét của đường mục tiêu phải có `vectorEffect="non-scaling-stroke"`, nếu không nó dày
 *     mỏng tuỳ bề rộng màn hình.
 */

const VIEW_WIDTH = 320
const VIEW_HEIGHT = 96
const PADDING_TOP = 8
const PADDING_BOTTOM = 2

export function BarChart({
  points,
  unit,
  target,
  ariaLabel,
}: {
  points: readonly ChartPoint[]
  unit: string
  /** Đường mục tiêu, vẽ nét đứt. Bỏ trống khi không có mục tiêu. */
  target?: number | null
  ariaLabel: string
}) {
  if (points.length === 0) return null

  const values = points.map((point) => point.value)
  // Thang đo phải bao gồm cả đường mục tiêu, nếu không thì mục tiêu nằm ngoài khung và biểu
  // đồ nói dối rằng mọi ngày đều đạt.
  const max = Math.max(...values, target ?? 0, 1)

  const plotHeight = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  // Bề rộng mỗi khe chia đều, và cột chiếm 70% khe để luôn có khoảng thở giữa hai cột.
  const slot = VIEW_WIDTH / points.length
  const barWidth = Math.max(2, slot * 0.7)

  const targetY =
    target === undefined || target === null || target <= 0
      ? null
      : PADDING_TOP + plotHeight * (1 - target / max)

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${ariaLabel}. ${describeSeries(points, unit)}`}
        className="text-forest-600 h-24 w-full"
      >
        {points.map((point, index) => {
          const height = Math.max(1, plotHeight * (point.value / max))
          return (
            <rect
              key={point.label}
              x={index * slot + (slot - barWidth) / 2}
              y={VIEW_HEIGHT - PADDING_BOTTOM - height}
              width={barWidth}
              height={height}
              fill="currentColor"
              opacity={0.85}
            />
          )
        })}

        {targetY === null ? null : (
          <line
            x1={0}
            x2={VIEW_WIDTH}
            y1={targetY}
            y2={targetY}
            className="text-warning"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="text-micro text-ink-faint flex justify-between">
        <span>{points[0]?.label}</span>
        {target === undefined || target === null ? null : (
          <span className="text-warning-text">Mục tiêu {target.toLocaleString('vi-VN')}</span>
        )}
        <span>{points[points.length - 1]?.label}</span>
      </div>

      <ChartDataTable points={points} unit={unit} caption={ariaLabel} />
    </div>
  )
}
