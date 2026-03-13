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

describe('productService', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAll fetches products for a list', async () => {
    const products = [{ id: '1', name: 'Milk' }]
    vi.mocked(api.get).mockResolvedValue({ data: products })

    const result = await productService.getAll(listId)

    expect(api.get).toHaveBeenCalledWith(`/lists/${listId}/products`)
    expect(result).toEqual(products)
  })

  it('create posts a new product', async () => {
    const product = { id: '1', name: 'Milk', price: 1.5 }
    vi.mocked(api.post).mockResolvedValue({ data: product })

    const result = await productService.create(listId, { name: 'Milk', price: 1.5 })

    expect(api.post).toHaveBeenCalledWith(`/lists/${listId}/products`, { name: 'Milk', price: 1.5 })
    expect(result).toEqual(product)
  })

  it('update puts product changes', async () => {
    const product = { id: '1', name: 'Oat Milk' }
    vi.mocked(api.put).mockResolvedValue({ data: product })

    const result = await productService.update(listId, '1', { name: 'Oat Milk' })

    expect(api.put).toHaveBeenCalledWith(`/lists/${listId}/products/1`, { name: 'Oat Milk' })
    expect(result).toEqual(product)
  })

  it('togglePurchase patches purchase status', async () => {
    const product = { id: '1', name: 'Milk', purchased: true }
    vi.mocked(api.patch).mockResolvedValue({ data: product })

    const result = await productService.togglePurchase(listId, '1', 'Alice')

    expect(api.patch).toHaveBeenCalledWith(`/lists/${listId}/products/1/purchase`, { purchasedBy: 'Alice' })
    expect(result).toEqual(product)
  })

  it('remove deletes a product', async () => {
    vi.mocked(api.delete).mockResolvedValue({})

    await productService.remove(listId, '1')

    expect(api.delete).toHaveBeenCalledWith(`/lists/${listId}/products/1`)
  })
})
