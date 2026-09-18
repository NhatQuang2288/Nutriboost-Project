'use client'

import type { ReactNode } from 'react'

import { AskBar } from '@/components/assistant/AskBar'
import { AssistantDock } from '@/components/assistant/AssistantDock'
import { AssistantProvider } from '@/components/assistant/AssistantProvider'
import { BottomNav } from '@/components/shell/BottomNav'
import { useAssistantStore } from '@/stores/assistant'

/**
 * Khung ứng dụng đã đăng nhập, có lớp trợ lý.
 *
 * Bố cục là flex hai cột: cột nội dung co giãn, panel trợ lý giữ bề rộng cố định.
 * Panel nằm trong flex này chứ không phải lớp phủ, nên mở panel sẽ **đẩy** nội dung
 * sang trái ở màn hình lớn — đúng đặc tả.
 *
 * Thanh hỏi (tầng 1) chỉ hiện khi panel đang thu gọn.
 *
 * Tham số `nav` cho phép console PT dùng điều hướng riêng:
 *   • bỏ trống  → thanh điều hướng dưới của khách hàng
 *   • truyền `null` → không có điều hướng dưới (PT dùng tab ngang ở đầu trang)
 */
export function AssistantShell({
  children,
  nav,
  wide,
}: {
  children: ReactNode
  nav?: ReactNode
  /** Cột nội dung rộng hơn cho bảng biểu của console PT. */
  wide?: boolean
}) {
  const mode = useAssistantStore((state) => state.mode)

  return (
    <AssistantProvider>
      <div className="bg-bg flex min-h-dvh">
        <main className="safe-top min-w-0 flex-1">
          <div
            className={`mx-auto w-full px-4 pt-4 pb-44 ${
              wide === true ? 'max-w-[var(--width-console)]' : 'max-w-[var(--width-content)]'
            }`}
          >
            {children}
          </div>
        </main>

        <AssistantDock />
      </div>

      {mode === 'bar' ? <AskBar /> : null}

      {nav === undefined ? <BottomNav /> : nav}
    </AssistantProvider>
  )
}
