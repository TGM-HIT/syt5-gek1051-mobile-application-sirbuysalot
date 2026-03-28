import { describe, it, expect, vi, beforeEach } from 'vitest'
import { productService } from '@/services/productService'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('productService (extended)', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getDeleted fetches soft-deleted products', async () => {
    const deleted = [{ id: 'p1', name: 'Milk', deletedAt: '2025-01-01' }]
    vi.mocked(api.get).mockResolvedValue({ data: deleted })

    const result = await productService.getDeleted(listId)

    expect(api.get).toHaveBeenCalledWith(`/lists/${listId}/products/deleted`)
    expect(result).toEqual(deleted)
  })

  it('restore patches a deleted product back', async () => {
    const restored = { id: 'p1', name: 'Milk', deletedAt: null }
    vi.mocked(api.patch).mockResolvedValue({ data: restored })

    const result = await productService.restore(listId, 'p1')

    expect(api.patch).toHaveBeenCalledWith(`/lists/${listId}/products/p1/restore`)
    expect(result).toEqual(restored)
  })

  it('reorder patches product positions', async () => {
    const order = [
      { id: 'p1', position: 0 },
      { id: 'p2', position: 1 },
    ]
    vi.mocked(api.patch).mockResolvedValue({})

    await productService.reorder(listId, order)

    expect(api.patch).toHaveBeenCalledWith(`/lists/${listId}/products/reorder`, order)
  })

  it('update propagates 409 conflict error', async () => {
    const error = Object.assign(new Error('Conflict'), {
      response: { status: 409 },
    })
    vi.mocked(api.put).mockRejectedValue(error)

    await expect(
      productService.update(listId, 'p1', { name: 'Stale' }),
    ).rejects.toThrow('Conflict')
  })

  it('create propagates 400 for missing name', async () => {
    const error = Object.assign(new Error('Bad Request'), {
      response: { status: 400 },
    })
    vi.mocked(api.post).mockRejectedValue(error)

    await expect(
      productService.create(listId, { name: '' }),
    ).rejects.toThrow('Bad Request')
  })

  it('togglePurchase returns updated product', async () => {
    const product = {
      id: 'p1',
      name: 'Milk',
      purchased: true,
      purchasedBy: 'Alice',
      purchasedAt: '2025-06-01T10:00:00Z',
    }
    vi.mocked(api.patch).mockResolvedValue({ data: product })

    const result = await productService.togglePurchase(listId, 'p1', 'Alice')

    expect(result.purchased).toBe(true)
    expect(result.purchasedBy).toBe('Alice')
  })
})
