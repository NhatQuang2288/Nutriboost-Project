import { expect, test } from '@playwright/test'

/**
 * PWA: manifest, icon, và biểu đồ tiến độ.
 *
 * Bộ test này khoá lại một lỗi có thật: manifest khai báo `/icon.svg` trong khi **không có
 * thư mục `public/` nào cả**. Yêu cầu icon trả 404, và ứng dụng không cài được lên màn hình
 * chính. Lỗi này không hiện ra ở đâu khác — trang vẫn mở bình thường, chỉ có tính năng cài
 * đặt là âm thầm hỏng.
 */

const ICON_FILES = [
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
] as const

test.describe('PWA', () => {
  test('mọi tệp icon đều tải được, không tệp nào 404', async ({ request }) => {
    for (const path of ICON_FILES) {
      const response = await request.get(path)
      expect(response.status(), `${path} phải tải được`).toBe(200)
    }
  })

  test('icon PNG là ảnh thật, không phải trang HTML lỗi', async ({ request }) => {
    const response = await request.get('/icon-512.png')
    expect(response.headers()['content-type']).toContain('image/png')

    const body = await response.body()
    // Chữ ký PNG: 89 50 4E 47. Thiếu nó nghĩa là tệp hỏng hoặc đang phục vụ nhầm thứ khác.
    expect([...body.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
  })

  test('manifest khai báo đủ icon để cài được lên màn hình chính', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')
    expect(response.status()).toBe(200)

    const manifest = (await response.json()) as {
      display?: string
      start_url?: string
      icons?: { sizes?: string; purpose?: string }[]
    }

    // 192 và 512 là mức tối thiểu trình duyệt yêu cầu để cho cài đặt.
    const sizes = (manifest.icons ?? []).map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    // Thiếu bản maskable thì Android cắt tròn sẽ mất hình.
    expect((manifest.icons ?? []).some((icon) => icon.purpose === 'maskable')).toBe(true)
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/hom-nay')
  })

  test('trang Tiến độ nói thẳng là chưa có số liệu, không vẽ biểu đồ giả', async ({ page }) => {
    // Bộ kiểm thử chạy ở chế độ dữ liệu mẫu nên không có số liệu thật. Điều phải khoá lại là
    // giao diện KHÔNG bịa ra một biểu đồ trông như thật.
    await page.goto('/tien-do')

    await expect(page.getByRole('heading', { name: 'Tiến độ' })).toBeVisible()
    await expect(page.getByText('Chưa đủ dữ liệu để vẽ biểu đồ')).toBeVisible()
    await expect(page.getByText(/chế độ dữ liệu mẫu/)).toBeVisible()
    // Hai khối biểu đồ vẫn có mặt, ở trạng thái chưa có dữ liệu.
    await expect(page.getByRole('heading', { name: 'Cân nặng' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Năng lượng nạp vào' })).toBeVisible()
  })
})
