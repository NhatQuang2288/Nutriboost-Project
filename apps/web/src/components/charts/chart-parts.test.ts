import { describe, expect, it } from 'vitest'

import { describeSeries, type ChartPoint } from './chart-parts'

const points = (...values: number[]): ChartPoint[] =>
  values.map((value, index) => ({ label: `0${index + 1}/09`, value }))

describe('describeSeries', () => {
  it('nói đủ thấp nhất, cao nhất, trung bình và gần nhất', () => {
    // Câu này là thứ trình đọc màn hình đọc thay cho biểu đồ SVG, nên nó phải chứa mọi thông
    // tin mà mắt lấy được từ hình: độ cao, độ thấp và xu hướng gần đây.
    expect(describeSeries(points(60, 80, 100), 'kg')).toBe(
      'Thấp nhất 60 kg, cao nhất 100 kg, trung bình 80 kg, gần nhất 100 kg.',
    )
  })

  it('nói rõ khi chưa có dữ liệu', () => {
    expect(describeSeries([], 'kcal')).toBe('Chưa có dữ liệu.')
  })

  it('xử lý được một điểm duy nhất', () => {
    expect(describeSeries(points(70), 'kg')).toBe(
      'Thấp nhất 70 kg, cao nhất 70 kg, trung bình 70 kg, gần nhất 70 kg.',
    )
  })

  it('làm tròn trung bình, không hiện số thập phân dài', () => {
    expect(describeSeries(points(1, 2), 'kg')).toContain('trung bình 2 kg')
  })

  it('giữ nguyên giá trị thập phân của cân nặng', () => {
    // Cân nặng là số thập phân thật (72,4 kg), không được làm tròn ở phần thấp nhất/cao nhất.
    expect(describeSeries(points(72.4, 71.8), 'kg')).toContain('Thấp nhất 71.8 kg')
    expect(describeSeries(points(72.4, 71.8), 'kg')).toContain('cao nhất 72.4 kg')
  })
})
