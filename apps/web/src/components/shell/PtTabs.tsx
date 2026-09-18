'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BoIcon, CalendarIcon, CheckIcon, ChartIcon, UserPlusIcon } from '@/components/icons'

interface Tab {
  href: '/pt' | '/pt/duyet' | '/pt/loi-moi' | '/pt/goi'
  label: string
  Icon: typeof ChartIcon
}

/**
 * Bốn tab. Danh sách khách hàng nằm ngay trong tab Tổng quan, vì PT vào đây để xem "hôm nay
 * cần làm gì" chứ không phải để duyệt một bảng danh sách.
 *
 * "Mời khách" đứng cạnh "Duyệt thực đơn" vì đó là hai việc PT làm hằng ngày: nhận khách mới
 * và duyệt thực đơn cho khách cũ.
 */
const TABS: readonly Tab[] = [
  { href: '/pt', label: 'Tổng quan', Icon: ChartIcon },
  { href: '/pt/duyet', label: 'Duyệt thực đơn', Icon: CheckIcon },
  { href: '/pt/loi-moi', label: 'Mời khách', Icon: UserPlusIcon },
  { href: '/pt/goi', label: 'Gói dịch vụ', Icon: CalendarIcon },
]

/**
 * Điều hướng của console PT — tab ngang ở đầu trang, không phải thanh dưới.
 *
 * Lý do: PT thường làm việc trên máy tính bảng hoặc máy tính, nơi thanh dưới màn hình
 * vừa xa tầm tay vừa chiếm chỗ của bảng biểu. Trên điện thoại, dải tab này cuộn ngang.
 */
export function PtTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Điều hướng console PT" className="mb-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-forest-600 flex size-9 items-center justify-center rounded-full bg-olive-100">
          <BoIcon size={20} />
        </span>
        <div>
          <p className="text-label text-ink font-semibold">NutriBoost cho PT</p>
          <p className="text-micro text-ink-faint">QUẢN LÝ KHÁCH HÀNG VÀ THỰC ĐƠN</p>
        </div>
      </div>

      <div className="border-line-subtle -mx-4 overflow-x-auto border-b px-4">
        <ul className="flex min-w-max gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
            const { href, label, Icon } = tab
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-label flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors duration-(--duration-fast) ${
                    active
                      ? 'border-forest-600 text-ink font-semibold'
                      : 'text-ink-muted border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
