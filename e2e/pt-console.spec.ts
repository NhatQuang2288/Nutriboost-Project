import { expect, test } from '@playwright/test'

/**
 * Console PT.
 *
 * Đây là **sản phẩm được bán**: PT trả tiền theo số khách hàng, nên hai thứ phải luôn
 * hiện đúng — hạn mức chỗ ngồi và hạn mức lượt trợ lý. Bộ test này khoá cả hai lại.
 */

const DOCK = '#assistant-dock'

test.describe('tổng quan', () => {
  test('hiện gói hiện tại, số chỗ đã dùng và số còn nhận', async ({ page }) => {
    await page.goto('/pt')

    await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible()
    await expect(page.getByText('Gói Plus · 750.000đ/tháng')).toBeVisible()
    await expect(page.getByText('Còn nhận được')).toBeVisible()
    await expect(page.getByText('600 lượt trợ lý mỗi tháng', { exact: false })).toBeVisible()
  })

  test('nêu tên những khách cần chú ý kèm lý do', async ({ page }) => {
    await page.goto('/pt')

    await expect(page.getByRole('heading', { name: 'Cần chú ý hôm nay' })).toBeVisible()

    // Lý do là duy nhất trên trang, nên neo vào đó; tên khách xuất hiện ở cả mục
    // "Cần chú ý" lẫn danh sách khách hàng bên dưới.
    await expect(page.getByText('Chỉ ghi 2/7 ngày và đang tăng cân nhẹ')).toBeVisible()
    await expect(page.getByText('Chưa hoàn tất thiết lập hồ sơ')).toBeVisible()
    await expect(page.getByText('Trần Hương').first()).toBeVisible()
  })

  test('liệt kê khách hàng kèm tuân thủ và trạng thái', async ({ page }) => {
    await page.goto('/pt')

    await expect(page.getByText('Nguyễn Minh')).toBeVisible()
    await expect(page.getByText('tuân thủ 86%', { exact: false })).toBeVisible()
    await expect(page.getByText('Cần chú ý').first()).toBeVisible()
    await expect(page.getByText('Tạm dừng').first()).toBeVisible()
  })

  test('báo số thực đơn đang chờ duyệt và đi tới được hàng đợi', async ({ page }) => {
    await page.goto('/pt')

    const banner = page.getByText(/thực đơn đang chờ bạn duyệt/)
    await expect(banner).toBeVisible()

    await page.getByRole('link', { name: /Xem và duyệt/ }).click()
    await expect(page).toHaveURL(/\/pt\/duyet$/)
  })

  test('mở được hồ sơ một khách hàng', async ({ page }) => {
    await page.goto('/pt')
    await page.getByRole('link', { name: /Nguyễn Minh/ }).click()

    await expect(page).toHaveURL(/\/pt\/khach\/minh$/)
    await expect(page.getByRole('heading', { name: 'Nguyễn Minh' })).toBeVisible()
  })
})

test.describe('hàng đợi duyệt thực đơn', () => {
  test('hiện thực đơn chờ duyệt kèm độ lệch so với mục tiêu', async ({ page }) => {
    await page.goto('/pt/duyet')

    await expect(page.getByRole('heading', { name: 'Duyệt thực đơn' })).toBeVisible()
    await expect(page.getByText('Lệch mục tiêu')).toHaveCount(2)
    await expect(page.getByText(/Trung bình mỗi ngày/).first()).toBeVisible()
  })

  test('nút duyệt nói thẳng là chưa lưu được, không giả vờ thành công', async ({ page }) => {
    await page.goto('/pt/duyet')

    await page.getByRole('button', { name: 'Duyệt thực đơn' }).first().click()
    await expect(page.getByRole('status')).toContainText('Chưa nối cơ sở dữ liệu')
  })

  test('nút yêu cầu chỉnh lại cũng báo rõ trạng thái', async ({ page }) => {
    await page.goto('/pt/duyet')

    await page.getByRole('button', { name: 'Yêu cầu chỉnh lại' }).first().click()
    await expect(page.getByRole('status')).toContainText('Chưa nối cơ sở dữ liệu')
  })

  test('giải thích vì sao có bước duyệt', async ({ page }) => {
    await page.goto('/pt/duyet')
    await expect(page.getByText('Vì sao có bước duyệt')).toBeVisible()
    await expect(page.getByText(/bạn là người chịu trách nhiệm cuối cùng/)).toBeVisible()
  })
})

