'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { ASSISTANT } from '@nutriboost/ai/identity'
import { parseGenerativePayload } from '@nutriboost/ai/schemas'

import { BoIcon } from '@/components/icons/BoIcon'
import {
  ChevronDownIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusIcon,
  SendIcon,
} from '@/components/icons'
import { useAssistant, type RenderablePart } from '@/components/assistant/AssistantProvider'
import { GenerativePart, UnknownPart } from '@/components/assistant/generative/registry'
import { suggestionsFor } from '@/components/assistant/suggestions'
import { useAssistantStore } from '@/stores/assistant'

import styles from './assistant.module.css'

/**
 * Tầng 2 và 3 — panel 400px và chế độ toàn màn hình.
 *
 * LUẬT QUAN TRỌNG NHẤT: khối này **không bao giờ unmount** và **không bao giờ
 * trả `null`**. Thu gọn bằng `width: 0` + `inert` + `aria-hidden`.
 * Nếu unmount, hội thoại sẽ mất — đúng lỗi mà đặc tả yêu cầu tránh.
 */
export function AssistantDock() {
  const mode = useAssistantStore((state) => state.mode)
  const hasOpenedOnce = useAssistantStore((state) => state.hasOpenedOnce)
  const toFullscreen = useAssistantStore((state) => state.toFullscreen)
  const toSidebar = useAssistantStore((state) => state.toSidebar)
  const closePanel = useAssistantStore((state) => state.closePanel)

  const collapsed = mode === 'bar'

  return (
    <aside
      id="assistant-dock"
      data-mode={mode}
      data-testid="assistant-dock"
      // `inert` + `aria-hidden` thay cho `display: none` — giữ nguyên cây DOM và trạng thái.
      inert={collapsed}
      aria-hidden={collapsed}
      aria-label={`Trợ lý ${ASSISTANT.name}`}
      className={styles.dock}
    >
      <div className={styles.inner} data-testid="dock-inner">
        <div className={styles.dragHandle} aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>

        <DockHeader
          onExpand={toFullscreen}
          onCollapse={toSidebar}
          onClose={closePanel}
          mode={mode}
        />

        {/*
          Mount lười phần nặng: trước lần mở đầu tiên chỉ có khung rỗng.
          Từ lần mở đầu tiên trở đi, nội dung ở lại mãi — nhờ vậy cuộn và trạng thái
          thẻ không bị mất khi thu gọn panel.
        */}
        {hasOpenedOnce ? <DockBody /> : null}
      </div>
    </aside>
  )
}

function DockHeader({
  mode,
  onExpand,
  onCollapse,
  onClose,
}: {
  mode: string
  onExpand: () => void
  onCollapse: () => void
  onClose: () => void
}) {
  const isFullscreen = mode === 'fullscreen'

  return (
    <header className="border-line-subtle flex items-center gap-2 border-b px-3 py-2.5">
      <span className="text-forest-600 flex size-8 shrink-0 items-center justify-center rounded-full bg-olive-100">
        <BoIcon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-label text-ink truncate font-semibold">{ASSISTANT.name}</p>
        <ThreadSwitcher />
      </div>

      {isFullscreen ? (
        <IconButton label="Thu về panel" onClick={onCollapse}>
          <MinimizeIcon size={18} />
        </IconButton>
      ) : (
        <IconButton label="Mở toàn màn hình" onClick={onExpand}>
          <MaximizeIcon size={18} />
        </IconButton>
      )}

      <IconButton label="Đóng trợ lý" onClick={onClose}>
        <CloseIcon size={18} />
      </IconButton>
    </header>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="touch-target text-ink-muted hover:bg-surface-sunken hover:text-ink flex size-9 items-center justify-center rounded-md transition-colors duration-(--duration-fast)"
    >
      {children}
    </button>
  )
}

