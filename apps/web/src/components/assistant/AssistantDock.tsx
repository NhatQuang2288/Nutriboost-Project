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
import { VoiceInput } from '@/components/assistant/VoiceInput'

import styles from './assistant.module.css'

/**
 * Khung trợ lý Bơ AI.
 *
 * Giữ nguyên logic cũ:
 * - Không unmount khi thu gọn
 * - Giữ nguyên conversation
 * - Hỗ trợ sidebar / fullscreen
 * - Hỗ trợ thread
 * - Hỗ trợ streaming
 * - Hỗ trợ generative parts
 *
 * Chỉ thay đổi giao diện.
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
      inert={collapsed}
      aria-hidden={collapsed}
      aria-label={`Trợ lý ${ASSISTANT.name}`}
      className={styles.dock}
    >
      <div
        className={[
          styles.inner,
          'bg-white',
          'border-l border-black/5',
          'shadow-[-12px_0_40px_rgba(20,50,30,0.08)]',
        ].join(' ')}
        data-testid="dock-inner"
      >
        <div className={styles.dragHandle} aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-olive-200" />
        </div>

        <DockHeader
          onExpand={toFullscreen}
          onCollapse={toSidebar}
          onClose={closePanel}
          mode={mode}
        />

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
    <header className="border-line-subtle flex shrink-0 items-center gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur">
      {/* Avatar Bơ */}
      <span className="bg-forest-600 flex size-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm">
        <BoIcon size={22} />
      </span>

      {/* Tên + thread */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-ink text-sm font-bold">{ASSISTANT.name}</p>

          <span className="size-1.5 rounded-full bg-green-500" />
        </div>

        <ThreadSwitcher />
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {isFullscreen ? (
          <IconButton label="Thu về panel" onClick={onCollapse}>
            <MinimizeIcon size={17} />
          </IconButton>
        ) : (
          <IconButton label="Mở toàn màn hình" onClick={onExpand}>
            <MaximizeIcon size={17} />
          </IconButton>
        )}

        <IconButton label="Đóng trợ lý" onClick={onClose}>
          <CloseIcon size={17} />
        </IconButton>
      </div>
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
      className={[
        'flex size-9 items-center justify-center rounded-xl',
        'text-ink-muted',
        'transition-all duration-200',
        'hover:text-forest-700 hover:bg-olive-50',
        'active:scale-95',
      ].join(' ')}
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
        className={[
          'text-ink-muted flex max-w-full items-center gap-1',
          'text-[11px]',
          'transition-colors duration-200',
          'hover:text-forest-700',
        ].join(' ')}
      >
        <span className="truncate">{active?.title ?? 'Cuộc trò chuyện mới'}</span>

        <ChevronDownIcon size={13} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Danh sách hội thoại"
          className={[
            'border-line absolute top-full left-0 z-20 mt-2 bg-white',
            'w-72 rounded-2xl border p-1.5',
            'shadow-[0_15px_40px_rgba(20,50,30,0.12)]',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => {
              newThread()
              setOpen(false)
            }}
            className={[
              'text-accent-text flex w-full items-center gap-2',
              'rounded-xl px-3 py-2.5 text-left text-xs font-semibold',
              'transition-colors hover:bg-olive-50',
            ].join(' ')}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-olive-100">
              <PlusIcon size={14} />
            </span>
            Hội thoại mới
          </button>

          {threads.length > 0 ? <div className="my-1 border-t border-black/5" /> : null}

          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              role="option"
              aria-selected={thread.id === activeThreadId}
              disabled={isStreaming && thread.id !== activeThreadId}
              onClick={() => {
                switchThread(thread.id)
                setOpen(false)
              }}
              className={[
                'flex w-full truncate rounded-xl px-3 py-2.5',
                'text-left text-xs',
                'transition-colors duration-200',
                'disabled:opacity-40',
                thread.id === activeThreadId
                  ? 'text-forest-700 bg-olive-50 font-semibold'
                  : 'text-ink-muted hover:bg-surface-sunken',
              ].join(' ')}
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: 'end',
    })
  }, [messages.length, isStreaming])

  const suggestions = suggestionsFor(pathname)
  const isEmpty = messages.length === 0

  return (
    <>
      {/* Message area */}
      <div className="flex-1 overflow-y-auto bg-[#fbfcfa] px-4 py-5" data-testid="message-list">
        {isEmpty ? (
          <EmptyConversation suggestions={suggestions} onPick={(text) => send(text)} />
        ) : (
          <ul className="flex flex-col gap-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        )}

        {errorMessage === null ? null : (
          <p className="border-danger/30 bg-danger-surface text-caption text-danger-text mt-4 rounded-2xl border px-4 py-3">
            {errorMessage}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        className="border-line-subtle shrink-0 border-t bg-white px-4 pt-3 pb-4"
        onSubmit={(event) => {
          event.preventDefault()

          const text = draft.trim()

          if (text.length === 0) return

          setDraft('')
          send(text)
        }}
      >
        <div
          className={[
            'border-line-subtle bg-surface-sunken',
            'flex items-end gap-2 rounded-2xl border p-2',
            'transition-all duration-200',
            'focus-within:border-olive-300',
            'focus-within:ring-4 focus-within:ring-olive-100/70',
          ].join(' ')}
        >
          <textarea
            rows={1}
            value={draft}
            aria-label="Nhập tin nhắn cho Bơ"
            placeholder="Hỏi Bơ về khách hàng, thực đơn..."
            className={[
              'text-body text-ink placeholder:text-ink-faint',
              'max-h-28 min-h-9 flex-1 resize-none',
              'bg-transparent px-2 py-2',
              'outline-none',
            ].join(' ')}
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
          <VoiceInput
  onResult={(text) => {
    setDraft(text)
  }}
/>

          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            disabled={draft.trim().length === 0}
            className={[
              'flex size-10 shrink-0 items-center justify-center',
              'rounded-xl',
              'bg-forest-600 text-white',
              'shadow-sm',
              'transition-all duration-200',
              'hover:bg-forest-700',
              'active:scale-95',
              'disabled:bg-neutral-200',
              'disabled:text-neutral-400',
              'disabled:shadow-none',
            ].join(' ')}
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
  suggestions: readonly {
    label: string
    message?: string
  }[]
  onPick: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      {/* Bơ avatar */}
      <div className="relative">
        <span className="bg-forest-600 flex size-16 items-center justify-center rounded-[22px] text-white shadow-sm">
          <BoIcon size={32} />
        </span>

        <span className="absolute -right-1 -bottom-1 size-4 rounded-full border-2 border-white bg-green-500" />
      </div>

      <p className="text-ink mt-4 text-base font-bold">{ASSISTANT.name}</p>

      <p className="text-caption text-ink-muted mt-1 max-w-[280px] leading-relaxed">
        {ASSISTANT.tagline}
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="mt-6 w-full">
          <p className="text-micro text-ink-faint mb-2 text-left font-semibold tracking-wider uppercase">
            Gợi ý cho bạn
          </p>

          <div className="flex w-full flex-col gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => onPick(suggestion.message ?? suggestion.label)}
                className={[
                  'border-line-subtle bg-white',
                  'text-caption text-ink',
                  'w-full rounded-2xl border',
                  'px-4 py-3',
                  'text-left',
                  'shadow-sm',
                  'transition-all duration-200',
                  'hover:border-olive-200',
                  'hover:bg-olive-50',
                  'hover:shadow-none',
                  'active:scale-[0.99]',
                ].join(' ')}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface MessageBubbleProps {
  message: {
    id: string
    role: string
    parts: RenderablePart[]
  }
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const rendered = useMemo(
    () => message.parts.map((part, index) => renderPart(part, index)),
    [message.parts],
  )

  return (
    <li className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={isUser ? 'max-w-[86%]' : 'w-full max-w-full'}>
        {isUser ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-micro text-ink-faint pr-1">Bạn</span>

            <p className="bg-forest-600 text-body rounded-2xl rounded-br-md px-4 py-3 text-white shadow-sm">
              {message.parts
                .filter((part) => part.type === 'text')
                .map((part) => part.text ?? '')
                .join(' ')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-forest-700 flex size-7 items-center justify-center rounded-lg bg-olive-100">
                <BoIcon size={15} />
              </span>

              <span className="text-micro text-ink-faint font-semibold tracking-wide uppercase">
                Bơ AI
              </span>
            </div>

            <div className="pl-1">
              <div className="flex flex-col gap-3">{rendered}</div>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

function renderPart(part: RenderablePart, index: number): React.ReactNode {
  if (part.type === 'text') {
    const text = part.text ?? ''

    if (text.trim().length === 0) {
      return null
    }

    return (
      <p key={index} className="text-body text-ink leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    )
  }

  if (part.type.startsWith('data-')) {
    const name = part.type.slice('data-'.length)

    // `data-suggestions` là phần điều khiển,
    // không phải giao diện.
    if (name === 'suggestions') {
      return null
    }

    const parsed = parseGenerativePayload(name, part.data)

    if (parsed.ok) {
      return <GenerativePart key={index} payload={parsed.payload} />
    }

    return <UnknownPart key={index} name={name} />
  }

  return null
}
