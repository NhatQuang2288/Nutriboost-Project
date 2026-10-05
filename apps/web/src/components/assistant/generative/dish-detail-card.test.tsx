// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DishCardProps } from '@/lib/ai/dish-card'

import { DishDetailCard } from './components'

const recompute = vi.hoisted(() => vi.fn())
vi.mock('@/lib/actions/dish-detail', () => ({ recomputeDishAction: recompute }))
vi.mock('@/lib/actions/meals', () => ({ saveMealAction: vi.fn() }))

const base: DishCardProps = {
  foodId: 'bun-thang',
  nameVi: 'Bún thang',
  servingName: 'phần',
  grams: 450,
  referenceGrams: 450,
  items: [
    { name: 'Bún tươi', grams: 180, kcal: 198, proteinG: 3.1, share: false, adjusted: false },
    { name: 'Giò lụa', grams: 30, kcal: 22, proteinG: 1.4, share: true, adjusted: false },
  ],
  total: { kcal: 395, proteinG: 21.6, carbG: 55.8, fatG: 9, fiberG: 0.9, sodiumMg: 1050 },
  estimated: true,
  customised: false,
}

const adjusted: DishCardProps = {
  ...base,
  grams: 520,
  items: [
    { ...base.items[0]!, grams: 250, kcal: 275, share: false, adjusted: true },
    base.items[1]!,
  ],
  total: { ...base.total, kcal: 472 },
  customised: true,
}

beforeEach(() => recompute.mockReset())
afterEach(cleanup)

