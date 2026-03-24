import api from './api'
import { db, type PendingChange } from '@/db'

export interface SyncResult {
  id: number
  status: 'synced' | 'failed'
  error?: string
}

export interface BatchSyncResponse {
  results: SyncResult[]
  synced: number
  failed: number
}

export const syncService = {
  async getPendingChanges(listId: string): Promise<PendingChange[]> {
    return db.pendingChanges.where('listId').equals(listId).sortBy('timestamp')
  },

  async getAllPendingChanges(): Promise<PendingChange[]> {
    return db.pendingChanges.orderBy('timestamp').toArray()
  },

  async addPendingChange(change: Omit<PendingChange, 'id'>): Promise<number> {
    return db.pendingChanges.add(change as PendingChange)
  },

  async removePendingChange(id: number): Promise<void> {
    await db.pendingChanges.delete(id)
  },

  async syncPendingChanges(listId: string): Promise<BatchSyncResponse | null> {
    const pending = await this.getPendingChanges(listId)
    if (pending.length === 0) return null

    const { data } = await api.post<BatchSyncResponse>(`/lists/${listId}/sync`, {
      changes: pending.map((c) => ({
        id: c.id,
        type: c.type,
        entity: c.entity,
        entityId: c.entityId,
        payload: c.payload,
      })),
    })

    // Remove successfully synced changes from local DB
    const syncedIds = data.results
      .filter((r) => r.status === 'synced')
      .map((r) => r.id)

    await db.pendingChanges.bulkDelete(syncedIds)

    // Mark local entities as synced
    for (const change of pending) {
      if (syncedIds.includes(change.id!)) {
        if (change.entity === 'product' && change.entityId) {
          await db.products.update(change.entityId, { synced: true })
        } else if (change.entity === 'list' && change.entityId) {
          await db.shoppingLists.update(change.entityId, { synced: true })
        }
      }
    }

    return data
  },

  async syncAllPending(): Promise<Map<string, BatchSyncResponse>> {
    const allChanges = await this.getAllPendingChanges()
    const byList = new Map<string, PendingChange[]>()

    for (const change of allChanges) {
      const existing = byList.get(change.listId) ?? []
      existing.push(change)
      byList.set(change.listId, existing)
    }

    const results = new Map<string, BatchSyncResponse>()
    for (const [listId, changes] of byList) {
      if (changes.length > 0) {
        const result = await this.syncPendingChanges(listId)
        if (result) results.set(listId, result)
      }
    }

    return results
  },

  async getPendingCount(): Promise<number> {
    return db.pendingChanges.count()
  },
}
