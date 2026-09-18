import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NutriBoost — trợ lý dinh dưỡng',
    short_name: 'NutriBoost',
    description:
      'Ghi bữa ăn bằng một câu, nhận gợi ý phù hợp, theo dõi tiến độ. Không thay thế tư vấn y khoa.',
    lang: 'vi',
    dir: 'ltr',
    start_url: '/hom-nay',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Lấy đúng nền ứng dụng trong design system để màn khởi động không chớp màu.
    background_color: '#fafaf7',
    theme_color: '#fafaf7',
    categories: ['health', 'food', 'lifestyle'],
    /*
     * PNG 192 và 512 là yêu cầu tối thiểu để cài được lên màn hình chính. Trước đây chỉ khai
     * báo `/icon.svg`, mà tệp đó **không tồn tại** — không có thư mục `public/` nào cả, nên
     * yêu cầu icon trả 404 và ứng dụng không cài được.
     *
     * `maskable` để Android cắt tròn mà không mất hình: bản maskable có nền tràn viền và hình
     * nằm gọn trong vùng an toàn 80% ở giữa.
     *
     * Sinh lại bằng `npm run icons:generate`.
     */
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
