import { db, type SyncOperation } from '@/db'
import { listService } from '@/services/listService'
import { productService } from '@/services/productService'

export const syncService = {
  async addToQueue(
    type: 'create' | 'update' | 'delete',
    entity: 'list' | 'product',
    entityId: string,
    payload: any
  ) {
    const operation: SyncOperation = {
      type,
      entity,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      synced: false,
    }
    await db.syncQueue.add(operation)
  },

  async getPendingOperations(): Promise<SyncOperation[]> {
    const allOps = await db.syncQueue.toArray()
    return allOps.filter(op => !op.synced)
  },

  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingOperations()
    return pending.length
  },

  async markAsSynced(id: number) {
    await db.syncQueue.update(id, { synced: true })
  },

  async processQueue() {
    if (!navigator.onLine) return

    const operations = await this.getPendingOperations()

    for (const op of operations) {
      try {
        await this.processOperation(op)
        await this.markAsSynced(op.id!)
      } catch (error) {
        console.error('Sync operation failed:', error)
      }
    }
  },

  async processOperation(op: SyncOperation) {
    if (op.entity === 'list') {
      await this.syncListOperation(op)
    } else if (op.entity === 'product') {
      await this.syncProductOperation(op)
    }
  },

  async syncListOperation(op: SyncOperation) {
    switch (op.type) {
      case 'create':
        await listService.create(op.payload)
        break
      case 'update':
        await listService.update(op.entityId, op.payload)
        break
      case 'delete':
        await listService.remove(op.entityId)
        break
    }
  },

  async syncProductOperation(op: SyncOperation) {
    const listId = op.payload.listId
    switch (op.type) {
      case 'create':
        await productService.create(listId, op.payload)
        break
      case 'update':
        await productService.update(listId, op.entityId, op.payload)
        break
      case 'delete':
        await productService.remove(listId, op.entityId)
        break
    }
  },

  async clearSyncedOperations() {
    const syncedOps = await db.syncQueue.where('id').above(0).filter(op => op.synced).toArray()
    const ids = syncedOps.map(op => op.id).filter((id): id is number => id !== undefined)
    await db.syncQueue.bulkDelete(ids)
  },
}
