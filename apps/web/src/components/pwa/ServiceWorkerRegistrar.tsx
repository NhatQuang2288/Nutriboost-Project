'use client'

import { useEffect } from 'react'

/**
 * Đăng ký service worker.
 *
 * Chỉ chạy ở bản dựng thật. Ở chế độ phát triển, service worker nằm giữa trình duyệt và máy
 * chủ dev, và nó phục vụ tài nguyên cũ sau mỗi lần sửa mã — một nguồn mất thời gian rất khó
 * lần ra vì triệu chứng là "sửa rồi mà không thấy đổi gì".
 *
 * Không đăng ký cũng không làm hỏng gì: `sw.js` chỉ tăng tốc lần tải thứ hai. Ứng dụng cài
 * được lên màn hình chính nhờ manifest và icon, không cần service worker.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    // Bọc `try` vì `register` từ chối khi chạy trong ngữ cảnh không an toàn (HTTP qua IP),
    // và một lời hứa bị từ chối không ai bắt sẽ hiện lỗi trong console của người dùng.
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('Không đăng ký được service worker:', error)
    })
  }, [])

  return null
}
