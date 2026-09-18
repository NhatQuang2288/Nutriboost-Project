import { ChartDataTable, describeSeries, type ChartPoint } from './chart-parts'

/**
 * Biểu đồ đường — dùng cho đại lượng **không** có gốc bằng 0 (cân nặng).
 *
 * Vì sao không dùng biểu đồ cột cho cân nặng: cột luôn bắt đầu từ 0, nên ba kg thay đổi trên
 * nền 70 kg là một chênh lệch 4% — mắt không thấy được, và biểu đồ trông như đường phẳng.
 * Đường với trục dọc bắt đầu gần giá trị nhỏ nhất cho thấy đúng xu hướng.
 *
 * Trục dọc có đệm 10% ở hai đầu để điểm cao nhất và thấp nhất không dính sát mép khung.
 */

const VIEW_WIDTH = 320
const VIEW_HEIGHT = 96
const PADDING_Y = 10

export function LineChart({
  points,
  unit,
  ariaLabel,
}: {
  points: readonly ChartPoint[]
  unit: string
  ariaLabel: string
}) {
  if (points.length === 0) return null

  const values = points.map((point) => point.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  // Khoảng giá trị bằng 0 (một điểm duy nhất, hoặc mọi điểm bằng nhau) sẽ làm phép chia cho 0.
  // Lấy đệm 1 đơn vị để đường nằm giữa khung.
  const span = rawMax - rawMin || 1
  const min = rawMin - span * 0.1
  const max = rawMax + span * 0.1

  const plotHeight = VIEW_HEIGHT - PADDING_Y * 2
  const step = points.length === 1 ? 0 : VIEW_WIDTH / (points.length - 1)

  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? VIEW_WIDTH / 2 : index * step,
    y: PADDING_Y + plotHeight * (1 - (point.value - min) / (max - min)),
    point,
  }))

  const path = coordinates.map((item) => `${item.x},${item.y}`).join(' ')

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${ariaLabel}. ${describeSeries(points, unit)}`}
        className="text-forest-600 h-24 w-full"
      >
        <polyline
          points={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coordinates.map((item) => (
          /*
           * Điểm tròn cũng bị kéo giãn phi đều, nên bán kính ngang và dọc khác nhau. Dùng
           * `ellipse` với hai bán kính tính theo tỉ lệ khung là cách duy nhất giữ được hình
           * tròn thật, nhưng tỉ lệ đó chỉ biết được khi đo bằng JavaScript — không đáng.
           * Điểm nhỏ nên méo không nhận ra; giữ `rect` vuông cho đơn giản.
           */
          <rect
            key={item.point.label}
            x={item.x - 2}
            y={item.y - 2}
            width={4}
            height={4}
            fill="currentColor"
          />
        ))}
      </svg>

      <div className="text-micro text-ink-faint flex justify-between">
        <span>
          {points[0]?.label} · {rawMin.toLocaleString('vi-VN')} {unit}
        </span>
        <span>
          {points[points.length - 1]?.label} · {rawMax.toLocaleString('vi-VN')} {unit}
        </span>
      </div>

      <ChartDataTable points={points} unit={unit} caption={ariaLabel} />
    </div>
  )
}
