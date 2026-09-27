import { describe, expect, it, vi } from 'vitest'

import { resolveFoodIds } from './food-ids'

const UUID = '11111111-1111-4111-8111-111111111111'

function fakeSupabase(rows: { id: string; slug: string }[]) {
  const inFn = vi.fn(async () => ({ data: rows, error: null }))
  const from = vi.fn(() => ({ select: () => ({ in: inFn }) }))
  return { client: { from } as never, from, inFn }
}

describe('resolveFoodIds', () => {
  it('đổi slug của danh mục sang UUID của bảng foods', async () => {
    const { client } = fakeSupabase([{ id: UUID, slug: 'pho-bo' }])
    expect(await resolveFoodIds(client, ['pho-bo'])).toEqual([UUID])
  })

  it('giữ nguyên UUID và null, không truy vấn khi không có slug', async () => {
    const { client, from } = fakeSupabase([])
    expect(await resolveFoodIds(client, [UUID, null])).toEqual([UUID, null])
    expect(from).not.toHaveBeenCalled()
  })

  it('slug không có trong CSDL thành null chứ không làm hỏng cả bữa', async () => {
    const { client } = fakeSupabase([])
    expect(await resolveFoodIds(client, ['mon-la'])).toEqual([null])
  })
})
