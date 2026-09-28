'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId } from 'react'

import { usePhotoMealCapture } from '@/components/assistant/PhotoMealButton'
import {
  BoIcon,
  CalendarIcon,
  CameraIcon,
  ChartIcon,
  FlameIcon,
  HomeIcon,
  UserIcon,
} from '@/components/icons'

import { SidebarAssistantButton } from './SidebarAssistantButton'

interface Tab {
  href: Route
  label: string
  description: string
  Icon: typeof HomeIcon
  /** `photo`: bấm vào mở camera ghi bữa ăn ngay, không chuyển trang. */
  action?: 'photo'
}

const TABS: readonly Tab[] = [
  { href: '/hom-nay', label: 'Hôm nay', description: 'Calo và bữa ăn trong ngày', Icon: HomeIcon },
  {
    href: '/ghi-nhan',
    label: 'Ghi bữa ăn',
    description: 'Chụp ảnh, Bơ ghi giúp',
    Icon: CameraIcon,
    action: 'photo',
  },
  { href: '/ke-hoach', label: 'Kế hoạch', description: 'Thực đơn 7 ngày', Icon: CalendarIcon },
  { href: '/lich-tap', label: 'Lịch tập', description: 'Buổi tập và kcal đốt', Icon: FlameIcon },
  { href: '/tien-do', label: 'Tiến độ', description: 'Cân nặng và xu hướng', Icon: ChartIcon },
  { href: '/toi', label: 'Tôi', description: 'Hồ sơ và mục tiêu', Icon: UserIcon },
]

function tabClassName(active: boolean): string {
  return [
    'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left',
    'transition-all duration-200',
    active
      ? 'bg-forest-600 text-white shadow-sm'
      : 'text-ink-muted hover:text-forest-700 hover:bg-olive-50',
  ].join(' ')
}

/** Phần bên trong một mục: ô icon + nhãn + dòng mô tả. Dùng chung cho link và nút. */
function TabContent({
  Icon,
  label,
  description,
  descriptionId,
  active,
}: {
  Icon: typeof HomeIcon
  label: string
  description: string
  descriptionId: string
  active: boolean
}) {
  return (
    <>
      <span
        className={[
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          active ? 'bg-white/15' : 'bg-olive-50 group-hover:bg-white',
        ].join(' ')}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span
          id={descriptionId}
          className={[
            'mt-0.5 block truncate text-[11px]',
            active ? 'text-white/70' : 'text-ink-faint',
          ].join(' ')}
        >
          {description}
        </span>
      </span>
    </>
  )
}

/**
 * Mục "Ghi bữa ăn": bấm là mở camera (trên máy tính là hộp chọn ảnh), ảnh được thu nhỏ rồi gửi
 * cho Bơ; thẻ xác nhận hiện ở lớp trợ lý, người dùng ở nguyên trang đang xem.
 */
function PhotoTab({
  tab,
  descriptionId,
  active,
}: {
  tab: Tab
  descriptionId: string
  active: boolean
}) {
  const { inputs, openCamera, busy, error } = usePhotoMealCapture()

  return (
    <>
      {inputs}
      <button
        type="button"
        onClick={openCamera}
        disabled={busy}
        aria-label={tab.label}
        aria-describedby={descriptionId}
        className={`${tabClassName(active)} disabled:cursor-wait disabled:opacity-70`}
      >
        <TabContent
          Icon={tab.Icon}
          label={tab.label}
          description={busy ? 'Đang xử lý ảnh…' : tab.description}
          descriptionId={descriptionId}
          active={active}
        />
      </button>
      {error !== null ? (
        <p className="text-warning-text mt-1 px-3 text-[11px] leading-snug">{error}</p>
      ) : null}
    </>
  )
}

/**
 * Sidebar của khách hàng ở màn hình lớn — cùng dáng với `PtTabs` của console PT.
 *
 * Chỉ hiện từ `lg` trở lên (do `AssistantShell` quyết định). Ở màn hình nhỏ, khách vẫn dùng
 * thanh điều hướng dưới, vì sản phẩm là mobile website trước tiên.
 *
 * Nhãn `aria-label` khác thanh điều hướng dưới ("Điều hướng chính") để trình đọc màn hình và
 * bộ kiểm thử phân biệt được hai vùng điều hướng.
 */
export function ClientSidebar() {
  const pathname = usePathname()
  const descriptionIdPrefix = `${useId()}-mo-ta`

  return (
    <aside className="w-full">
      <div className="mb-8 flex items-center gap-3">
        <span className="text-forest-600 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-olive-100">
          <BoIcon size={22} />
        </span>

        <div className="min-w-0">
          <p className="text-ink text-sm leading-tight font-bold">NutriBoost</p>
          <p className="text-ink-muted mt-0.5 text-xs">Trợ lý dinh dưỡng</p>
        </div>
      </div>

      <div className="mb-3 px-2">
        <p className="text-ink-faint text-[10px] font-bold tracking-wider uppercase">Hằng ngày</p>
      </div>

      <nav aria-label="Điều hướng ứng dụng">
        <ul className="space-y-1.5">
          {TABS.map((tab) => {
            const { href, label, description, Icon } = tab
            const active = pathname === href || pathname.startsWith(`${href}/`)
            const descriptionId = `${descriptionIdPrefix}${href}`

            if (tab.action === 'photo') {
              return (
                <li key={href}>
                  <PhotoTab tab={tab} descriptionId={descriptionId} active={active} />
                </li>
              )
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  // Tên link chỉ là nhãn; dòng mô tả đọc riêng qua `aria-describedby`, để trình đọc
                  // màn hình không đọc "Kế hoạch Thực đơn 7 ngày" như một cái tên.
                  aria-label={label}
                  aria-describedby={descriptionId}
                  aria-current={active ? 'page' : undefined}
                  className={tabClassName(active)}
                >
                  <TabContent
                    Icon={Icon}
                    label={label}
                    description={description}
                    descriptionId={descriptionId}
                    active={active}
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-8">
        <p className="text-ink-faint mb-3 px-2 text-[10px] font-bold tracking-wider uppercase">
          Trợ lý
        </p>
        <SidebarAssistantButton subtitle="Hỏi về bữa ăn, calo" />
      </div>

      <div className="mt-8 border-t border-black/5 pt-5">
        <div className="rounded-2xl bg-olive-50 p-3">
          <p className="text-ink text-xs font-semibold">Mẹo nhỏ</p>
          <p className="text-ink-faint mt-1 text-[11px] leading-relaxed">
            Gõ một câu như “trưa nay ăn cơm tấm” vào ô hỏi Bơ ở cuối trang — Bơ ghi bữa ăn giúp bạn.
          </p>
        </div>
      </div>
    </aside>
  )
}
