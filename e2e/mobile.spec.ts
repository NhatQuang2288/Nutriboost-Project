import { expect, test, type Page } from '@playwright/test'

/**
 * Kiểm thử lớp trợ lý trên màn hình điện thoại.
 *
 * Đặc tả gốc mang hình dạng desktop (panel 400px). Trên màn 390px, tầng 2 chuyển
 * thành **tấm trượt từ đáy** — đây là điều chỉnh có chủ ý, ghi ở docs/ASSISTANT-UX.md §7.
 * Bộ test này khoá hành vi đó lại.
 */

const DOCK = '#assistant-dock'
const ASK_INPUT = '#ask-bar-input'

async function askFromBar(page: Page, text: string): Promise<void> {
  await page.fill(ASK_INPUT, text)
  await page.press(ASK_INPUT, 'Enter')
  await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')
}

test.describe('tấm trượt từ đáy', () => {
  test('panel neo ở đáy và cao gần hết màn hình', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    // Tấm trượt lên trong 220ms, nên phải chờ vị trí ổn định rồi mới đo.
    await expect
      .poll(
        async () => {
          const box = await page.locator(DOCK).boundingBox()
          if (box === null) return Number.POSITIVE_INFINITY
          return Math.abs(box.y + box.height - page.viewportSize()!.height)
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(2)

    const box = (await page.locator(DOCK).boundingBox())!
    const viewport = page.viewportSize()!
    // Cao khoảng 92% chiều cao khung nhìn, không phải toàn bộ.
    expect(box.height / viewport.height).toBeGreaterThan(0.88)
    expect(box.height / viewport.height).toBeLessThan(0.96)
  })

  test('có bo góc trên, không bo góc dưới', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    const radius = await page
      .locator(DOCK)
      .evaluate((element) => getComputedStyle(element).borderRadius)
    // Bo 36px ở hai góc trên; hai góc dưới bằng 0.
    expect(radius).toContain('36px')
    expect(radius).toContain('0px')
  })

  test('khi thu gọn thì trượt hẳn xuống và ẩn khỏi trình đọc màn hình', async ({ page }) => {
    await page.goto('/hom-nay')
    const dock = page.locator(DOCK)

    await expect(dock).toHaveAttribute('data-mode', 'bar')
    await expect(dock).toHaveAttribute('aria-hidden', 'true')

    const hidden = await dock.evaluate((element) => {
      const style = getComputedStyle(element)
      return { visibility: style.visibility, transform: style.transform }
    })
    expect(hidden.visibility).toBe('hidden')
    // Trượt xuống 100% chiều cao của chính nó.
    expect(hidden.transform).not.toBe('none')
  })
})

test.describe('thanh hỏi trên màn hình nhỏ', () => {
  test('rộng bằng khung nhìn trừ lề, không bị giới hạn 680px', async ({ page }) => {
    await page.goto('/hom-nay')
    const box = (await page.getByTestId('ask-bar').boundingBox())!
    const viewport = page.viewportSize()!

    expect(box.width).toBeLessThanOrEqual(viewport.width)
    // Lề 16px mỗi bên từ lớp `px-4`.
    expect(box.width).toBeGreaterThan(viewport.width - 40)
  })

  test('gửi được tin nhắn và nhận thẻ xác nhận bữa ăn', async ({ page }) => {
    await page.goto('/ghi-nhan')
    await askFromBar(page, 'trưa nay mình ăn cơm tấm sườn')

    const list = page.getByTestId('message-list')
    await expect(list).toContainText('Cơm tấm sườn')
    await expect(list).toContainText('kcal')
  })
})

test.describe('thu tầng trên mobile', () => {
  test('nút X thu về thanh hỏi và trả lại màn hình', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    await page.click('[aria-label="Đóng trợ lý"]')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'bar')

    // `visibility` được trì hoãn tới khi tấm trượt xuống xong (220ms), nên phải chờ.
    await expect
      .poll(
        async () => page.locator(DOCK).evaluate((element) => getComputedStyle(element).visibility),
        { timeout: 5000 },
      )
      .toBe('hidden')
  })

  test('nút toàn màn hình cho panel cao hết khung nhìn', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    await page.click('[aria-label="Mở toàn màn hình"]')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'fullscreen')

    const box = (await page.locator(DOCK).boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.height).toBeCloseTo(viewport.height, -1)
  })
})