function ThreadSwitcher() {
  const { threads, activeThreadId, switchThread, newThread, isStreaming } = useAssistant()
  const [open, setOpen] = useState(false)
  const active = threads.find((thread) => thread.id === activeThreadId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid="thread-switcher"
        className="text-caption text-ink-muted hover:text-ink flex max-w-full items-center gap-1 transition-colors duration-(--duration-fast)"
      >
        <span className="truncate">{active?.title ?? 'Cuộc trò chuyện mới'}</span>
        <ChevronDownIcon size={14} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Danh sách hội thoại"
          className="border-line bg-surface absolute top-full left-0 z-10 mt-1 w-64 rounded-md border p-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              newThread()
              setOpen(false)
            }}
            className="text-caption text-accent-text flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-olive-50"
          >
            <PlusIcon size={14} /> Hội thoại mới
          </button>

          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              role="option"
              aria-selected={thread.id === activeThreadId}
              // Khoá chuyển đoạn khi đang stream để không cắt ngầm câu trả lời.
              disabled={isStreaming && thread.id !== activeThreadId}
              onClick={() => {
                switchThread(thread.id)
                setOpen(false)
              }}
              className={`text-caption block w-full truncate rounded-sm px-2 py-2 text-left transition-colors duration-(--duration-fast) disabled:opacity-40 ${
                thread.id === activeThreadId
                  ? 'bg-surface-sunken text-ink font-semibold'
                  : 'text-ink-muted hover:bg-surface-sunken'
              }`}
            >
              {thread.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DockBody() {
  const pathname = usePathname()
  const { messages, send, isStreaming, errorMessage } = useAssistant()
  const draft = useAssistantStore((state) => state.draft)
  const setDraft = useAssistantStore((state) => state.setDraft)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Cuộn theo câu trả lời đang chảy, nhưng không giật khi người dùng đã cuộn lên.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, isStreaming])

  const suggestions = suggestionsFor(pathname)
  const isEmpty = messages.length === 0

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4" data-testid="message-list">
        {isEmpty ? (
          <EmptyConversation suggestions={suggestions} onPick={(text) => send(text)} />
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        )}

        {errorMessage === null ? null : (
          <p className="border-danger/30 bg-danger-surface text-caption text-danger-text mt-4 rounded-md border px-3 py-2">
            {errorMessage}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        className="border-line-subtle border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          const text = draft.trim()
          if (text.length === 0) return
          setDraft('')
          send(text)
        }}
      >
        <div className="border-line bg-surface-sunken flex items-end gap-2 rounded-lg border p-1.5">
          <textarea
            rows={1}
            value={draft}
            aria-label="Nhập tin nhắn cho Bơ"
            placeholder="Nhắn cho Bơ…"
            className="text-body text-ink placeholder:text-ink-faint max-h-24 flex-1 resize-none bg-transparent px-2 py-1.5 outline-none"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                const text = draft.trim()
                if (text.length === 0) return
                setDraft('')
                send(text)
              }
            }}
          />
          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            className="touch-target bg-forest-600 text-ink-inverse flex size-9 shrink-0 items-center justify-center rounded-md disabled:bg-neutral-300"
            disabled={draft.trim().length === 0}
          >
            <SendIcon size={18} />
          </button>
        </div>
        <p className="text-micro text-ink-faint mt-2 text-center">{ASSISTANT.signature}</p>
      </form>
    </>
  )
}

function EmptyConversation({
  suggestions,
  onPick,
}: {
  suggestions: readonly { label: string; message?: string }[]
  onPick: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="text-forest-600 flex size-14 items-center justify-center rounded-full bg-olive-100">
        <BoIcon size={30} />
      </span>
      <p className="text-body text-ink">{ASSISTANT.tagline}</p>

      <div className="flex w-full flex-col gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onPick(suggestion.message ?? suggestion.label)}
            className="border-line-subtle bg-surface text-caption text-ink-muted w-full rounded-lg border px-3 py-2.5 text-left transition-colors duration-(--duration-fast) hover:border-olive-200 hover:bg-olive-50"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: { id: string; role: string; parts: RenderablePart[] }
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const rendered = useMemo(
    () => message.parts.map((part, index) => renderPart(part, index)),
    [message.parts],
  )

  return (
    <li className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={isUser ? 'max-w-[85%]' : 'w-full max-w-full'}>
        {isUser ? (
          <p className="bg-forest-600 text-body text-ink-inverse rounded-lg rounded-br-sm px-3 py-2">
            {message.parts
              .filter((part) => part.type === 'text')
              .map((part) => part.text ?? '')
              .join(' ')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-micro text-ink-faint flex items-center gap-1.5">
              <BoIcon size={14} /> BƠ
            </span>
            {rendered}
          </div>
        )}
      </div>
    </li>
  )
}

function renderPart(part: RenderablePart, index: number): React.ReactNode {
  if (part.type === 'text') {
    const text = part.text ?? ''
    if (text.trim().length === 0) return null
    return (
      <p key={index} className="text-body text-ink whitespace-pre-wrap">
        {text}
      </p>
    )
  }

  if (part.type.startsWith('data-')) {
    const name = part.type.slice('data-'.length)

    // `data-suggestions` là phần điều khiển, không phải giao diện.
    if (name === 'suggestions') return null

    const parsed = parseGenerativePayload(name, part.data)
    if (parsed.ok) {
      return <GenerativePart key={index} payload={parsed.payload} />
    }
    // Tên lạ hoặc props sai: hiện thẻ dự phòng, tuyệt đối không render tuỳ ý.
    return <UnknownPart key={index} name={name} />
  }

  return null
}
