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
  },
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

describe('useShoppingLists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { lists, loading, error } = useShoppingLists()
    lists.value = []
    loading.value = false
    error.value = null
  })

  it('fetchLists populates the lists ref', async () => {
    const mockLists = [makeList()]
    vi.mocked(listService.getAll).mockResolvedValue(mockLists)

    const { lists, fetchLists } = useShoppingLists()
    await fetchLists()

    expect(lists.value).toEqual(mockLists)
  })

  it('fetchLists sets loading state', async () => {
    vi.mocked(listService.getAll).mockResolvedValue([])

    const { loading, fetchLists } = useShoppingLists()

    const promise = fetchLists()
    // loading is set synchronously before the await
    expect(loading.value).toBe(true)

    await promise
    expect(loading.value).toBe(false)
  })

  it('fetchLists sets error on failure', async () => {
    vi.mocked(listService.getAll).mockRejectedValue(new Error('Network error'))

    const { error, fetchLists } = useShoppingLists()
    await fetchLists()

    expect(error.value).toBe('Network error')
  })

  it('createList prepends to the list', async () => {
    const created = makeList({ id: '2', name: 'New List' })
    vi.mocked(listService.create).mockResolvedValue(created)

    const { lists, createList } = useShoppingLists()
    const result = await createList('New List')

    expect(listService.create).toHaveBeenCalledWith({ name: 'New List' })
    expect(result).toEqual(created)
    expect(lists.value[0]).toEqual(created)
  })

  it('updateList replaces the list in the array', async () => {
    const { lists, updateList } = useShoppingLists()
    lists.value = [makeList()]

    const updated = makeList({ name: 'Updated', version: 2 })
    vi.mocked(listService.update).mockResolvedValue(updated)

    await updateList('1', { name: 'Updated' })

    expect(lists.value[0].name).toBe('Updated')
  })

  it('removeList filters out the list', async () => {
    const { lists, removeList } = useShoppingLists()
    lists.value = [makeList()]

    vi.mocked(listService.remove).mockResolvedValue()

    await removeList('1')

    expect(lists.value).toHaveLength(0)
  })
})
