import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTagFilter } from '@/composables/useTagFilter'
import type { Product, Tag } from '@/types'

function makeTag(id: string, name: string): Tag {
  return { id, name }
}

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

describe('useTagFilter', () => {
  it('returns all products when no filter is active', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'Bread' }),
    ])

    const { filteredProducts, hasActiveFilter } = useTagFilter(products)

    expect(hasActiveFilter.value).toBe(false)
    expect(filteredProducts.value).toHaveLength(2)
  })

  it('extracts available tags from products', () => {
    const products = ref([
      makeProduct({ id: '1', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', tags: [makeTag('t2', 'Bakery'), makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '3', tags: [] }),
    ])

    const { availableTags } = useTagFilter(products)

    expect(availableTags.value).toHaveLength(2)
    expect(availableTags.value.map((t) => t.name)).toContain('Dairy')
    expect(availableTags.value.map((t) => t.name)).toContain('Bakery')
  })

  it('sorts available tags alphabetically', () => {
    const products = ref([
      makeProduct({ id: '1', tags: [makeTag('t1', 'Zebra')] }),
      makeProduct({ id: '2', tags: [makeTag('t2', 'Apple')] }),
      makeProduct({ id: '3', tags: [makeTag('t3', 'Mango')] }),
    ])

    const { availableTags } = useTagFilter(products)

    expect(availableTags.value[0].name).toBe('Apple')
    expect(availableTags.value[1].name).toBe('Mango')
    expect(availableTags.value[2].name).toBe('Zebra')
  })

  it('filters products by selected tag', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Bread', tags: [makeTag('t2', 'Bakery')] }),
      makeProduct({ id: '3', name: 'Cheese', tags: [makeTag('t1', 'Dairy')] }),
    ])

    const { filteredProducts, toggleTag } = useTagFilter(products)

    toggleTag('t1')

    expect(filteredProducts.value).toHaveLength(2)
    expect(filteredProducts.value.map((p) => p.name)).toContain('Milk')
    expect(filteredProducts.value.map((p) => p.name)).toContain('Cheese')
  })

  it('filters products with multiple selected tags (OR logic)', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Bread', tags: [makeTag('t2', 'Bakery')] }),
      makeProduct({ id: '3', name: 'Water', tags: [makeTag('t3', 'Drinks')] }),
    ])

    const { filteredProducts, toggleTag } = useTagFilter(products)

    toggleTag('t1')
    toggleTag('t2')

    expect(filteredProducts.value).toHaveLength(2)
    expect(filteredProducts.value.map((p) => p.name)).toContain('Milk')
    expect(filteredProducts.value.map((p) => p.name)).toContain('Bread')
  })

  it('excludes products without tags when filter is active', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Bread', tags: [] }),
    ])

    const { filteredProducts, toggleTag } = useTagFilter(products)

    toggleTag('t1')

    expect(filteredProducts.value).toHaveLength(1)
    expect(filteredProducts.value[0].name).toBe('Milk')
  })

  it('toggleTag deselects already selected tag', () => {
    const products = ref([
      makeProduct({ id: '1', tags: [makeTag('t1', 'Dairy')] }),
    ])

    const { isTagSelected, toggleTag } = useTagFilter(products)

    toggleTag('t1')
    expect(isTagSelected('t1')).toBe(true)

    toggleTag('t1')
    expect(isTagSelected('t1')).toBe(false)
  })

  it('resetFilter clears all selected tags', () => {
    const products = ref([
      makeProduct({ id: '1', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', tags: [makeTag('t2', 'Bakery')] }),
    ])

    const { filteredProducts, toggleTag, resetFilter, hasActiveFilter } = useTagFilter(products)

    toggleTag('t1')
    expect(hasActiveFilter.value).toBe(true)
    expect(filteredProducts.value).toHaveLength(1)

    resetFilter()
    expect(hasActiveFilter.value).toBe(false)
    expect(filteredProducts.value).toHaveLength(2)
  })

  it('provides correct product counts', () => {
    const products = ref([
      makeProduct({ id: '1', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', tags: [makeTag('t2', 'Bakery')] }),
      makeProduct({ id: '3', tags: [makeTag('t1', 'Dairy')] }),
    ])

    const { totalProductCount, filteredProductCount, toggleTag } = useTagFilter(products)

    expect(totalProductCount.value).toBe(3)
    expect(filteredProductCount.value).toBe(3)

    toggleTag('t1')
    expect(totalProductCount.value).toBe(3)
    expect(filteredProductCount.value).toBe(2)
  })

  it('combines search query with tag filter', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Butter', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '3', name: 'Bread', tags: [makeTag('t2', 'Bakery')] }),
    ])
    const searchQuery = ref('')

    const { filteredProducts, toggleTag } = useTagFilter(products, searchQuery)

    toggleTag('t1')
    expect(filteredProducts.value).toHaveLength(2)

    searchQuery.value = 'mil'
    expect(filteredProducts.value).toHaveLength(1)
    expect(filteredProducts.value[0].name).toBe('Milk')
  })

  it('search filters by product name case insensitively', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk' }),
      makeProduct({ id: '2', name: 'MILK' }),
      makeProduct({ id: '3', name: 'Bread' }),
    ])
    const searchQuery = ref('milk')

    const { filteredProducts } = useTagFilter(products, searchQuery)

    expect(filteredProducts.value).toHaveLength(2)
  })

  it('search filters by tag name', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Bread', tags: [makeTag('t2', 'Bakery')] }),
    ])
    const searchQuery = ref('dairy')

    const { filteredProducts } = useTagFilter(products, searchQuery)

    expect(filteredProducts.value).toHaveLength(1)
    expect(filteredProducts.value[0].name).toBe('Milk')
  })

  it('returns empty results when no products match combined filters', () => {
    const products = ref([
      makeProduct({ id: '1', name: 'Milk', tags: [makeTag('t1', 'Dairy')] }),
      makeProduct({ id: '2', name: 'Bread', tags: [makeTag('t2', 'Bakery')] }),
    ])
    const searchQuery = ref('cheese')

    const { filteredProducts, toggleTag } = useTagFilter(products, searchQuery)

    toggleTag('t1')
    expect(filteredProducts.value).toHaveLength(0)
  })
})