test.describe('gói dịch vụ', () => {
  test('hiện đủ ba gói kèm giá mỗi khách', async ({ page }) => {
    await page.goto('/pt/goi')

    for (const label of ['Plus', 'Premium', 'Diamond']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    }

    await expect(page.getByText('750.000đ')).toBeVisible()
    await expect(page.getByText('1.125.000đ')).toBeVisible()
    await expect(page.getByText('1.800.000đ')).toBeVisible()
    // 750.000 / 5 khách = 150.000đ mỗi khách
    await expect(page.getByText('150.000đ mỗi khách mỗi tháng')).toBeVisible()
    await expect(page.getByText('90.000đ mỗi khách mỗi tháng')).toBeVisible()
  })

  test('ghi rõ hạn mức lượt trợ lý — con số bảng giá gốc còn thiếu', async ({ page }) => {
    await page.goto('/pt/goi')
    // 600 lượt xuất hiện ở cả ba gói.
    await expect(page.getByText('600 lượt trợ lý AI mỗi khách mỗi tháng')).toHaveCount(3)
  })

  test('giải thích vì sao cần hạn mức', async ({ page }) => {
    await page.goto('/pt/goi')
    await expect(page.getByText('Vì sao có hạn mức lượt trợ lý')).toBeVisible()
    await expect(page.getByText(/20 % doanh thu/)).toBeVisible()
  })

  test('đánh dấu gói hiện tại', async ({ page }) => {
    await page.goto('/pt/goi')
    await expect(page.getByText('GÓI HIỆN TẠI')).toHaveCount(1)
  })
})

test.describe('hồ sơ khách hàng', () => {
  test('hiện thực đơn và lịch tập của khách', async ({ page }) => {
    await page.goto('/pt/khach/minh')

    await expect(page.getByRole('heading', { name: 'Thực đơn tuần này' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lịch tập tuần này' })).toBeVisible()
    await expect(page.getByText('Tuân thủ 7 ngày')).toBeVisible()
    await expect(page.getByText('86%')).toBeVisible()
  })

  test('hiện nhắc nhở đang bật kèm giới hạn tần suất', async ({ page }) => {
    await page.goto('/pt/khach/minh')
    await expect(page.getByRole('heading', { name: 'Nhắc nhở đang bật' })).toBeVisible()
    await expect(page.getByText('Tối đa 4 lần nhắc mỗi ngày', { exact: false })).toBeVisible()
  })

  test('khách không tồn tại trả 404', async ({ page }) => {
    const response = await page.goto('/pt/khach/khong-ton-tai')
    expect(response?.status()).toBe(404)
  })
})

test.describe('khung console PT', () => {
  test('dùng tab ngang, không dùng thanh điều hướng của khách hàng', async ({ page }) => {
    await page.goto('/pt')

    await expect(page.getByRole('navigation', { name: 'Điều hướng console PT' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0)
  })

  test('vẫn có lớp trợ lý và panel thu gọn khi tải trang', async ({ page }) => {
    await page.goto('/pt')

    await expect(page.locator(DOCK)).toHaveAttribute('data-mode', 'bar')
    const width = await page
      .locator(DOCK)
      .evaluate((element) => element.getBoundingClientRect().width)
    expect(width).toBe(0)
  })

  test('chuyển tab được giữa các mục', async ({ page }) => {
    await page.goto('/pt')

    await page.getByRole('link', { name: 'Gói dịch vụ' }).click()
    await expect(page).toHaveURL(/\/pt\/goi$/)

    await page.getByRole('link', { name: 'Duyệt thực đơn' }).click()
    await expect(page).toHaveURL(/\/pt\/duyet$/)

    await page.getByRole('link', { name: 'Tổng quan' }).click()
    await expect(page).toHaveURL(/\/pt$/)
  })
})
