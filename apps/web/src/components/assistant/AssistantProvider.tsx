'use client'

import { useChat } from '@ai-sdk/react'
import { ASSISTANT } from '@nutriboost/ai/identity'
// `DefaultChatTransport` là transport giao diện, không phải SDK gọi model.
// Quy tắc ESLint cấm `ai` ở tầng ứng dụng được nới riêng cho thư mục trợ lý — xem eslint.config.mjs.
import { DefaultChatTransport } from 'ai'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { readStoredThreadId, useAssistantStore } from '@/stores/assistant'

/**
 * Trạng thái và hội thoại của trợ lý Bơ.
 *
 * Provider nằm ở khung ứng dụng, NGOÀI panel. Nhờ vậy panel có thể co giãn bề rộng
 * (thậm chí về 0) mà không mất hội thoại — đây là yêu cầu cốt lõi của đặc tả.
 *
 * Ngoài ra provider còn:
 *   • giữ chữ ký phím tắt (`/`, Esc, Ctrl+J),
 *   • quản lý nhiều đoạn hội thoại,
 *   • khôi phục hội thoại gần nhất sau khi tải lại (nhưng KHÔNG khôi phục tầng đang mở).
 */

export interface ChatThreadSummary {
  id: string
  title: string
}

/** Phần tin nhắn mà giao diện cần đọc. Khớp `UIMessage` của AI SDK nhưng chỉ khai phần dùng tới. */
export interface RenderablePart {
  type: string
  text?: string
  data?: unknown
}

export interface RenderableMessage {
  id: string
  role: string
  parts: RenderablePart[]
}

interface AssistantContextValue {
  messages: RenderableMessage[]
  threads: readonly ChatThreadSummary[]
  activeThreadId: string
  newThread: () => void
  switchThread: (id: string) => void
  send: (text: string) => void
  /** Gửi một ảnh (đã thu nhỏ ở trình duyệt) kèm câu mô tả tuỳ chọn. */
  sendPhoto: (photo: { dataUrl: string; mediaType: string; note?: string }) => void
  stop: () => void
  isStreaming: boolean
  errorMessage: string | null
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext)
  if (context === null) {
    throw new Error('useAssistant phải được dùng bên trong <AssistantProvider>.')
  }
  return context
}

function createThreadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `thread-${Date.now().toString(36)}`
}

function titleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length === 0) return 'Cuộc trò chuyện mới'
  return trimmed.length <= 40 ? trimmed : `${trimmed.slice(0, 40)}…`
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [{ threads, activeThreadId }, setThreadState] = useState(() => {
    const id = createThreadId()
    return { threads: [{ id, title: 'Cuộc trò chuyện mới' }], activeThreadId: id }
  })

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/ai/chat' }), [])

  const { messages, sendMessage, setMessages, status, stop, error } = useChat({ transport })

  // Bản lưu hội thoại theo từng đoạn, để chuyển qua lại không mất nội dung.
  const messagesByThread = useRef(new Map<string, typeof messages>())
  // Đánh dấu lần chuyển đoạn gần nhất, để không ghi đè bản lưu ngay sau khi nạp.
  const skipPersistFor = useRef<string | null>(null)

  useEffect(() => {
    if (skipPersistFor.current === activeThreadId) {
      skipPersistFor.current = null
      return
    }
    messagesByThread.current.set(activeThreadId, messages)
  }, [messages, activeThreadId])

  const isStreaming = status === 'streaming' || status === 'submitted'

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length === 0) return

      // Cập nhật tiêu đề từ tin nhắn đầu tiên của đoạn.
      setThreadState((state) => ({
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === state.activeThreadId && thread.title === 'Cuộc trò chuyện mới'
            ? { ...thread, title: titleFromText(trimmed) }
            : thread,
        ),
      }))

      void sendMessage({ text: trimmed })
    },
    [sendMessage],
  )

  /**
   * Gửi ảnh bữa ăn cho trợ lý.
   *
   * Ảnh đi dưới dạng data URL trong `files` của `sendMessage`: AI SDK đổi nó thành phần `file`
   * của tin nhắn, `convertToModelMessages` giữ nguyên phần đó, và model đa phương thức đọc
   * được. Không có bước tải tệp lên máy chủ, nên không cần kho lưu trữ ảnh.
   *
   * Ảnh PHẢI được thu nhỏ trước khi tới đây (xem `PhotoMealButton`): ảnh 4 MB từ camera điện
   * thoại sẽ làm mỗi lượt chat nặng gấp hàng chục lần, và tiền token trả theo dung lượng ảnh.
   */
  const sendPhoto = useCallback(
    (photo: { dataUrl: string; mediaType: string; note?: string }) => {
      const note = photo.note?.trim() ?? ''
      const text =
        note.length > 0
          ? note
          : 'Mình vừa chụp ảnh bữa ăn. Bơ đọc giúp mình có món gì và khoảng bao nhiêu kcal nhé.'

      setThreadState((state) => ({
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === state.activeThreadId && thread.title === 'Cuộc trò chuyện mới'
            ? { ...thread, title: 'Ảnh bữa ăn' }
            : thread,
        ),
      }))

      /*
       * Mở panel trước khi gửi: người dùng vừa bấm một nút NGOÀI thanh hỏi, nên nếu panel vẫn
       * thu gọn thì câu trả lời của Bơ rơi vào chỗ không ai nhìn thấy.
       */
      useAssistantStore.getState().submitFromBar()

      void sendMessage({
        text,
        files: [
          { type: 'file', mediaType: photo.mediaType, filename: 'bua-an.jpg', url: photo.dataUrl },
        ],
      })
    },
    [sendMessage],
  )

  const newThread = useCallback(() => {
    const id = createThreadId()
    messagesByThread.current.set(id, [])
    skipPersistFor.current = id
    setMessages([])
    setThreadState((state) => ({
      threads: [{ id, title: 'Cuộc trò chuyện mới' }, ...state.threads],
      activeThreadId: id,
    }))
  }, [setMessages])

  const switchThread = useCallback(
    (id: string) => {
      if (id === activeThreadId) return
      // Khoá chuyển đoạn khi đang stream: cắt ngầm sẽ làm mất một phần câu trả lời.
      if (isStreaming) return
      const stored = messagesByThread.current.get(id) ?? []
      skipPersistFor.current = id
      setMessages(stored)
      setThreadState((state) => ({ ...state, activeThreadId: id }))
    },
    [activeThreadId, isStreaming, setMessages],
  )

  // Khôi phục hội thoại gần nhất. Cố tình KHÔNG khôi phục `mode` — đặc tả yêu cầu
  // không bao giờ tự mở panel khi tải trang.
  useEffect(() => {
    const stored = readStoredThreadId()
    if (stored !== null) {
      useAssistantStore.getState().restoreThread(stored)
    }
  }, [])

  // Chữ ký phím tắt dùng chung cho cả ứng dụng.
  useEffect(() => {
    const store = useAssistantStore.getState

    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target
      const typingInField =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (event.key === 'Escape') {
        store().handleEscape()
        return
      }

      // Phím `/` mở thanh hỏi — chỉ khi người dùng không đang gõ ở ô nào khác.
      if (event.key === '/' && !typingInField) {
        event.preventDefault()
        store().setSuggestionsVisible(true)
        document.getElementById('ask-bar-input')?.focus()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        store().toggleSidebar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo<AssistantContextValue>(
    () => ({
      messages: messages as unknown as RenderableMessage[],
      threads,
      activeThreadId,
      newThread,
      switchThread,
      send,
      sendPhoto,
      stop: () => {
        stop()
      },
      isStreaming,
      errorMessage: error === undefined || error === null ? null : 'Bơ đang gặp sự cố kết nối.',
    }),
    [
      messages,
      threads,
      activeThreadId,
      newThread,
      switchThread,
      send,
      sendPhoto,
      stop,
      isStreaming,
      error,
    ],
  )

  // `pathname` được đọc để gợi ý theo ngữ cảnh cập nhật khi đổi màn hình.
  void pathname

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <span className="sr-only" aria-live="polite">
        {isStreaming ? `${ASSISTANT.name} đang trả lời` : ''}
      </span>
    </AssistantContext.Provider>
  )
}
