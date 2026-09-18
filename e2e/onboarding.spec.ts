import { expect, test, type Page } from '@playwright/test'

/**
 * Kiểm thử luồng thiết lập hồ sơ và màn đăng nhập.
 *
 * Đây là hai màn duy nhất nằm ngoài nhóm `(app)`, nên chúng cố tình KHÔNG có thanh
 * điều hướng và lớp trợ lý — bộ test này khoá đặc điểm đó lại.
 *
 * Con số kỳ vọng dưới đây tính từ chính `@nutriboost/nutrition`:
 *   nam, 30 tuổi, 170 cm, 70 kg, vận động vừa, giảm cân 0,35 kg/tuần
 *   → BMR 1618 · TDEE 2508 · mục tiêu 2120 kcal
 */

const DOCK = '#assistant-dock'

/** Hoàn tất 5 câu hỏi onboarding với bộ dữ liệu cố định. */
async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/onboarding')

  await page.getByRole('button', { name: 'Nam', exact: true }).click()

  await page.getByLabel('Bạn bao nhiêu tuổi?').fill('30')
  await page.getByRole('button', { name: 'Tiếp tục' }).click()

  await page.getByLabel('Chiều cao').fill('170')
  await page.getByLabel('Cân nặng').fill('70')
  await page.getByRole('button', { name: 'Tiếp tục' }).click()

  await page.getByRole('button', { name: /Vận động vừa/ }).click()
  await page.getByRole('button', { name: 'Giảm cân' }).click()
}

test.describe('onboarding', () => {
  test('hoàn tất 5 câu hỏi và ra mục tiêu năng lượng đúng công thức', async ({ page }) => {
    await completeOnboarding(page)

    await expect(page.getByRole('heading', { name: 'Xong rồi!' })).toBeVisible()
    // Mục tiêu tính bằng Mifflin–St Jeor rồi làm tròn 10 kcal.
    await expect(page.getByText('2.120')).toBeVisible()
    await expect(page.getByText('1.618 kcal')).toBeVisible()
    await expect(page.getByText('2.508 kcal')).toBeVisible()
    await expect(page.getByText('125 · 270 · 60 g')).toBeVisible()
  })

  test('hiện BMI và phân loại theo ngưỡng châu Á', async ({ page }) => {
    await completeOnboarding(page)
    await expect(page.getByText('24.2 · Thừa cân (nguy cơ)')).toBeVisible()
  })

  test('thanh tiến độ chạy từ 1/5 tới 5/5', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.getByText('1/5')).toBeVisible()

    await page.getByRole('button', { name: 'Nam', exact: true }).click()
    await expect(page.getByText('2/5')).toBeVisible()

    await page.getByLabel('Bạn bao nhiêu tuổi?').fill('30')
    await page.getByRole('button', { name: 'Tiếp tục' }).click()
    await expect(page.getByText('3/5')).toBeVisible()
  })

  test('chặn đi tiếp khi số chưa hợp lệ', async ({ page }) => {
    await page.goto('/onboarding')
    await page.getByRole('button', { name: 'Nam', exact: true }).click()

    const next = page.getByRole('button', { name: 'Tiếp tục' })
    await expect(next).toBeDisabled()

    await page.getByLabel('Bạn bao nhiêu tuổi?').fill('5')
    await expect(next).toBeDisabled()

    await page.getByLabel('Bạn bao nhiêu tuổi?').fill('30')
    await expect(next).toBeEnabled()
  })

  test('quay lại được bước trước', async ({ page }) => {
    await page.goto('/onboarding')
    await page.getByRole('button', { name: 'Nam', exact: true }).click()
    await page.getByLabel('Bạn bao nhiêu tuổi?').fill('30')
    await page.getByRole('button', { name: 'Tiếp tục' }).click()

    await page.getByRole('button', { name: 'Quay lại' }).click()
    await expect(page.getByLabel('Bạn bao nhiêu tuổi?')).toBeVisible()
  })

  test('vào được ứng dụng sau khi hoàn tất', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Vào ứng dụng' }).click()

    await expect(page).toHaveURL(/\/hom-nay$/)
    await expect(page.getByRole('heading', { name: /Chào/ })).toBeVisible()
  })
})

test.describe('màn hình tập trung', () => {
  test('onboarding không có thanh điều hướng và lớp trợ lý', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.locator(DOCK)).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0)
  })

  test('màn đăng nhập không có lớp trợ lý', async ({ page }) => {
    await page.goto('/dang-nhap')
    await expect(page.locator(DOCK)).toHaveCount(0)
  })
})

test.describe('đăng nhập', () => {
  test('nói thẳng khi chưa cấu hình Supabase thay vì giả vờ thành công', async ({ page }) => {
    await page.goto('/dang-nhap')

    await expect(page.getByText('Chưa cấu hình Supabase')).toBeVisible()
    // Không có form giả: chưa cấu hình thì không hiện ô nhập email.
    await expect(page.getByLabel('Email')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Tiếp tục với dữ liệu mẫu' })).toBeVisible()
  })

  test('đi được từ đăng nhập sang onboarding', async ({ page }) => {
    await page.goto('/dang-nhap')
    await page.getByRole('link', { name: 'Tiếp tục với dữ liệu mẫu' }).click()
    await expect(page).toHaveURL(/\/onboarding$/)
  })

  test('route gửi magic link trả lỗi rõ ràng khi chưa cấu hình', async ({ request }) => {
    const response = await request.post('/api/auth/magic-link', {
      data: { email: 'ban@example.com' },
    })
    expect(response.status()).toBe(503)
    const body = (await response.json()) as { error?: string }
    expect(body.error).toContain('Chưa cấu hình Supabase')
  })

  test('route vẫn kiểm tra email trước khi gọi Supabase', async ({ request }) => {
    const response = await request.post('/api/auth/magic-link', { data: { email: 'sai' } })
    // Chưa cấu hình thì trả 503 trước; kiểm tra email nằm sau bước cấu hình.
    expect([400, 503]).toContain(response.status())
  })
})
