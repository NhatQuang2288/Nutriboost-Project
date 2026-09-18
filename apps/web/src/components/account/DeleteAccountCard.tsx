'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AlertIcon, TrashIcon } from '@/components/icons'
import { Card, SectionTitle } from '@/components/ui'

/**
 * Xoá toàn bộ dữ liệu của người dùng.
 *
 * Xác nhận **hai bước**, không phải một: đây là hành động không hoàn tác được, và nút cũ
 * trên màn này bấm vào không làm gì cả — một nút chết còn tệ hơn không có nút, vì người
 * dùng tin là dữ liệu đã bị xoá.
 *
 * Bước một chỉ đổi trạng thái giao diện; chỉ bước hai mới gọi máy chủ.
 */
export function DeleteAccountCard() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function remove(): Promise<void> {
    setStep('deleting')
    setError(null)

    try {
      const response = await fetch('/api/tai-khoan', { method: 'DELETE' })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        setError(payload.error ?? 'Không xoá được dữ liệu của bạn.')
        setStep('confirm')
        return
      }

      clearLocalState()
      /*
       * `replace` chứ không `push`: sau khi xoá tài khoản, quay lại màn "Tôi" bằng nút
       * Back là vào một trang của người dùng không còn tồn tại. `refresh` để bỏ RSC đã
       * lưu trong bộ nhớ đệm của router — nó vẫn dựng từ phiên cũ.
       */
      router.replace('/dang-nhap?xong=da-xoa')
      router.refresh()
    } catch {
      setError('Không kết nối được máy chủ. Bạn thử lại sau một chút.')
      setStep('confirm')
    }
  }

  return (
    <Card className="border-danger/30 bg-danger-surface">
      <SectionTitle>Xoá dữ liệu</SectionTitle>

      <div className="flex gap-3">
        <span className="text-danger-text mt-0.5 shrink-0">
          <AlertIcon size={18} />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-danger-text">
            Xoá vĩnh viễn tài khoản cùng toàn bộ hồ sơ sức khoẻ, nhật ký bữa ăn, lịch tập và hội
            thoại với Bơ. Không hoàn tác được. Nhật ký chi phí AI đã phát sinh được giữ lại nhưng
            không còn gắn với bạn.
          </p>

          {error === null ? null : (
            <p className="text-caption text-danger-text font-semibold" role="alert">
              {error}
            </p>
          )}

          {step === 'idle' ? (
            <button
              type="button"
              onClick={() => {
                setStep('confirm')
              }}
              className="border-danger/40 text-danger-text text-label flex min-h-11 items-center justify-center gap-2 self-start rounded-md border px-5 font-semibold transition-colors duration-(--duration-fast)"
            >
              <TrashIcon size={16} />
              Xoá toàn bộ dữ liệu của tôi
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-label text-danger-text font-semibold">
                Chắc chắn chứ? Hành động này không hoàn tác được.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={step === 'deleting'}
                  onClick={() => void remove()}
                  className="bg-danger text-ink-inverse text-label flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-semibold disabled:opacity-60"
                >
                  <TrashIcon size={16} />
                  {step === 'deleting' ? 'Đang xoá…' : 'Xoá vĩnh viễn'}
                </button>
                <button
                  type="button"
                  disabled={step === 'deleting'}
                  onClick={() => {
                    setStep('idle')
                    setError(null)
                  }}
                  className="border-line bg-surface text-ink text-label flex min-h-11 items-center justify-center rounded-md border px-5 font-semibold disabled:opacity-60"
                >
                  Giữ lại dữ liệu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Xoá trạng thái cục bộ còn sót lại của người dùng vừa xoá tài khoản.
 *
 * Hội thoại với Bơ được giữ trong `localStorage` để mở lại được sau khi tải trang. Xoá tài
 * khoản trên máy chủ mà để lại phần này là còn sót dữ liệu người dùng trên chính máy họ.
 *
 * Lọc theo tiền tố `nb.` thay vì `clear()`: `clear()` xoá mọi thứ của cả origin, kể cả dữ
 * liệu của ứng dụng khác chạy cùng tên miền.
 */
function clearLocalState(): void {
  try {
    const keys: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key !== null && key.startsWith('nb.')) keys.push(key)
    }
    for (const key of keys) window.localStorage.removeItem(key)
  } catch {
    // Trình duyệt chặn localStorage (chế độ riêng tư). Không có gì để xoá.
  }
}
