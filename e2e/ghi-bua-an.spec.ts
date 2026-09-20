import { expect, test } from '@playwright/test'

/**
 * Ghi bữa ăn ở giao diện khách hàng.
 *
 * Bộ test này khoá hai lỗi có thật, cả hai đều là "giao diện nói dối người dùng":
 *
 *   1. Nút "Lưu bữa này" trên thẻ xác nhận chỉ đổi một biến React rồi hiện "Đã lưu" — trong khi
 *      chưa có gì được ghi. Ở chế độ dữ liệu mẫu (không có phiên đăng nhập) nó phải nói thẳng
 *      là cần đăng nhập.
 *   2. Ô "Chụp ảnh" từng bị vô hiệu kèm nhãn "(sắp có)". Nay nó gửi ảnh thật cho trợ lý, và khi
 *      chưa cấu hình khoá AI thì Bơ phải nói thẳng là chưa đọc được ảnh — không được để câu trả
 *      lời nói về câu mô tả kèm theo, vì người dùng sẽ tưởng ảnh đã được đọc.
 */

const ASK_INPUT = '#ask-bar-input'
const MESSAGE_LIST = '[data-testid="message-list"]'

/** PNG 4×4 hợp lệ, sinh sẵn — đủ để `createImageBitmap` giải mã được trong trình duyệt. */
const PNG_4X4 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBhXY6iI0viPjBlIFwAAJogfkdzk710AAAAASUVORK5CYII=',
  'base64',
)

test.describe('ghi bữa ăn', () => {
  test('thẻ xác nhận nói thật khi chưa đăng nhập, không giả vờ đã lưu', async ({ page }) => {
    await page.goto('/ghi-nhan')

    await page.fill(ASK_INPUT, 'trưa nay mình ăn cơm tấm sườn')
    await page.press(ASK_INPUT, 'Enter')

    // Thẻ xác nhận bữa ăn do pipeline tất định dựng ra, không cần model.
    await expect(page.locator(MESSAGE_LIST)).toContainText('Cơm tấm sườn')

    await page.getByRole('button', { name: /Lưu bữa này|Đúng rồi/ }).click()

    // Chưa có phiên nên phải nói thẳng; tuyệt đối không được hiện "Đã lưu".
    await expect(page.locator(MESSAGE_LIST)).toContainText('Cần đăng nhập để lưu bữa ăn', {
      timeout: 20_000,
    })
    await expect(page.getByRole('button', { name: 'Đã lưu' })).toHaveCount(0)
  })

  test('nút chụp ảnh gửi ảnh thật cho trợ lý', async ({ page }) => {
    await page.goto('/ghi-nhan')

    // Chụp ảnh không còn là ô "(sắp có)".
    await expect(page.getByText('Chụp ảnh bữa ăn')).toBeVisible()

    await page.setInputFiles('[data-testid="photo-camera-input"]', {
      name: 'bua-an.png',
      mimeType: 'image/png',
      buffer: PNG_4X4,
    })

    // Chưa cấu hình khoá AI, nên Bơ phải nói thẳng là chưa đọc được ảnh.
    await expect(page.locator(MESSAGE_LIST)).toContainText('chưa đọc được ảnh', {
      timeout: 30_000,
    })
  })
})
