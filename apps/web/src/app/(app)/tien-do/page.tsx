import type { Metadata } from 'next'
import Link from 'next/link'

import { BarChart } from '@/components/charts/BarChart'
import { ChartFrame, describeSeries } from '@/components/charts/chart-parts'
import { LineChart } from '@/components/charts/LineChart'
import { ChartIcon, ScaleIcon } from '@/components/icons'
import { Card, Disclaimer, EmptyState } from '@/components/ui'
import { getProgressView } from '@/lib/data/progress'
import { ensureProfileReady } from '@/lib/data/require-profile'

export const metadata: Metadata = { title: 'Tiến độ' }
export const dynamic = 'force-dynamic'

/** Cần ít nhất hai lần đo mới nói được xu hướng; một điểm chỉ là một con số. */
const MIN_POINTS = 2

const WEIGHT_UNIT = 'kg'
const KCAL_UNIT = 'kcal'

export default async function ProgressPage() {
  const view = await getProgressView()
  await ensureProfileReady(view.source)

  // Cân nặng cần ít nhất hai lần đo, kcal chỉ cần một ngày có ghi.
  const hasWeight = view.weights.length >= MIN_POINTS
  const hasKcal = view.kcal.length >= MIN_POINTS

  return (
    <div className="flex flex-col gap-5">
      {view.source === 'demo' ? (
        /*
         * Nói thẳng đây là dữ liệu mẫu — cùng lý do như dải báo ở màn "Hôm nay".
         *
         * Trước đây chế độ mẫu chỉ có trạng thái rỗng nên câu "chưa đủ dữ liệu" đã tự nói lên
         * điều đó. Nay tuần mẫu vẽ ra biểu đồ thật, nên nếu thiếu dải báo này thì người chưa
         * đăng nhập sẽ thấy một tuần số liệu của người khác như thể là của mình.
         */
        <p className="border-info/30 bg-info-surface text-info-text text-caption rounded-lg border px-3 py-2">
          Đang hiện dữ liệu mẫu. Bạn chưa đăng nhập nên biểu đồ dưới đây là một tuần số liệu mẫu,
          không phải của bạn.
        </p>
      ) : null}

      <header>
        <h1 className="text-h1">Tiến độ</h1>
        <p className="text-caption text-ink-muted">Cân nặng và năng lượng theo thời gian.</p>
      </header>

      {!hasWeight && !hasKcal ? (
        <EmptyState
          icon={<ChartIcon size={32} />}
          title="Chưa đủ dữ liệu để vẽ biểu đồ"
          description={
            view.source === 'demo'
              ? 'Bạn đang ở chế độ dữ liệu mẫu nên chưa có số liệu nào của bạn để vẽ.'
              : 'Cần ít nhất hai ngày ghi nhật ký. Ghi đều mỗi ngày để thấy xu hướng thật thay vì dao động của một ngày.'
          }
          action={
            <Link
              href="/ghi-nhan"
              className="bg-forest-600 text-ink-inverse text-label flex min-h-11 items-center justify-center rounded-md px-5 font-semibold"
            >
              Ghi bữa ăn
            </Link>
          }
        />
      ) : null}

      <Card>
        <ChartFrame
          title="Cân nặng"
          summary={
            hasWeight
              ? describeSeries(view.weights, WEIGHT_UNIT)
              : 'Chưa đủ hai lần đo cân nặng để vẽ xu hướng.'
          }
          action={
            <span className="text-caption text-ink-faint flex items-center gap-1">
              <ScaleIcon size={14} /> {view.weights.length} lần đo
            </span>
          }
        >
          {hasWeight ? (
            <LineChart
              points={view.weights}
              unit={WEIGHT_UNIT}
              ariaLabel="Cân nặng theo thời gian"
            />
          ) : (
            <SkeletonChart />
          )}
        </ChartFrame>
      </Card>

      <Card>
        <ChartFrame
          title="Năng lượng nạp vào"
          summary={
            hasKcal
              ? describeSeries(view.kcal, KCAL_UNIT)
              : 'Chưa đủ hai ngày có ghi nhật ký để vẽ xu hướng.'
          }
        >
          {hasKcal ? (
            <BarChart
              points={view.kcal}
              unit={KCAL_UNIT}
              target={view.targetKcal}
              ariaLabel="Năng lượng nạp vào theo ngày"
            />
          ) : (
            <SkeletonChart />
          )}
        </ChartFrame>
      </Card>

      <Disclaimer />
    </div>
  )
}

/**
 * Trạng thái chưa có dữ liệu của một biểu đồ.
 *
 * Giữ nguyên hình dạng của biểu đồ thật để bố cục không nhảy khi dữ liệu về — cùng nguyên tắc
 * với `Skeleton` trong design system.
 */
function SkeletonChart() {
  const heights = [40, 64, 32, 56, 72]
  return (
    <div className="flex h-24 items-end gap-2" aria-hidden="true">
      {heights.map((height, index) => (
        <div
          key={index}
          className="bg-surface-sunken border-line-subtle flex-1 rounded-sm border border-dashed"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}
