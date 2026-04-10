import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProducts } from '@/composables/useProducts'
import { productService } from '@/services/productService'
import type { Product } from '@/types'

vi.mock('@/services/productService', () => ({
  productService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    togglePurchase: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/services/syncService', () => ({
  syncService: {
    addPendingChange: vi.fn().mockResolvedValue(1),
    syncPendingChanges: vi.fn().mockResolvedValue(null),
    getPendingCount: vi.fn().mockResolvedValue(0),
  },
}))

vi.mock('@/db', () => ({
  db: {
    products: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(0),
          filter: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
            delete: vi.fn().mockResolvedValue(0),
          }),
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      bulkPut: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue('id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
  },
}))

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    name: 'Milk',
    price: null,
    purchased: false,
    purchasedBy: null,
    purchasedAt: null,
    position: null,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    version: 1,
    tags: [],
    ...overrides,
  }
}

describe('useProducts', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchProducts populates products', async () => {
    const mockProducts = [makeProduct()]
    vi.mocked(productService.getAll).mockResolvedValue(mockProducts)

    const { products, fetchProducts } = useProducts(listId)
    await fetchProducts()

    expect(products.value).toEqual(mockProducts)
  })

  it('fetchProducts loads from cache on failure', async () => {
    vi.mocked(productService.getAll).mockRejectedValue(new Error('Failed'))

    const { products, fetchProducts } = useProducts(listId)
    await fetchProducts()

    // Falls back to cache (empty in test), no error shown
    expect(products.value).toEqual([])
  })

  it('fetchProducts sets loading state', async () => {
    vi.mocked(productService.getAll).mockResolvedValue([])

    const { loading, fetchProducts } = useProducts(listId)

    const promise = fetchProducts()
    expect(loading.value).toBe(true)

    await promise
    expect(loading.value).toBe(false)
  })

  it('addProduct appends to products', async () => {
    const created = makeProduct({ id: '2', name: 'Bread' })
    vi.mocked(productService.create).mockResolvedValue(created)

    const { products, addProduct } = useProducts(listId)
    await addProduct({ name: 'Bread' })

    expect(productService.create).toHaveBeenCalledWith(listId, { name: 'Bread' })
    expect(products.value.some((p) => p.name === 'Bread')).toBe(true)
  })

  it('updateProduct replaces product in array', async () => {
    const original = makeProduct()
    vi.mocked(productService.update).mockResolvedValue(makeProduct({ name: 'Oat Milk', version: 2 }))

    const { products, updateProduct } = useProducts(listId)
    products.value = [original]
    await updateProduct('1', { name: 'Oat Milk' })

    expect(products.value[0].name).toBe('Oat Milk')
  })

  it('togglePurchase updates purchase state', async () => {
    const original = makeProduct()
    vi.mocked(productService.togglePurchase).mockResolvedValue(makeProduct({ purchased: true, purchasedBy: 'Alice' }))

    const { products, togglePurchase } = useProducts(listId)
    products.value = [original]
    await togglePurchase('1', 'Alice')

    expect(products.value[0].purchased).toBe(true)
    expect(products.value[0].purchasedBy).toBe('Alice')
  })

  it('removeProduct filters out the product', async () => {
    const product = makeProduct()
    vi.mocked(productService.remove).mockResolvedValue()

    const { products, removeProduct } = useProducts(listId)
    products.value = [product]
    await removeProduct('1')

    expect(products.value).toHaveLength(0)
  })
})
