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

  test('trang Tiến độ vẽ tuần mẫu NHƯNG phải nói rõ đó là dữ liệu mẫu', async ({ page }) => {
    /*
     * Bộ kiểm thử chạy ở chế độ dữ liệu mẫu nên không có số liệu thật.
     *
     * Điều phải khoá lại đã đổi, có chủ ý: chế độ mẫu **được phép** vẽ biểu đồ — nếu không thì
     * không ai nhìn thấy biểu đồ trong lúc phát triển, và lỗi bố cục chỉ lộ ra ở môi trường có
     * dữ liệu thật. Đổi lại, dải báo "đang hiện dữ liệu mẫu" trở thành **bắt buộc**: thiếu nó
     * là giao diện đang trình một tuần số liệu của người khác như thể là của người đang xem.
     */
    await page.goto('/tien-do')

    await expect(page.getByRole('heading', { name: 'Tiến độ' })).toBeVisible()

    // Không có dải báo này thì biểu đồ bên dưới là nói dối.
    await expect(page.getByText('Đang hiện dữ liệu mẫu')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Cân nặng' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Năng lượng nạp vào' })).toBeVisible()

    // Tuần mẫu có 7 điểm, nên cả hai khối đều vẽ thật thay vì rơi về trạng thái rỗng.
    await expect(page.locator('[aria-label*="Cân nặng theo thời gian"]')).toBeVisible()
    await expect(page.locator('[aria-label*="Năng lượng nạp vào theo ngày"]')).toBeVisible()
    await expect(page.getByText('Chưa đủ dữ liệu để vẽ biểu đồ')).toHaveCount(0)
  })
})
