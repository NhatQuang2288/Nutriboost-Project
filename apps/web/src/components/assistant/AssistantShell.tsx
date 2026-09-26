'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { AskBar } from '@/components/assistant/AskBar'
import { AssistantDock } from '@/components/assistant/AssistantDock'
import { AssistantProvider } from '@/components/assistant/AssistantProvider'
import { BottomNav } from '@/components/shell/BottomNav'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Khung ứng dụng đã đăng nhập, có lớp trợ lý.
 *
 * Bố cục: sidebar trái (từ `lg`) · cột nội dung · panel trợ lý bên phải. Dùng chung cho khách
 * hàng và console PT — hai bên chỉ khác nội dung sidebar và thanh điều hướng dưới.
 *
 *   • `sidebar` bỏ trống → không có sidebar.
 *   • `nav` bỏ trống → thanh điều hướng dưới của khách; `null` → không có. Khi đã có sidebar,
 *     thanh dưới chỉ hiện ở màn hình nhỏ, nơi sidebar bị ẩn.
 */
export function AssistantShell({
  children,
  nav,
  wide,
  sidebar,
}: {
  children: ReactNode
  nav?: ReactNode
  /**
   * Cột nội dung rộng (`--width-console`) thay vì 680px.
   *
   * `true` cho mọi màn, hoặc danh sách đường dẫn — dùng khi mới làm lại một vài màn theo bố cục
   * nhiều cột, còn các màn khác vẫn là một cột 680px như thiết kế cũ.
   */
  wide?: boolean | readonly string[]
  /** Nội dung sidebar trái. */
  sidebar?: ReactNode
}) {
  const mode = useAssistantStore((state) => state.mode)
  const pathname = usePathname()
  const hasSidebar = sidebar !== undefined
  const isWide =
    wide === true ||
    (Array.isArray(wide) &&
      wide.some((path) => pathname === path || pathname.startsWith(`${path}/`)))

  return (
    <AssistantProvider>
      <div className="bg-bg flex min-h-dvh">
        {hasSidebar ? (
          <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white lg:block">
            <div className="sticky top-0 h-dvh overflow-y-auto p-5">{sidebar}</div>
          </aside>
        ) : null}

        <main className="safe-top min-w-0 flex-1">
          <div
            className={`mx-auto w-full px-4 pt-4 pb-44 ${
              isWide ? 'max-w-[var(--width-console)]' : 'max-w-[var(--width-content)]'
            }`}
          >
            {children}
          </div>
        </main>

        <AssistantDock />
      </div>

      {mode === 'bar' ? <AskBar aboveBottomNav={nav !== null} besideSidebar={hasSidebar} /> : null}

      {nav === undefined ? (
        hasSidebar ? (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        ) : (
          <BottomNav />
        )
      ) : (
        nav
      )}
    </AssistantProvider>
  )
}
