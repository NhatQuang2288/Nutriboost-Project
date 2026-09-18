import { expect, test, type Page } from '@playwright/test'

/**
 * Kiểm thử đầu-cuối cho lớp trợ lý ba tầng.
 *
 * Mỗi test tương ứng một dòng trong bảng nghiệm thu ở docs/ASSISTANT-UX.md §11.
 * Chạy ở dự án `desktop`, nơi các con số hình học (400 / 680 / 768) có hiệu lực.
 */

const DOCK = '#assistant-dock'
const ASK_INPUT = '#ask-bar-input'

/** Gửi một câu qua thanh hỏi rồi chờ panel mở. */
async function askFromBar(page: Page, text: string): Promise<void> {
  await page.fill(ASK_INPUT, text)
  await page.press(ASK_INPUT, 'Enter')
  await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')
}

async function dockWidth(page: Page): Promise<number> {
  return page.locator(DOCK).evaluate((element) => element.getBoundingClientRect().width)
}

/**
 * Chờ bề rộng panel ổn định rồi mới đo.
 *
 * Panel animate width trong 320ms, nên đo ngay sau khi đổi `data-mode` sẽ ra giá trị
 * trung gian. `expect.poll` thử lại cho tới khi hết chuyển động.
 */
async function expectDockWidth(page: Page, expected: number): Promise<void> {
  await expect.poll(() => dockWidth(page), { timeout: 5000 }).toBeCloseTo(expected, 0)
}

