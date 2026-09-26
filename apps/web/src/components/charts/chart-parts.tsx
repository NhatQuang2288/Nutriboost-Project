import type { ReactNode } from 'react'

/**
 * Biểu đồ SVG tự vẽ — không dùng thư viện biểu đồ.
 *
 * Vì sao không dùng thư viện (dù `recharts` có trong `package.json`): biểu đồ ở đây chỉ có hai
 * dạng, cột và đường, và cả hai đều là hình học đơn giản. Một thư viện biểu đồ kéo theo vài
 * trăm KB JavaScript xuống một ứng dụng mobile-first, và bắt người dùng trả giá đó ở mọi lần
 * tải trang. Đổi lại, ở đây phải tự làm phần dễ quên nhất: **bảng dữ liệu cho trình đọc màn
 * hình**. Biểu đồ SVG là hình ảnh trần với trình đọc màn hình; không có bảng thì người dùng
 * screen reader không nhận được thông tin gì.
 */

export interface ChartPoint {
  label: string
  value: number
}

/** Bảng dữ liệu ẩn — cách duy nhất để biểu đồ SVG tiếp cận được với trình đọc màn hình. */
export function ChartDataTable({
  points,
  unit,
  caption,
}: {
  points: readonly ChartPoint[]
  unit: string
  caption: string
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Ngày</th>
          <th scope="col">Giá trị ({unit})</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{point.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Tóm tắt bằng chữ — dùng cho `aria-label`, và hiện được dưới biểu đồ. */
export function describeSeries(points: readonly ChartPoint[], unit: string): string {
  if (points.length === 0) return 'Chưa có dữ liệu.'

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const last = values[values.length - 1] ?? 0
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

  return `Thấp nhất ${min} ${unit}, cao nhất ${max} ${unit}, trung bình ${average} ${unit}, gần nhất ${last} ${unit}.`
}

/** Khung chung: tiêu đề, biểu đồ, và dòng tóm tắt. */
export function ChartFrame({
  title,
  summary,
  children,
  action,
}: {
  title: string
  summary: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3">{title}</h3>
        {action}
      </div>
      {children}
      <p className="text-caption text-ink-muted">{summary}</p>
    </div>
  )
}
