import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProducts } from '@/composables/useProducts'
import { productService } from '@/services/productService'
import type { Product } from '@/types'

vi.mock('@/db', () => ({
  db: {
    products: {
      put: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
  },
}))

vi.mock('@/services/productService', () => ({
  productService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    togglePurchase: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: vi.fn((cb) => cb()),
    onUnmounted: vi.fn(),
  }
})

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

  it('fetchProducts sets error on failure', async () => {
    vi.mocked(productService.getAll).mockRejectedValue(new Error('Failed'))

    const { error, fetchProducts } = useProducts(listId)
    await fetchProducts()

    expect(error.value).toBe('Offline – keine gecachten Daten verfügbar')
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
    expect(products.value).toContainEqual(created)
  })

  it('updateProduct replaces product in array', async () => {
    const original = makeProduct()
    const updated = makeProduct({ name: 'Oat Milk', version: 2 })
    vi.mocked(productService.update).mockResolvedValue(updated)

    const { products, updateProduct } = useProducts(listId)
    products.value = [original]
    await updateProduct('1', { name: 'Oat Milk' })

    expect(products.value[0].name).toBe('Oat Milk')
  })

  it('togglePurchase updates purchase state', async () => {
    const original = makeProduct()
    const toggled = makeProduct({ purchased: true, purchasedBy: 'Alice' })
    vi.mocked(productService.togglePurchase).mockResolvedValue(toggled)

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
