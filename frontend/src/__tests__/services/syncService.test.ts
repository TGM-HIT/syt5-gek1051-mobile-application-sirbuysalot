import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/services/syncService'
import api from '@/services/api'
import { db, type PendingChange } from '@/db'

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('@/db', () => {
  const pendingChanges = {
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    sortBy: vi.fn(),
    orderBy: vi.fn().mockReturnThis(),
    toArray: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkDelete: vi.fn(),
    count: vi.fn(),
  }
  const products = { update: vi.fn() }
  const shoppingLists = { update: vi.fn() }
  return {
    db: { pendingChanges, products, shoppingLists },
  }
})

function makePending(overrides: Partial<PendingChange> = {}): PendingChange {
  return {
    id: 1,
    type: 'create',
    entity: 'product',
    entityId: 'p1',
    listId: 'list-1',
    payload: { name: 'Milk' },
    timestamp: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('syncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPendingChanges queries by listId', async () => {
    const changes = [makePending()]
    vi.mocked(db.pendingChanges.where('').equals('').sortBy).mockResolvedValue(changes)

    const result = await syncService.getPendingChanges('list-1')

    expect(db.pendingChanges.where).toHaveBeenCalledWith('listId')
    expect(result).toEqual(changes)
  })

  it('getAllPendingChanges returns all ordered by timestamp', async () => {
    const changes = [makePending(), makePending({ id: 2 })]
    vi.mocked(db.pendingChanges.orderBy('').toArray).mockResolvedValue(changes)

    const result = await syncService.getAllPendingChanges()

    expect(db.pendingChanges.orderBy).toHaveBeenCalledWith('timestamp')
    expect(result).toEqual(changes)
  })

  it('addPendingChange adds to Dexie', async () => {
    vi.mocked(db.pendingChanges.add).mockResolvedValue(1)

    const change = {
      type: 'create' as const,
      entity: 'product' as const,
      entityId: 'p1',
      listId: 'list-1',
      payload: { name: 'Milk' },
      timestamp: '2025-01-01T00:00:00Z',
    }
    const result = await syncService.addPendingChange(change)

    expect(db.pendingChanges.add).toHaveBeenCalled()
    expect(result).toBe(1)
  })

  it('removePendingChange deletes from Dexie', async () => {
    vi.mocked(db.pendingChanges.delete).mockResolvedValue(undefined)

    await syncService.removePendingChange(1)

    expect(db.pendingChanges.delete).toHaveBeenCalledWith(1)
  })

  it('syncPendingChanges sends batch and removes synced', async () => {
    const changes = [makePending({ id: 1 }), makePending({ id: 2, entityId: 'p2' })]
    vi.mocked(db.pendingChanges.where('').equals('').sortBy).mockResolvedValue(changes)

    const batchResponse = {
      results: [
        { id: 1, status: 'synced' as const },
        { id: 2, status: 'synced' as const },
      ],
      synced: 2,
      failed: 0,
    }
    vi.mocked(api.post).mockResolvedValue({ data: batchResponse })
    vi.mocked(db.pendingChanges.bulkDelete).mockResolvedValue(undefined)
    vi.mocked(db.products.update).mockResolvedValue(1)

    const result = await syncService.syncPendingChanges('list-1')

    expect(api.post).toHaveBeenCalledWith('/lists/list-1/sync', {
      changes: changes.map((c) => ({
        id: c.id,
        type: c.type,
        entity: c.entity,
        entityId: c.entityId,
        payload: c.payload,
      })),
    })
    expect(db.pendingChanges.bulkDelete).toHaveBeenCalledWith([1, 2])
    expect(result).toEqual(batchResponse)
  })

  it('syncPendingChanges returns null when empty', async () => {
    vi.mocked(db.pendingChanges.where('').equals('').sortBy).mockResolvedValue([])

    const result = await syncService.syncPendingChanges('list-1')

    expect(result).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('syncPendingChanges removes all processed items including failed', async () => {
    const changes = [makePending({ id: 1 }), makePending({ id: 2, entityId: 'p2' })]
    vi.mocked(db.pendingChanges.where('').equals('').sortBy).mockResolvedValue(changes)

    const batchResponse = {
      results: [
        { id: 1, status: 'synced' as const },
        { id: 2, status: 'failed' as const, error: 'Not found' },
      ],
      synced: 1,
      failed: 1,
    }
    vi.mocked(api.post).mockResolvedValue({ data: batchResponse })
    vi.mocked(db.pendingChanges.bulkDelete).mockResolvedValue(undefined)
    vi.mocked(db.products.update).mockResolvedValue(1)

    const result = await syncService.syncPendingChanges('list-1')

    // All processed changes are removed (synced + permanently failed)
    expect(db.pendingChanges.bulkDelete).toHaveBeenCalledWith([1, 2])
    expect(result!.failed).toBe(1)
  })

  it('syncAllPending groups by listId', async () => {
    const changes = [
      makePending({ id: 1, listId: 'list-1' }),
      makePending({ id: 2, listId: 'list-2' }),
    ]
    vi.mocked(db.pendingChanges.orderBy('').toArray).mockResolvedValue(changes)

    // Mock getPendingChanges for each list
    const batchResponse = {
      results: [{ id: 1, status: 'synced' as const }],
      synced: 1,
      failed: 0,
    }
    vi.mocked(db.pendingChanges.where('').equals('').sortBy).mockResolvedValue([changes[0]])
    vi.mocked(api.post).mockResolvedValue({ data: batchResponse })
    vi.mocked(db.pendingChanges.bulkDelete).mockResolvedValue(undefined)
    vi.mocked(db.products.update).mockResolvedValue(1)

    const result = await syncService.syncAllPending()

    expect(result).toBeInstanceOf(Map)
    // syncPendingChanges is called once per unique listId
    expect(api.post).toHaveBeenCalled()
  })

  it('syncAllPending returns empty map when queue is empty', async () => {
    vi.mocked(db.pendingChanges.orderBy('').toArray).mockResolvedValue([])

    const result = await syncService.syncAllPending()

    expect(result.size).toBe(0)
  })

  it('getPendingCount returns count from Dexie', async () => {
    vi.mocked(db.pendingChanges.count).mockResolvedValue(5)

    const result = await syncService.getPendingCount()

    expect(result).toBe(5)
  })
})
