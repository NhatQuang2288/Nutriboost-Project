/**
 * Service worker của NutriBoost.
 *
 * Nguyên tắc duy nhất: **chỉ cache tài nguyên tĩnh có tên bất biến**. Không bao giờ cache
 * HTML, không bao giờ cache API.
 *
 * Vì sao chặt như vậy: ứng dụng này hiển thị số liệu sức khoẻ. Phục vụ một trang HTML cũ
 * nghĩa là hiển thị mục tiêu kcal cũ hoặc nhật ký cũ — người dùng sẽ ra quyết định ăn uống
 * dựa trên số liệu sai, và không có cách nào họ biết. Tệ hơn là tiết kiệm được vài mili giây.
 *
 * Tài nguyên trong `/_next/static/` có hàm băm trong tên tệp nên nội dung của một đường dẫn
 * là bất biến — cache chúng là an toàn tuyệt đối.
 */

const CACHE = 'nutriboost-static-v1'

/** Chỉ những đường dẫn khớp mẫu này mới được cache. */
function isImmutableAsset(pathname) {
  if (pathname.startsWith('/_next/static/')) return true
  return /\.(?:png|svg|ico|woff2?)$/.test(pathname)
}

self.addEventListener('install', () => {
  // Không chờ tab cũ đóng lại: bản mới không đổi hành vi của trang đang mở.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  // Chỉ `GET`, chỉ cùng tên miền. `POST` không bao giờ được phục vụ từ cache.
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!isImmutableAsset(url.pathname)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)
      if (cached !== undefined) return cached

      const response = await fetch(request)
      // Chỉ cache phản hồi thành công và cùng tên miền.
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone())
      }
      return response
    })(),
  )
})
