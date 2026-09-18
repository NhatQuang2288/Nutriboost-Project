import type { Metadata } from 'next'
import Link from 'next/link'

import { ChevronRightIcon, InfoIcon, LeafIcon } from '@/components/icons'
import { Card, Disclaimer, SectionTitle } from '@/components/ui'
import { ACTIVITY_LABELS } from '@nutriboost/nutrition'
import { getTodayView } from '@/lib/data/today'

export const metadata: Metadata = { title: 'Tôi' }
export const dynamic = 'force-dynamic'

const GOAL_LABELS = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân',
  gain: 'Tăng cân',
} as const

export default function ProfilePage() {
  const view = getTodayView()
  const { profile, targets } = view

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-h1">Tôi</h1>
        <p className="text-caption text-ink-muted">Hồ sơ quyết định mọi con số trong ứng dụng.</p>
      </header>

      <Card>
        <SectionTitle>Hồ sơ</SectionTitle>
        <dl className="flex flex-col">
          <Row label="Giới tính" value={profile.sex === 'male' ? 'Nam' : 'Nữ'} />
          <Row label="Tuổi" value={`${profile.age}`} />
          <Row label="Chiều cao" value={`${profile.heightCm} cm`} />
          <Row label="Cân nặng" value={`${profile.weightKg} kg`} />
          <Row label="Mức vận động" value={ACTIVITY_LABELS[profile.activityLevel]} />
          <Row label="Mục tiêu" value={GOAL_LABELS[profile.goal]} />
        </dl>
      </Card>

      <Card>
        <SectionTitle>Mục tiêu năng lượng</SectionTitle>
        <dl className="flex flex-col">
          <Row label="Chuyển hoá cơ bản (BMR)" value={`${targets.bmrKcal} kcal`} />
          <Row label="Tiêu hao mỗi ngày (TDEE)" value={`${targets.tdeeKcal} kcal`} />
          <Row label="Mục tiêu mỗi ngày" value={`${targets.targetKcal} kcal`} strong />
          <Row
            label="Đa lượng"
            value={`${targets.proteinG} đạm · ${targets.carbG} tinh bột · ${targets.fatG} béo`}
          />
        </dl>
        <p className="text-caption text-ink-faint mt-3 flex items-start gap-1.5">
          <LeafIcon size={14} className="mt-0.5 shrink-0" />
          Tính bằng phương trình Mifflin–St Jeor, không phải do AI đoán.
        </p>
      </Card>

      <Card>
        <SectionTitle>Tài khoản</SectionTitle>
        <nav className="flex flex-col">
          <NavRow href="/toi" label="Chỉnh sửa hồ sơ" />
          <NavRow href="/toi" label="Dị ứng và món không ăn" />
          <NavRow href="/toi" label="Thông báo nhắc nhở" />
        </nav>
      </Card>

      <Card className="border-warning/30 bg-warning-surface">
        <div className="flex gap-3">
          <span className="text-warning-text mt-0.5 shrink-0">
            <InfoIcon size={18} />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-body text-warning-text font-semibold">Quyền riêng tư dữ liệu</p>
            <p className="text-caption text-warning-text">
              Dữ liệu sức khoẻ của bạn chỉ dùng để tạo gợi ý trong ứng dụng. Bạn có thể yêu cầu xoá
              toàn bộ dữ liệu bất cứ lúc nào.
            </p>
            <button
              type="button"
              className="border-warning/40 text-caption text-warning-text self-start rounded-md border px-3 py-2 font-semibold transition-colors duration-(--duration-fast)"
            >
              Xoá toàn bộ dữ liệu của tôi
            </button>
          </div>
        </div>
      </Card>

      <Disclaimer />
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="border-line-subtle flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-body text-ink-muted">{label}</dt>
      <dd
        className={`text-body text-right tabular-nums ${strong === true ? 'text-ink font-semibold' : 'text-ink'}`}
      >
        {value}
      </dd>
    </div>
  )
}

function NavRow({ href, label }: { href: '/toi'; label: string }) {
  return (
    <Link
      href={href}
      className="touch-target border-line-subtle text-body text-ink flex items-center justify-between border-b py-3 last:border-b-0"
    >
      {label}
      <ChevronRightIcon size={18} className="text-ink-faint" />
    </Link>
  )
}
