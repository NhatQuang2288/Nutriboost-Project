'use client'

import { useRef, useState, type ReactNode } from 'react'

import { CameraIcon } from '@/components/icons'

import { useAssistant } from './AssistantProvider'

/**
 * Chụp ảnh bữa ăn rồi gửi cho trợ lý đọc.
 *
 * Ba quyết định trong tệp này:
 *
 *   1. **Thu nhỏ ngay ở trình duyệt.** Ảnh từ camera điện thoại thường 3–6 MB. Gửi nguyên cỡ
 *      thì mỗi lượt chat nặng gấp hàng chục lần, tốn token theo dung lượng ảnh, và trên mạng
 *      di động sẽ chờ rất lâu. Cạnh dài 1024 px là đủ để model đọc ra món.
 *   2. **Hai lối vào.** `capture="environment"` mở thẳng camera sau trên điện thoại, nhưng trên
 *      iOS nó *khoá* vào camera — người dùng không chọn được ảnh đã chụp sẵn. Nên có thêm một
 *      ô nhập không `capture` cho ảnh trong máy.
 *   3. **Không có bước tải tệp lên máy chủ.** Ảnh đi thẳng trong tin nhắn dưới dạng data URL,
 *      nên không cần kho lưu trữ, và ảnh không nằm lại ở đâu ngoài hội thoại.
 *
 * Logic nằm trong `usePhotoMealCapture` để nơi khác (mục "Ghi bữa ăn" ở sidebar) dùng lại mà
 * giữ giao diện riêng của mình.
 */

/** Cạnh dài nhất sau khi thu nhỏ. */
const MAX_EDGE = 1024

/** Chất lượng JPEG. 0,8 là mức còn đọc rõ món mà dung lượng giảm mạnh. */
const JPEG_QUALITY = 0.8

/** Trần kích thước tệp gốc — chặn ảnh RAW hoặc tệp lạ trước khi giải mã. */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024

async function shrinkToJpeg(file: File): Promise<{ dataUrl: string; mediaType: string }> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (context === null) {
      throw new Error('Trình duyệt không cho vẽ ảnh để thu nhỏ.')
    }

    context.drawImage(bitmap, 0, 0, width, height)
    return { dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), mediaType: 'image/jpeg' }
  } finally {
    // Giải phóng bộ nhớ giải mã; ảnh điện thoại chiếm vài chục MB khi đã giải mã.
    bitmap.close()
  }
}

export interface PhotoMealCapture {
  /** Hai ô nhập tệp ẩn. Phải được render ở đâu đó thì `openCamera`/`openLibrary` mới chạy. */
  inputs: ReactNode
  openCamera: () => void
  openLibrary: () => void
  busy: boolean
  error: string | null
}

/** Toàn bộ luồng chụp → thu nhỏ → gửi cho Bơ, không kèm giao diện nút. */
export function usePhotoMealCapture(): PhotoMealCapture {
  const { sendPhoto } = useAssistant()
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined): Promise<void> {
    if (file === undefined) return

    if (!file.type.startsWith('image/')) {
      setError('Tệp này không phải ảnh. Bạn chọn lại giúp mình nhé.')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('Ảnh lớn hơn 20 MB. Bạn chụp lại ở chế độ thường giúp mình nhé.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      sendPhoto(await shrinkToJpeg(file))
    } catch {
      setError('Mình chưa xử lý được ảnh này. Bạn thử ảnh khác hoặc kể bằng một câu nhé.')
    } finally {
      setBusy(false)
      // Xoá giá trị để chọn lại đúng tệp đó vẫn kích hoạt `onChange`.
      if (cameraRef.current !== null) cameraRef.current.value = ''
      if (libraryRef.current !== null) libraryRef.current.value = ''
    }
  }

  const inputs = (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-camera-input"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-library-input"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
        }}
      />
      <span className="sr-only" aria-live="polite">
        {busy ? 'Đang xử lý ảnh bữa ăn' : ''}
      </span>
    </>
  )

  return {
    inputs,
    openCamera: () => cameraRef.current?.click(),
    openLibrary: () => libraryRef.current?.click(),
    busy,
    error,
  }
}

/**
 * Nút chụp ảnh bữa ăn.
 *
 * - `tile` (mặc định): ô vuông trong lưới "Lối vào nhanh" của trang Ghi bữa ăn.
 * - `compact`: một hàng gọn, dùng trong thẻ "Bữa ăn hôm nay" ở trang Hôm nay.
 */
export function PhotoMealButton({ variant = 'tile' }: { variant?: 'tile' | 'compact' }) {
  const { inputs, openCamera, openLibrary, busy, error } = usePhotoMealCapture()

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-1.5">
        {inputs}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={openCamera}
            className="bg-forest-600 hover:bg-forest-700 flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-colors duration-(--duration-fast) disabled:cursor-wait disabled:opacity-60"
          >
            <CameraIcon size={15} />
            {busy ? 'Đang xử lý ảnh…' : 'Chụp ảnh bữa ăn'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={openLibrary}
            className="text-ink-muted text-[12px] underline disabled:opacity-60"
          >
            Chọn ảnh có sẵn
          </button>
        </div>
        {error !== null ? <p className="text-micro text-warning-text">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {inputs}

      <button
        type="button"
        disabled={busy}
        onClick={openCamera}
        className="touch-target border-line bg-surface-sunken flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors duration-(--duration-fast) disabled:cursor-wait disabled:opacity-60"
      >
        <span className="text-forest-600">
          <CameraIcon size={20} />
        </span>
        <span className="text-caption text-ink">
          {busy ? 'Đang xử lý ảnh…' : 'Chụp ảnh bữa ăn'}
        </span>
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={openLibrary}
        className="text-micro text-ink-faint self-start underline disabled:opacity-60"
      >
        Chọn ảnh có sẵn
      </button>

      {error !== null ? <p className="text-micro text-warning-text">{error}</p> : null}
    </div>
  )
}
