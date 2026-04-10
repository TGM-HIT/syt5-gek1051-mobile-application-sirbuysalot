import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useShoppingLists } from '@/composables/useShoppingLists'
import { listService } from '@/services/listService'
import type { ShoppingList } from '@/types'

vi.mock('@/services/listService', () => ({
  listService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getDeleted: vi.fn(),
    restore: vi.fn(),
    duplicate: vi.fn(),
  },
}))

vi.mock('@/db', () => ({
  db: {
    shoppingLists: {
      put: vi.fn().mockResolvedValue('id'),
      get: vi.fn().mockResolvedValue(null),
      filter: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    },
  },
}))

const mockMyListIds = ref<string[]>([])
vi.mock('@/composables/useUser', () => ({
  useUser: () => ({
    myListIds: mockMyListIds,
    addMyList: (id: string) => { if (!mockMyListIds.value.includes(id)) mockMyListIds.value.push(id) },
    removeMyList: (id: string) => { mockMyListIds.value = mockMyListIds.value.filter(i => i !== id) },
  }),
}))

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: '1',
    name: 'Groceries',
    accessCode: 'abc12345',
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    version: 1,
    products: [],
    users: [],
    ...overrides,
  }
}

describe('useShoppingLists (extended)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMyListIds.value = []
    const { lists, deletedLists, loading, error } = useShoppingLists()
    lists.value = []
    deletedLists.value = []
    loading.value = false
    error.value = null
  })

  it('removeList soft-deletes and filters from lists', async () => {
    mockMyListIds.value = ['1', '2']
    const other = makeList({ id: '2', name: 'Other' })
    vi.mocked(listService.remove).mockResolvedValue()
    vi.mocked(listService.getAll).mockResolvedValue([other])

    const { lists, removeList } = useShoppingLists()
    lists.value = [makeList(), other]

    await removeList('1')

    expect(listService.remove).toHaveBeenCalledWith('1')
    expect(lists.value).toHaveLength(1)
    expect(lists.value[0].id).toBe('2')
  })

  it('fetchDeletedLists populates deletedLists', async () => {
    const deleted = [makeList({ id: '3', name: 'Archived', deletedAt: '2025-01-01' })]
    vi.mocked(listService.getDeleted).mockResolvedValue(deleted)

    const { deletedLists, fetchDeletedLists } = useShoppingLists()
    await fetchDeletedLists()

    expect(listService.getDeleted).toHaveBeenCalled()
    expect(deletedLists.value).toEqual(deleted)
  })

  it('restoreList moves from deleted to active lists', async () => {
    const restored = makeList({ id: '3', name: 'Restored', deletedAt: null })
    vi.mocked(listService.restore).mockResolvedValue(restored)

    const { lists, deletedLists, restoreList } = useShoppingLists()
    deletedLists.value = [makeList({ id: '3', name: 'Restored', deletedAt: '2025-01-01' })]

    const result = await restoreList('3')

    expect(listService.restore).toHaveBeenCalledWith('3')
    expect(result).toEqual(restored)
    expect(deletedLists.value).toHaveLength(0)
    expect(lists.value).toContainEqual(restored)
  })

  it('duplicateList prepends the copy to lists', async () => {
    const copy = makeList({ id: '4', name: 'Groceries (copy)' })
    vi.mocked(listService.duplicate).mockResolvedValue(copy)

    const { lists, duplicateList } = useShoppingLists()
    lists.value = [makeList()]

    const result = await duplicateList('1')

    expect(listService.duplicate).toHaveBeenCalledWith('1')
    expect(result).toEqual(copy)
    expect(lists.value[0]).toEqual(copy)
  })

  it('duplicateList sets error on failure', async () => {
    vi.mocked(listService.duplicate).mockRejectedValue(new Error('Server error'))

    const { duplicateList } = useShoppingLists()

    await expect(duplicateList('1')).rejects.toThrow('Server error')
  })

  it('restoreList sets error on failure', async () => {
    vi.mocked(listService.restore).mockRejectedValue(new Error('Not found'))

    const { restoreList } = useShoppingLists()

    await expect(restoreList('nonexistent')).rejects.toThrow('Not found')
  })
})
