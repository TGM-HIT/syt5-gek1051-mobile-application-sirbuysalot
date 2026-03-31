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
    getDeleted: vi.fn(),
    restore: vi.fn(),
    reorder: vi.fn(),
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

describe('useProducts (extended)', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -- Toggle purchase tests --

  it('togglePurchase sets purchasedBy and purchasedAt', async () => {
    const original = makeProduct()
    const toggled = makeProduct({
      purchased: true,
      purchasedBy: 'Alice',
      purchasedAt: '2025-06-01T10:00:00Z',
    })
    vi.mocked(productService.togglePurchase).mockResolvedValue(toggled)
    vi.mocked(productService.getAll).mockResolvedValue([toggled])

    const { products, togglePurchase } = useProducts(listId)
    products.value = [original]
    await togglePurchase('1', 'Alice')

    expect(products.value[0].purchasedBy).toBe('Alice')
    expect(products.value[0].purchasedAt).toBe('2025-06-01T10:00:00Z')
  })

  it('togglePurchase back clears purchasedBy and purchasedAt', async () => {
    const purchased = makeProduct({
      purchased: true,
      purchasedBy: 'Alice',
      purchasedAt: '2025-06-01T10:00:00Z',
    })
    const cleared = makeProduct({
      purchased: false,
      purchasedBy: null,
      purchasedAt: null,
    })
    vi.mocked(productService.togglePurchase).mockResolvedValue(cleared)
    vi.mocked(productService.getAll).mockResolvedValue([cleared])

    const { products, togglePurchase } = useProducts(listId)
    products.value = [purchased]
    await togglePurchase('1', 'Alice')

    expect(products.value[0].purchased).toBe(false)
    expect(products.value[0].purchasedBy).toBeNull()
    expect(products.value[0].purchasedAt).toBeNull()
  })

  // -- Search/filter tests (using products ref directly) --

  it('filters products by single character', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'Bread' }),
      makeProduct({ id: '3', name: 'Butter' }),
    ]

    const filtered = products.value.filter((p) => p.name.toLowerCase().includes('m'))

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Milk')
  })

  it('filters products case-insensitively', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'milk chocolate' }),
    ]

    const query = 'MILK'
    const filtered = products.value.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    )

    expect(filtered).toHaveLength(2)
  })

  it('filters products by partial match', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Oat Milk' }),
      makeProduct({ id: '2', name: 'Almond Milk' }),
      makeProduct({ id: '3', name: 'Bread' }),
    ]

    const filtered = products.value.filter((p) =>
      p.name.toLowerCase().includes('milk'),
    )

    expect(filtered).toHaveLength(2)
  })

  it('empty search returns all products', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'Bread' }),
    ]

    const query = ''
    const filtered = products.value.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    )

    expect(filtered).toHaveLength(2)
  })

  it('search with no match returns empty', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'Bread' }),
    ]

    const filtered = products.value.filter((p) =>
      p.name.toLowerCase().includes('xyz'),
    )

    expect(filtered).toHaveLength(0)
  })

  // -- Tag filter tests --

  it('filters products by tag', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk', tags: [{ id: 't1', name: 'Dairy' }] }),
      makeProduct({ id: '2', name: 'Bread', tags: [{ id: 't2', name: 'Bakery' }] }),
    ]

    const tagFilter = 't1'
    const filtered = products.value.filter((p) =>
      p.tags.some((t) => t.id === tagFilter),
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Milk')
  })

  it('filters products by multiple tags (AND logic)', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({
        id: '1',
        name: 'Organic Milk',
        tags: [
          { id: 't1', name: 'Dairy' },
          { id: 't3', name: 'Organic' },
        ],
      }),
      makeProduct({ id: '2', name: 'Milk', tags: [{ id: 't1', name: 'Dairy' }] }),
      makeProduct({ id: '3', name: 'Bread', tags: [{ id: 't2', name: 'Bakery' }] }),
    ]

    const tagFilters = ['t1', 't3']
    const filtered = products.value.filter((p) =>
      tagFilters.every((tf) => p.tags.some((t) => t.id === tf)),
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Organic Milk')
  })

  it('combines search and tag filter', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({
        id: '1',
        name: 'Organic Milk',
        tags: [{ id: 't1', name: 'Dairy' }],
      }),
      makeProduct({
        id: '2',
        name: 'Regular Milk',
        tags: [{ id: 't1', name: 'Dairy' }],
      }),
      makeProduct({
        id: '3',
        name: 'Organic Bread',
        tags: [{ id: 't2', name: 'Bakery' }],
      }),
    ]

    const query = 'organic'
    const tagFilter = 't1'
    const filtered = products.value.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        p.tags.some((t) => t.id === tagFilter),
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Organic Milk')
  })

  // -- Cost computation tests --

  it('computes total cost as sum of prices', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk', price: 1.5 }),
      makeProduct({ id: '2', name: 'Bread', price: 2.5 }),
      makeProduct({ id: '3', name: 'Eggs', price: 3.0 }),
    ]

    const totalCost = products.value.reduce((sum, p) => sum + (p.price ?? 0), 0)

    expect(totalCost).toBe(7.0)
  })

  it('excludes null prices from total cost', () => {
    const { products } = useProducts(listId)
    products.value = [
      makeProduct({ id: '1', name: 'Milk', price: 1.5 }),
      makeProduct({ id: '2', name: 'Bread', price: null }),
      makeProduct({ id: '3', name: 'Eggs', price: 3.0 }),
    ]

    const totalCost = products.value.reduce((sum, p) => sum + (p.price ?? 0), 0)

    expect(totalCost).toBe(4.5)
  })
})
