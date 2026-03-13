import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    shoppingLists: {
      add: vi.fn().mockResolvedValue('mock-id'),
      update: vi.fn().mockResolvedValue(1),
      put: vi.fn().mockResolvedValue('mock-id'),
      filter: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    },
  },
}))

vi.mock('@/services/listService', () => ({
  listService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

import { db } from '@/db'
import { listService } from '@/services/listService'
import { useShoppingLists } from '@/composables/useShoppingLists'

describe('useShoppingLists – createList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    })
  })

  it('speichert die Liste lokal in Dexie mit synced: false', async () => {
    const { createList } = useShoppingLists()
    await createList('Wocheneinkauf')

    expect(db.shoppingLists.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Wocheneinkauf',
        synced: false,
        version: 1,
      }),
    )
  })

  it('fügt die Liste sofort reaktiv hinzu', async () => {
    const { lists, createList } = useShoppingLists()
    const prevLength = lists.value.length

    await createList('Neue Liste')

    expect(lists.value.length).toBe(prevLength + 1)
    expect(lists.value.some((l) => l.name === 'Neue Liste')).toBe(true)
  })

  it('generiert eine clientseitige UUID', async () => {
    const { createList } = useShoppingLists()
    const result = await createList('UUID-Test')

    expect(result.id).toBeTruthy()
    expect(typeof result.id).toBe('string')
  })

  it('ruft die API auf und setzt synced: true wenn online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })

    const mockCreated = {
      id: 'server-uuid-123',
      name: 'Online Liste',
      accessCode: 'abc12345',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      version: 1,
      products: [],
      users: [],
    }
    vi.mocked(listService.create).mockResolvedValue(mockCreated)

    const { createList } = useShoppingLists()
    await createList('Online Liste')

    expect(listService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Online Liste' }),
    )
    expect(db.shoppingLists.update).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ synced: true }),
    )
  })

  it('ruft die API NICHT auf wenn offline', async () => {
    const { createList } = useShoppingLists()
    const result = await createList('Offline Liste')

    expect(listService.create).not.toHaveBeenCalled()
    expect(result.name).toBe('Offline Liste')
    expect(db.shoppingLists.add).toHaveBeenCalled()
  })
})
