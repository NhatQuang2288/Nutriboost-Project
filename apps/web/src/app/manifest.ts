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
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
