'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId } from 'react'

import {
  BoIcon,
  CalendarIcon,
  ChartIcon,
  FlameIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from '@/components/icons'

import { SidebarAssistantButton } from './SidebarAssistantButton'

interface Tab {
  href: Route
  label: string
  description: string
  Icon: typeof HomeIcon
}

const TABS: readonly Tab[] = [
  { href: '/hom-nay', label: 'Hôm nay', description: 'Calo và bữa ăn trong ngày', Icon: HomeIcon },
  {
    href: '/ghi-nhan',
    label: 'Ghi bữa ăn',
    description: 'Kể một câu, Bơ ghi giúp',
    Icon: PlusIcon,
  },
  { href: '/ke-hoach', label: 'Kế hoạch', description: 'Thực đơn 7 ngày', Icon: CalendarIcon },
  { href: '/lich-tap', label: 'Lịch tập', description: 'Buổi tập và kcal đốt', Icon: FlameIcon },
  { href: '/tien-do', label: 'Tiến độ', description: 'Cân nặng và xu hướng', Icon: ChartIcon },
  { href: '/toi', label: 'Tôi', description: 'Hồ sơ và mục tiêu', Icon: UserIcon },
]

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
          {TABS.map(({ href, label, description, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  // Tên link chỉ là nhãn; dòng mô tả đọc riêng qua `aria-describedby`, để trình đọc
                  // màn hình không đọc "Kế hoạch Thực đơn 7 ngày" như một cái tên.
                  aria-label={label}
                  aria-describedby={`${descriptionIdPrefix}${href}`}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'group flex items-center gap-3 rounded-2xl px-3 py-3',
                    'transition-all duration-200',
                    active
                      ? 'bg-forest-600 text-white shadow-sm'
                      : 'text-ink-muted hover:text-forest-700 hover:bg-olive-50',
                  ].join(' ')}
                >
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
                      id={`${descriptionIdPrefix}${href}`}
                      className={[
                        'mt-0.5 block truncate text-[11px]',
                        active ? 'text-white/70' : 'text-ink-faint',
                      ].join(' ')}
                    >
                      {description}
                    </span>
                  </span>
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
