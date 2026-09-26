import { expect, test } from '@playwright/test'

/**
 * Console PT.
 *
 * Đây là **sản phẩm được bán**: PT trả tiền theo số khách hàng, nên hai thứ phải luôn
 * hiện đúng — hạn mức chỗ ngồi và hạn mức lượt trợ lý. Bộ test này khoá cả hai lại.
 */

const DOCK = '#assistant-dock'

/*
 * Ngày 26/09, trang tổng quan PT được trả về đúng bản thiết kế của Vy (0091908) theo quyết định
 * của nhóm. Bản đó chưa hiện bốn thứ dưới đây, nên bốn test tương ứng được đánh `fixme` thay vì
 * xoá: chúng vẫn là yêu cầu của sản phẩm (xem CLAUDE.md "Hai chế độ dữ liệu phải nói ra" và
 * docs/PRICING.md), và khi thiết kế thêm các khối đó thì chỉ cần bỏ `fixme` là test chạy lại.
 */
const OVERVIEW_PENDING_DESIGN =
  'Bản thiết kế tổng quan PT hiện tại chưa có khối này — xem ghi chú đầu tệp.'

test.describe('tổng quan', () => {
  test('nói thẳng đang hiện dữ liệu mẫu khi tài khoản không phải PT', async ({ page }) => {
    test.fixme(true, OVERVIEW_PENDING_DESIGN)
    /*
     * Bộ kiểm thử chạy ở chế độ dữ liệu mẫu. Điều phải khoá lại là giao diện KHÔNG giả vờ
     * rằng năm khách hàng dưới đây là của người đang xem.
     */
    await page.goto('/pt')

    await expect(page.getByText(/Đang hiện dữ liệu mẫu/)).toBeVisible()
  })

  test('hiện gói hiện tại, số chỗ đã dùng và số còn nhận', async ({ page }) => {
    test.fixme(true, OVERVIEW_PENDING_DESIGN)
    await page.goto('/pt')

    await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible()
    await expect(page.getByText('Gói Plus · 750.000đ/tháng')).toBeVisible()
    await expect(page.getByText('Còn nhận được')).toBeVisible()
    await expect(page.getByText('600 lượt trợ lý mỗi tháng', { exact: false })).toBeVisible()
  })

  test('nêu tên những khách cần chú ý kèm lý do', async ({ page }) => {
    test.fixme(true, OVERVIEW_PENDING_DESIGN)
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
    await expect(page.getByText('86% tuân thủ', { exact: false })).toBeVisible()
    await expect(page.getByText('Cần chú ý').first()).toBeVisible()
    await expect(page.getByText('Tạm dừng').first()).toBeVisible()
  })

  test('báo số thực đơn đang chờ duyệt và đi tới được hàng đợi', async ({ page }) => {
    test.fixme(true, OVERVIEW_PENDING_DESIGN)
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
    // `exact`: ô tổng hợp đầu trang có dòng phụ "lệch mục tiêu" viết thường, không tính.
    await expect(page.getByText('Lệch mục tiêu', { exact: true })).toHaveCount(2)
    await expect(page.getByText('Trung bình', { exact: true }).first()).toBeVisible()
  })

  /*
   * Hai nút này nay gọi Server Action thật. Bộ kiểm thử chạy ở chế độ dữ liệu mẫu nên không
   * có phiên đăng nhập, và điều phải khoá lại là: nút **không giả vờ đã lưu** — nó nói thẳng
   * là chưa duyệt được. Hành vi thật (duyệt xong thì `plans.status` thành `active`) được
   * kiểm ở `npm run check:live`, nơi có Supabase thật.
   */
  test('nút duyệt không giả vờ thành công khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/pt/duyet')

    await page.getByRole('button', { name: 'Duyệt thực đơn' }).first().click()
    await expect(page.getByRole('status')).toContainText('Cần đăng nhập')
  })

  test('yêu cầu chỉnh lại bắt buộc phải nói chỉnh chỗ nào', async ({ page }) => {
    await page.goto('/pt/duyet')

    await page.getByRole('button', { name: 'Yêu cầu chỉnh lại' }).first().click()

    // Ô nhận xét hiện ra, và nút gửi chưa bấm được cho tới khi có nội dung: một yêu cầu chỉnh
    // lại không nói chỉnh chỗ nào thì không giúp được ai.
    const send = page.getByRole('button', { name: 'Gửi yêu cầu chỉnh lại' })
    await expect(send).toBeDisabled()

    await page.getByLabel('Nhận xét cho khách').fill('Bữa sáng nhiều tinh bột quá')
    await expect(send).toBeEnabled()
  })

  test('giải thích vì sao có bước duyệt', async ({ page }) => {
    await page.goto('/pt/duyet')
    await expect(page.getByText('Vì sao có bước duyệt')).toBeVisible()
    await expect(page.getByText(/PT là người kiểm tra và quyết định cuối cùng/)).toBeVisible()
  })
})

test.describe('gói dịch vụ', () => {
  test('hiện đủ ba gói kèm giá mỗi khách', async ({ page }) => {
    await page.goto('/pt/goi')

    for (const label of ['Plus', 'Premium', 'Diamond']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    }

    // Mỗi giá xuất hiện hai lần: ở dải tóm tắt đầu trang và ở thẻ chi tiết của gói.
    await expect(page.getByText('750.000đ', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('1.125.000đ', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('1.800.000đ', { exact: true }).first()).toBeVisible()
    // Chi phí trung bình mỗi khách: 750.000 / 5 khách = 150.000đ, 1.800.000 / 20 = 90.000đ.
    await expect(page.getByText('150.000đ', { exact: true })).toBeVisible()
    await expect(page.getByText('90.000đ', { exact: true })).toBeVisible()
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

  test('hiện nhắc nhở đang bật, đọc từ dữ liệu chứ không viết cứng trong trang', async ({
    page,
  }) => {
    await page.goto('/pt/khach/minh')

    await expect(page.getByRole('heading', { name: 'Nhắc nhở đang bật' })).toBeVisible()
    // Ba luật của dữ liệu mẫu, kèm ngày trong tuần viết gọn.
    await expect(page.getByText('Nhắc ghi bữa ăn', { exact: true })).toBeVisible()
    await expect(page.getByText('12:30 · mỗi ngày')).toBeVisible()
    await expect(page.getByText('Nhắc buổi tập', { exact: true })).toBeVisible()
    await expect(page.getByText('18:00 · T2, T4, T6')).toBeVisible()
    // Khung giờ yên lặng lấy từ hằng số của @nutriboost/ai, không chép lại trong trang.
    await expect(page.getByText('21:30–06:30', { exact: false })).toBeVisible()
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
