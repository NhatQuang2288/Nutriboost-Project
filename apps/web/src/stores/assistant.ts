'use client'

import { create } from 'zustand'

/**
 * Trạng thái của lớp trợ lý.
 *
 * Sống NGOÀI panel, ở cấp khung ứng dụng. Đây là lý do việc animate bề rộng panel
 * không làm mất hội thoại: state không nằm trong cây DOM bị co giãn.
 *
 * `mode` CỐ TÌNH không lưu vào localStorage — đặc tả yêu cầu không bao giờ tự mở
 * panel khi tải trang.
 */

export type AssistantMode = 'bar' | 'sidebar' | 'fullscreen'

export const THREAD_STORAGE_KEY = 'nb.assistant.threadId'

interface AssistantState {
  mode: AssistantMode
  /** Nội dung đang gõ, giữ nguyên khi đổi tầng. */
  draft: string
  activeThreadId: string | null
  /** Bật sau lần mở panel đầu tiên; trước đó chỉ render khung rỗng cho nhẹ. */
  hasOpenedOnce: boolean
  /** Gợi ý theo ngữ cảnh màn hình có đang hiện không. */
  suggestionsVisible: boolean

  /** Ô trống bấm "Mở rộng": bar → sidebar. */
  expandFromBar: () => void
  /** Có nội dung và bấm Enter: bar → sidebar (tin nhắn do lớp gọi gửi đi). */
  submitFromBar: () => void
  /** sidebar → fullscreen. */
  toFullscreen: () => void
  /** fullscreen → sidebar. Nút thu nhỏ. */
  toSidebar: () => void
  /** Bất kỳ tầng nào → bar. Nút X. */
  closePanel: () => void
  /** Phím Esc. fullscreen → sidebar (KHÔNG đóng), sidebar → bar. */
  handleEscape: () => void
  toggleSidebar: () => void

  setDraft: (value: string) => void
  setSuggestionsVisible: (value: boolean) => void
  setActiveThreadId: (id: string | null) => void
  /** Khôi phục hội thoại gần nhất sau khi tải lại. Chỉ khôi phục thread, không khôi phục tầng. */
  restoreThread: (id: string) => void
  reset: () => void
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  mode: 'bar',
  draft: '',
  activeThreadId: null,
  hasOpenedOnce: false,
  suggestionsVisible: false,

  expandFromBar: () => {
    set({ mode: 'sidebar', hasOpenedOnce: true })
  },

  submitFromBar: () => {
    set({ mode: 'sidebar', hasOpenedOnce: true, suggestionsVisible: false })
  },

  toFullscreen: () => {
    set({ mode: 'fullscreen' })
  },

  toSidebar: () => {
    set({ mode: 'sidebar' })
  },

  closePanel: () => {
    set({ mode: 'bar', suggestionsVisible: false })
  },

  handleEscape: () => {
    // Esc ở toàn màn hình thu về panel, KHÔNG đóng panel. Đây là luật có test riêng.
    const { mode } = get()
    if (mode === 'fullscreen') {
      set({ mode: 'sidebar' })
      return
    }
    if (mode === 'sidebar') {
      set({ mode: 'bar', suggestionsVisible: false })
    }
  },

  toggleSidebar: () => {
    const { mode } = get()
    if (mode === 'bar') {
      set({ mode: 'sidebar', hasOpenedOnce: true })
    } else {
      set({ mode: 'bar', suggestionsVisible: false })
    }
  },

  setDraft: (value) => {
    set({ draft: value })
  },

  setSuggestionsVisible: (value) => {
    set({ suggestionsVisible: value })
  },

  setActiveThreadId: (id) => {
    set({ activeThreadId: id })
    if (typeof window !== 'undefined') {
      if (id === null) {
        window.localStorage.removeItem(THREAD_STORAGE_KEY)
      } else {
        window.localStorage.setItem(THREAD_STORAGE_KEY, id)
      }
    }
  },

  restoreThread: (id) => {
    set({ activeThreadId: id })
  },

  reset: () => {
    set({
      mode: 'bar',
      draft: '',
      activeThreadId: null,
      hasOpenedOnce: false,
      suggestionsVisible: false,
    })
  },
}))

/** Đọc hội thoại gần nhất từ localStorage. Bọc try vì trình duyệt có thể chặn. */
export function readStoredThreadId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(THREAD_STORAGE_KEY)
  } catch {
    return null
  }
}
