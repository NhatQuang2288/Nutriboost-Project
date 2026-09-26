import { expect, test } from '@playwright/test'

/**
 * Khung ứng dụng của khách ở màn hình lớn — cùng bố cục với console PT: sidebar trái, cột nội
 * dung, panel trợ lý bên phải. Chạy ở dự án `desktop` (1280px); màn hình nhỏ nằm ở mobile.spec.ts.
 */

const DOCK = '#assistant-dock'

test.describe('sidebar của khách', () => {
  test('hiện sidebar và ẩn thanh điều hướng dưới', async ({ page }) => {
    await page.goto('/hom-nay')

    await expect(page.getByRole('navigation', { name: 'Điều hướng ứng dụng' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeHidden()
  })

  test('đánh dấu màn đang mở và chuyển được sang màn khác', async ({ page }) => {
    await page.goto('/hom-nay')
    const nav = page.getByRole('navigation', { name: 'Điều hướng ứng dụng' })

    await expect(nav.getByRole('link', { name: /^Hôm nay/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await nav.getByRole('link', { name: /^Tiến độ/ }).click()
    await expect(page).toHaveURL(/\/tien-do$/)
    await expect(nav.getByRole('link', { name: /^Tiến độ/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('nút Bơ AI trong sidebar mở và đóng panel trợ lý', async ({ page }) => {
    await page.goto('/hom-nay')
    const button = page.getByRole('button', { name: /^Bơ AI/ })

    await button.click()
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'sidebar')

    await button.click()
    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'bar')
  })
})

test.describe('màn Hôm nay', () => {
  test('chia hai cột ở màn hình lớn, số liệu vẫn đầy đủ', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/hom-nay')

    const energy = page.getByRole('heading', { name: 'Năng lượng' })
    const meals = page.getByRole('heading', { name: 'Bữa ăn hôm nay' })
    await expect(energy).toBeVisible()
    await expect(meals).toBeVisible()

    // Hai thẻ nằm ở hai cột: cùng hàng trên, lệch nhau theo chiều ngang.
    const energyBox = (await energy.boundingBox())!
    const mealsBox = (await meals.boundingBox())!
    expect(mealsBox.x).toBeGreaterThan(energyBox.x + 200)

    for (const label of ['Mục tiêu', 'Đã nạp', 'Đã đốt', 'Đạm', 'Tinh bột', 'Chất béo']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })
})