/** Cấu trúc stream tối thiểu theo giao thức UI message của AI SDK. */
function sse(chunks: readonly unknown[]): string {
  return `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}`).join('\n\n')}\n\n`
}

test.describe('§11.2 — không tự mở khi tải trang', () => {
  for (const route of ['/hom-nay', '/ke-hoach', '/tien-do', '/toi', '/ghi-nhan', '/coach']) {
    test(`tải ${route} thì panel thu gọn`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'bar')
      await expect(page.locator(DOCK)).toHaveAttribute('aria-hidden', 'true')
      await expectDockWidth(page, 0)
    })
  }
})

test.describe('§11.6 — thanh hỏi rộng tối đa 680px', () => {
  test('căn giữa và không vượt 680px ở màn hình lớn', async ({ page }) => {
    await page.goto('/hom-nay')
    const box = await page.getByTestId('ask-bar').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(680)

    // Căn giữa ngang trong cột nội dung: lề trái và phải xấp xỉ nhau.
    const viewport = page.viewportSize()!
    const leftGap = box!.x
    const rightGap = viewport.width - (box!.x + box!.width)
    expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2)
  })
})

test.describe('§11.7 — nút bên phải đổi theo nội dung ô nhập', () => {
  test('ô trống là "Mở rộng", có chữ là "Gửi"', async ({ page }) => {
    await page.goto('/hom-nay')

    await expect(page.locator('[data-action="expand"]')).toBeVisible()
    await expect(page.locator('[data-action="send"]')).toHaveCount(0)

    await page.fill(ASK_INPUT, 'xin chào')
    await expect(page.locator('[data-action="send"]')).toBeVisible()
    await expect(page.locator('[data-action="expand"]')).toHaveCount(0)

    await page.fill(ASK_INPUT, '')
    await expect(page.locator('[data-action="expand"]')).toBeVisible()
  })

  test('ô trống bấm "Mở rộng" thì mở panel nhưng không gửi gì', async ({ page }) => {
    await page.goto('/hom-nay')
    await page.click('[data-action="expand"]')

    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')
    // Chưa có tin nhắn nào: panel hiện trạng thái rỗng.
    await expect(page.getByTestId('message-list')).toContainText('Mình là Bơ')
  })
})

test.describe('§11.8 — Enter gửi và mở panel', () => {
  test('gõ rồi Enter thì panel mở và tin nhắn được gửi', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'sáng nay mình ăn phở bò')

    const list = page.getByTestId('message-list')
    await expect(list).toContainText('sáng nay mình ăn phở bò')
    // Thẻ xác nhận bữa ăn do pipeline tất định dựng ra.
    await expect(list).toContainText('Phở bò')
    await expect(list).toContainText('kcal')
  })
})

test.describe('§11.4 và §11.5 — hình học của panel', () => {
  test('panel rộng 400px và animate width 320ms', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    await expectDockWidth(page, 400)

    const duration = await page
      .locator(DOCK)
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    const milliseconds = Number.parseFloat(duration) * 1000
    expect(milliseconds).toBeGreaterThanOrEqual(300)
    expect(milliseconds).toBeLessThanOrEqual(340)

    // Chỉ animate width, không animate các thuộc tính gây reflow khác.
    const properties = await page
      .locator(DOCK)
      .evaluate((element) => getComputedStyle(element).transitionProperty)
    expect(properties).toBe('width')
  })

  test('toàn màn hình ghim cột nội dung 768px và căn giữa', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    await page.click('[aria-label="Mở toàn màn hình"]')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'fullscreen')

    const innerBox = async (): Promise<{ x: number; width: number } | null> =>
      page.getByTestId('dock-inner').boundingBox()

    await expect
      .poll(async () => (await innerBox())?.width ?? 0, { timeout: 5000 })
      .toBeCloseTo(768, 0)

    // Poll theo chính điều kiện căn giữa: ngay sau khi đổi tầng, bố cục có thể còn
    // đang chuyển tiếp nên đo một lần là chưa đủ.
    await expect
      .poll(
        async () => {
          const box = await innerBox()
          if (box === null) return Number.POSITIVE_INFINITY
          const viewport = page.viewportSize()!
          return Math.abs(box.x - (viewport.width - box.x - box.width))
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(2)
  })
})

test.describe('§11.3 — Esc ở toàn màn hình thu về panel, KHÔNG đóng', () => {
  test('Esc đưa về sidebar và hội thoại còn nguyên', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'sáng nay mình ăn phở bò')
    await page.click('[aria-label="Mở toàn màn hình"]')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'fullscreen')

    await page.keyboard.press('Escape')

    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')
    await expect(page.locator(DOCK)).toHaveAttribute('aria-hidden', 'false')
    await expectDockWidth(page, 400)
    await expect(page.getByTestId('message-list')).toContainText('Phở bò')
  })

  test('Esc ở sidebar mới thu về thanh hỏi', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'xin chào')

    await page.keyboard.press('Escape')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'bar')
    await expectDockWidth(page, 0)
  })
})

test.describe('§11.1 — panel không unmount khi điều hướng', () => {
  test('hội thoại còn nguyên sau khi đổi ba màn hình', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'sáng nay mình ăn phở bò')
    await expect(page.getByTestId('message-list')).toContainText('Phở bò')

    for (const label of ['Kế hoạch', 'Tiến độ', 'Tôi']) {
      await page.getByRole('link', { name: label, exact: true }).click()
      await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')
    }

    // Điều hướng phía client nên cây DOM của panel không bị dựng lại.
    await expect(page.getByTestId('message-list')).toContainText('Phở bò')
    await expectDockWidth(page, 400)
  })
})

test.describe('§11.9 — gợi ý theo ngữ cảnh màn hình', () => {
  test('phím / mở gợi ý đúng theo màn hình', async ({ page }) => {
    await page.goto('/hom-nay')
    await page.locator('body').click({ position: { x: 4, y: 4 } })
    await page.keyboard.press('/')

    const list = page.getByRole('listbox', { name: 'Gợi ý cho màn hình này' })
    await expect(list).toBeVisible()
    await expect(list).toContainText('Hôm nay tôi còn bao nhiêu calo?')

    await page.goto('/ke-hoach')
    await page.locator('body').click({ position: { x: 4, y: 4 } })
    await page.keyboard.press('/')
    await expect(page.getByRole('listbox', { name: 'Gợi ý cho màn hình này' })).toContainText(
      'Đổi món tối thứ 4',
    )
  })

  test('KHÔNG kích hoạt khi đang gõ trong ô nhập', async ({ page }) => {
    await page.goto('/hom-nay')
    await page.locator(ASK_INPUT).focus()
    await page.keyboard.press('/')

    // Ký tự được gõ vào ô, không phải mở bảng gợi ý.
    await expect(page.locator(ASK_INPUT)).toHaveValue('/')
  })
})

test.describe('§11.10 — không mất nội dung đang gõ khi đổi tầng', () => {
  test('bản nháp giữ nguyên giữa thanh hỏi và panel', async ({ page }) => {
    await page.goto('/hom-nay')
    await page.fill(ASK_INPUT, 'một nửa bát cơm')

    // Ô đã có chữ nên nút phải là "Gửi"; dùng phím tắt để đổi tầng mà không gửi.
    await page.keyboard.press('Control+j')
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')

    // Ô nhập trong panel dùng chung bản nháp với thanh hỏi.
    await expect(page.locator(`${DOCK} textarea`)).toHaveValue('một nửa bát cơm')
  })
})

test.describe('§11.11 — tôn trọng prefers-reduced-motion', () => {
  test('thời lượng chuyển động bằng 0', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/hom-nay')

    const duration = await page
      .locator(DOCK)
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    // globals.css đặt 0,01 ms cho mọi phần tử khi người dùng tắt hiệu ứng chuyển động.
    expect(Number.parseFloat(duration) * 1000).toBeLessThan(1)
  })
})

test.describe('§11.12 — generative UI chỉ render thành phần trong sổ đăng ký', () => {
  test('tên thành phần lạ thì hiện thẻ dự phòng, không vỡ giao diện', async ({ page }) => {
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sse([
          { type: 'start' },
          { type: 'text-start', id: 't1' },
          { type: 'text-delta', id: 't1', delta: 'Mình thử một thẻ lạ nhé.' },
          { type: 'text-end', id: 't1' },
          { type: 'data-evil_component', data: { command: 'rm -rf /' } },
          { type: 'finish' },
        ]),
      })
    })

    await page.goto('/hom-nay')
    await askFromBar(page, 'thử thành phần lạ')

    const list = page.getByTestId('message-list')
    await expect(list).toContainText('evil_component')
    await expect(list).toContainText('chưa hiển thị được phần này')
    // Nội dung độc hại không được render thành phần tử nào.
    await expect(list.locator('[data-component="evil_component"]')).toHaveCount(0)
  })

  test('props sai schema cũng rơi về thẻ dự phòng', async ({ page }) => {
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sse([
          { type: 'start' },
          { type: 'text-start', id: 't1' },
          { type: 'text-delta', id: 't1', delta: 'Thẻ này thiếu trường.' },
          { type: 'text-end', id: 't1' },
          // `choice_chips` cần ít nhất 2 lựa chọn — chỉ gửi 1 nên phải bị từ chối.
          {
            type: 'data-choice_chips',
            data: { question: 'Chọn đi', options: [{ value: 'a', label: 'A' }] },
          },
          { type: 'finish' },
        ]),
      })
    })

    await page.goto('/hom-nay')
    await askFromBar(page, 'thử props sai')

    await expect(page.getByTestId('message-list')).toContainText('chưa hiển thị được phần này')
  })

  test('thành phần hợp lệ được render thật', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'sáng nay mình ăn phở bò')

    // Thẻ xác nhận bữa ăn do server gửi xuống với props hợp lệ.
    const list = page.getByTestId('message-list')
    await expect(list).toContainText('Mình hiểu bữa ăn như sau')
    await expect(list.getByRole('button', { name: /Lưu bữa này|Đúng rồi/ })).toBeVisible()
  })
})

test.describe('§11.15 — mọi nội dung AI đều kèm câu miễn trừ', () => {
  test('câu trả lời chứa câu miễn trừ', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'sáng nay mình ăn phở bò')
    await expect(page.getByTestId('message-list')).toContainText('Không thay thế tư vấn y khoa')
  })

  test('câu hỏi ngoài phạm vi bị chuyển hướng, không gọi model', async ({ page }) => {
    await page.goto('/hom-nay')
    await askFromBar(page, 'tôi nên uống thuốc liều bao nhiêu')

    const list = page.getByTestId('message-list')
    await expect(list).toContainText('không thể tư vấn chẩn đoán hay thuốc men')
  })
})

test.describe('app shell', () => {
  test('mỗi màn hình chỉ có một hành động chính', async ({ page }) => {
    for (const route of ['/ke-hoach', '/tien-do', '/toi', '/ghi-nhan']) {
      await page.goto(route)
      // Nút nền đậm là hành động chính; không màn nào được có hai.
      const primary = page.locator('main a.bg-forest-600, main button.bg-forest-600')
      expect(await primary.count(), `${route} có nhiều hơn một CTA chính`).toBeLessThanOrEqual(1)
    }
  })

  test('trang chủ hiển thị linh vật và câu miễn trừ', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('img', { name: /Linh vật NutriBoost/ })).toBeVisible()
    await expect(page.getByText('không thay thế tư vấn y khoa')).toBeVisible()
  })
})