describe('thẻ chi tiết món — sửa khối lượng', () => {
  it('MỌI nguyên liệu đều có ô nhập, kể cả nguyên liệu chưa có số riêng', () => {
    render(<DishDetailCard props={base} />)

    expect(screen.getByLabelText('Khối lượng Bún tươi (g)')).toHaveValue(180)
    expect(screen.getByLabelText('Khối lượng Giò lụa (g)')).toHaveValue(30)
  })

  it('nguyên liệu chưa có số riêng hiện dấu ≈ và nói kcal chỉ là ước tính theo tỉ lệ', () => {
    render(<DishDetailCard props={base} />)

    expect(screen.getByText('≈ 22 kcal')).toBeInTheDocument()
    expect(screen.getByText('198 kcal')).toBeInTheDocument()
    expect(screen.getAllByText(/kcal ước tính theo tỉ lệ/).length).toBeGreaterThan(0)
    expect(screen.getByText(/không phân biệt nước dùng với thịt/)).toBeInTheDocument()
  })

  it('nguyên liệu máy chủ không chia được kcal (kcal rỗng) thì không có ô nhập', () => {
    render(
      <DishDetailCard
        props={{
          ...base,
          items: [
            { name: 'Nước', grams: 50, kcal: null, proteinG: null, share: true, adjusted: false },
          ],
        }}
      />,
    )
    expect(screen.queryByLabelText('Khối lượng Nước (g)')).not.toBeInTheDocument()
    expect(screen.getByText(/chưa có số để chỉnh/)).toBeInTheDocument()
  })

  it('sửa gram nguyên liệu share gọi máy chủ với đúng tên nguyên liệu đó', async () => {
    recompute.mockResolvedValue({ ok: true, card: base })
    const user = userEvent.setup()
    render(<DishDetailCard props={base} />)

    const input = screen.getByLabelText('Khối lượng Giò lụa (g)')
    await user.clear(input)
    await user.type(input, '60{Enter}')

    await waitFor(() =>
      expect(recompute).toHaveBeenCalledWith({
        foodId: 'bun-thang',
        componentGrams: { 'Giò lụa': 60 },
      }),
    )
  })

  it('sửa gram bún thì gọi máy chủ với đúng nguyên liệu và vẽ lại theo kết quả', async () => {
    recompute.mockResolvedValue({ ok: true, card: adjusted })
    const user = userEvent.setup()
    render(<DishDetailCard props={base} />)

    const input = screen.getByLabelText('Khối lượng Bún tươi (g)')
    await user.clear(input)
    await user.type(input, '250{Enter}')

    await waitFor(() => expect(screen.getByText('472 kcal')).toBeInTheDocument())
    expect(recompute).toHaveBeenCalledWith({
      foodId: 'bun-thang',
      componentGrams: { 'Bún tươi': 250 },
    })
    expect(screen.getByText(/theo khối lượng bạn cung cấp/)).toBeInTheDocument()
    expect(screen.getByText(/bạn đã chỉnh/)).toBeInTheDocument()
    // Giao diện không tự tính: tổng cũ biến mất, thay bằng số máy chủ gửi về.
    expect(screen.queryByText('395 kcal')).not.toBeInTheDocument()
  })

  it('sửa khối lượng cả món gọi máy chủ với grams', async () => {
    recompute.mockResolvedValue({ ok: true, card: { ...base, grams: 300, customised: true } })
    const user = userEvent.setup()
    render(<DishDetailCard props={base} />)

    const whole = screen.getByLabelText('Khối lượng cả món (g)')
    await user.clear(whole)
    await user.type(whole, '300')
    await user.click(screen.getByRole('button', { name: 'Tính lại' }))

    await waitFor(() => expect(recompute).toHaveBeenCalledWith({ foodId: 'bun-thang', grams: 300 }))
    await waitFor(() => expect(screen.getByLabelText('Khối lượng cả món (g)')).toHaveValue(300))
  })

  it('máy chủ từ chối thì hiện lý do thật và giữ nguyên thẻ cũ, không nói dối', async () => {
    recompute.mockResolvedValue({
      ok: false,
      message: 'Chưa có số dinh dưỡng riêng cho "Giò lụa".',
    })
    const user = userEvent.setup()
    render(<DishDetailCard props={base} />)

    const input = screen.getByLabelText('Khối lượng Bún tươi (g)')
    await user.clear(input)
    await user.type(input, '999{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa có số dinh dưỡng riêng')
    expect(screen.getByText('395 kcal')).toBeInTheDocument()
  })

  it('khối lượng không hợp lệ bị chặn ngay, không gọi máy chủ', async () => {
    const user = userEvent.setup()
    render(<DishDetailCard props={base} />)

    const whole = screen.getByLabelText('Khối lượng cả món (g)')
    await user.clear(whole)
    await user.type(whole, '0')
    await user.click(screen.getByRole('button', { name: 'Tính lại' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('lớn hơn 0')
    expect(recompute).not.toHaveBeenCalled()
  })

  it('nút "Về khẩu phần mẫu" chỉ có khi đã chỉnh, và đưa số về mặc định', async () => {
    recompute.mockResolvedValue({ ok: true, card: base })
    const user = userEvent.setup()
    render(<DishDetailCard props={adjusted} />)

    await user.click(screen.getByRole('button', { name: 'Về khẩu phần mẫu' }))

    await waitFor(() => expect(screen.getByText('395 kcal')).toBeInTheDocument())
    expect(recompute).toHaveBeenCalledWith({ foodId: 'bun-thang' })
    expect(screen.queryByRole('button', { name: 'Về khẩu phần mẫu' })).not.toBeInTheDocument()
  })

  it('chưa chỉnh thì không có nút "Về khẩu phần mẫu"', () => {
    render(<DishDetailCard props={base} />)
    expect(screen.queryByRole('button', { name: 'Về khẩu phần mẫu' })).not.toBeInTheDocument()
  })

  it('sửa tiếp nhiều nguyên liệu thì gửi cả những chỗ đã sửa trước đó', async () => {
    const two: DishCardProps = {
      ...adjusted,
      items: [
        { ...base.items[0]!, grams: 250, kcal: 275, share: false, adjusted: true },
        { name: 'Dầu ăn', grams: 20, kcal: 180, proteinG: 0, share: false, adjusted: true },
      ],
    }
    const afterBun: DishCardProps = {
      ...adjusted,
      items: [
        { ...base.items[0]!, grams: 250, kcal: 275, share: false, adjusted: true },
        { name: 'Dầu ăn', grams: 5, kcal: 45, proteinG: 0, share: false, adjusted: false },
      ],
    }
    recompute
      .mockResolvedValueOnce({ ok: true, card: afterBun })
      .mockResolvedValueOnce({ ok: true, card: two })
    const user = userEvent.setup()
    render(
      <DishDetailCard
        props={{
          ...base,
          items: [
            base.items[0]!,
            { name: 'Dầu ăn', grams: 5, kcal: 45, proteinG: 0, share: false, adjusted: false },
          ],
        }}
      />,
    )

    const bun = screen.getByLabelText('Khối lượng Bún tươi (g)')
    await user.clear(bun)
    await user.type(bun, '250{Enter}')
    await waitFor(() => expect(recompute).toHaveBeenCalledTimes(1))
    await screen.findByText('472 kcal')

    const oil = screen.getByLabelText('Khối lượng Dầu ăn (g)')
    await user.clear(oil)
    await user.type(oil, '20{Enter}')

    await waitFor(() => expect(recompute).toHaveBeenCalledTimes(2))
    expect(recompute).toHaveBeenLastCalledWith({
      foodId: 'bun-thang',
      componentGrams: { 'Bún tươi': 250, 'Dầu ăn': 20 },
    })
  })
})
