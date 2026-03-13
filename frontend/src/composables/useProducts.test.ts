import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Dexie db
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

// Mock productService
const mockTogglePurchase = vi.fn()
const mockGetAll = vi.fn()
vi.mock('@/services/productService', () => ({
  productService: {
    getAll: mockGetAll,
    create: vi.fn(),
    update: vi.fn(),
    togglePurchase: mockTogglePurchase,
    remove: vi.fn(),
  },
}))

// Mock onMounted/onUnmounted so no DOM event listeners needed
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: vi.fn((cb) => cb()),
    onUnmounted: vi.fn(),
  }
})

import { useProducts } from './useProducts'
import { db } from '@/db'

const LIST_ID = 'list-1'

function makeProduct(overrides = {}) {
  return {
    id: 'prod-1',
    name: 'Milch',
    price: null,
    purchased: false,
    purchasedBy: null,
    purchasedAt: null,
    position: null,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    deletedAt: null,
    version: 1,
    tags: [],
    ...overrides,
  }
}

describe('useProducts – togglePurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does an optimistic update immediately before the API call resolves', async () => {
    mockTogglePurchase.mockResolvedValue(makeProduct({ purchased: true, purchasedBy: 'Julian', purchasedAt: '2024-01-01T10:00:00' }))

    const { products, togglePurchase } = useProducts(LIST_ID)
    products.value = [makeProduct()]

    const promise = togglePurchase('prod-1', 'Julian')

    // Optimistic update happens synchronously before await
    expect(products.value[0].purchased).toBe(true)
    expect(products.value[0].purchasedBy).toBe('Julian')

    await promise
  })

  it('saves to Dexie with synced: false before API call', async () => {
    mockTogglePurchase.mockResolvedValue(makeProduct({ purchased: true }))

    const { products, togglePurchase } = useProducts(LIST_ID)
    products.value = [makeProduct()]

    await togglePurchase('prod-1', 'Julian')

    expect(db.products.put).toHaveBeenCalledWith(
      expect.objectContaining({ purchased: true, synced: false }),
    )
  })

  it('marks synced: true in Dexie after successful API call', async () => {
    const serverProduct = makeProduct({ purchased: true, purchasedBy: 'Julian', version: 2 })
    mockTogglePurchase.mockResolvedValue(serverProduct)

    const { products, togglePurchase } = useProducts(LIST_ID)
    products.value = [makeProduct()]

    await togglePurchase('prod-1', 'Julian')

    expect(db.products.update).toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({ synced: true, version: 2 }),
    )
  })

  it('keeps optimistic state when API fails (offline mode)', async () => {
    mockTogglePurchase.mockRejectedValue(new Error('Network error'))

    const { products, togglePurchase } = useProducts(LIST_ID)
    products.value = [makeProduct()]

    await togglePurchase('prod-1', 'Julian')

    // Optimistic update stays
    expect(products.value[0].purchased).toBe(true)
    // synced: false stays in Dexie (update not called with synced: true)
    expect(db.products.update).not.toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({ synced: true }),
    )
  })

  it('toggles back to not purchased on second tap', async () => {
    mockTogglePurchase.mockResolvedValue(makeProduct({ purchased: false, purchasedBy: null }))

    const { products, togglePurchase } = useProducts(LIST_ID)
    products.value = [makeProduct({ purchased: true, purchasedBy: 'Julian' })]

    await togglePurchase('prod-1', 'Julian')

    expect(products.value[0].purchased).toBe(false)
    expect(products.value[0].purchasedBy).toBeNull()
  })
})

describe('useProducts – fetchProducts (offline fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads from Dexie when API call fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'))

    const cachedProduct = {
      id: 'prod-1',
      listId: LIST_ID,
      name: 'Brot',
      purchased: false,
      position: 0,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00',
      version: 1,
      synced: true,
    }

    const mockWhere = vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        filter: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([cachedProduct]),
        }),
      }),
    })
    vi.mocked(db.products).where = mockWhere

    const { products, fetchProducts } = useProducts(LIST_ID)
    await fetchProducts()

    expect(products.value).toHaveLength(1)
    expect(products.value[0].name).toBe('Brot')
  })
})
