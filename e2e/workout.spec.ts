import { expect, test } from '@playwright/test'

/**
 * Màn lịch tập.
 *
 * Kcal đốt phải tính ra được — đó là khác biệt giữa một lịch tập "trông có vẻ hợp lý" và
 * một lịch tập cộng được vào ngân sách năng lượng trong ngày.
 */

test.describe('lịch tập', () => {
  test('dựng 3 buổi, mỗi buổi có khởi động và giãn cơ', async ({ page }) => {
    await page.goto('/lich-tap')

    await expect(page.getByRole('heading', { name: 'Lịch tập tuần' })).toBeVisible()
    const sessions = page.getByRole('article')
    await expect(sessions).toHaveCount(3)

    // Mỗi buổi luôn bắt đầu bằng khởi động và kết thúc bằng giãn cơ.
    await expect(sessions.first()).toContainText('Xoay vai khởi động')
    await expect(sessions.first()).toContainText('Giãn')
  })

  test('mỗi buổi có số phút và kcal đốt, không phải số 0', async ({ page }) => {
    await page.goto('/lich-tap')

    const firstSession = page.getByRole('article').first()
    const kcalText = await firstSession
      .getByText(/\d+ kcal/)
      .first()
      .textContent()
    const kcal = Number(kcalText?.replace(/\D/g, '') ?? '0')
    expect(kcal).toBeGreaterThan(0)

    const minutesText = await firstSession
      .getByText(/\d+ phút/)
      .first()
      .textContent()
    const minutes = Number(minutesText?.replace(/\D/g, '') ?? '0')
    expect(minutes).toBeGreaterThan(10)
  })

  test('nêu rõ mỗi bài bao nhiêu hiệp và nghỉ bao lâu', async ({ page }) => {
    await page.goto('/lich-tap')
    const firstSession = page.getByRole('article').first()
    await expect(firstSession.getByText(/\d+ × (\d+–\d+|\d+s)/).first()).toBeVisible()
    await expect(firstSession.getByText(/nghỉ \d+s/).first()).toBeVisible()
  })

  test('giải thích công thức tính kcal đốt', async ({ page }) => {
    await page.goto('/lich-tap')
    await expect(page.getByText(/MET × 3,5 × cân nặng/)).toBeVisible()
  })

  test('nói rõ chấn thương đã khai sẽ loại bài không phù hợp', async ({ page }) => {
    await page.goto('/lich-tap')
    await expect(page.getByText(/chấn thương bạn khai sẽ bị loại tự động/)).toBeVisible()
  })

  test('đi được từ màn Hôm nay sang lịch tập', async ({ page }) => {
    await page.goto('/hom-nay')
    await page.getByRole('link', { name: /Lịch tập tuần này/ }).click()
    await expect(page).toHaveURL(/\/lich-tap$/)
  })

  test('đi ngược lại được từ lịch tập về kế hoạch ăn uống', async ({ page }) => {
    await page.goto('/lich-tap')
    await page.getByRole('link', { name: 'Xem kế hoạch ăn uống' }).click()
    await expect(page).toHaveURL(/\/ke-hoach$/)
  })
})
