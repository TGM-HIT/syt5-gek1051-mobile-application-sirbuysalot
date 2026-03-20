import { ref } from 'vue'
import { listService } from '@/services/listService'
import { syncService } from '@/services/syncService'
import { db } from '@/db'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function generateUUID(): string {
  return crypto.randomUUID()
}

function toApiList(local: any): ShoppingList {
  return {
    id: local.id!,
    name: local.name,
    accessCode: local.accessCode ?? null,
    createdAt: local.createdAt,
    updatedAt: local.updatedAt,
    deletedAt: local.deletedAt ?? null,
    version: local.version,
    products: [],
    users: [],
  }
}

export function useShoppingLists() {
  async function fetchLists() {
    loading.value = true
    error.value = null
    try {
      if (navigator.onLine) {
        const serverLists = await listService.getAll()
        lists.value = serverLists
        await db.shoppingLists.clear()
        for (const list of serverLists) {
          await db.shoppingLists.put({
            id: list.id,
            name: list.name,
            accessCode: list.accessCode ?? undefined,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
            version: list.version,
            synced: true,
          })
        }
      } else {
        const localLists = await db.shoppingLists.toArray()
        lists.value = localLists.map(toApiList)
      }
    } catch (e: any) {
      const localLists = await db.shoppingLists.toArray()
      if (localLists.length > 0) {
        lists.value = localLists.map(toApiList)
      } else {
        error.value = e.message ?? 'Fehler beim Laden der Listen'
      }
    } finally {
      loading.value = false
    }
  }

  async function createList(name: string): Promise<ShoppingList> {
    const id = generateUUID()
    const now = new Date().toISOString()

    await db.shoppingLists.add({
      id,
      name,
      createdAt: now,
      updatedAt: now,
      version: 1,
      synced: false,
    })

    const localList: ShoppingList = {
      id,
      name,
      accessCode: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      products: [],
      users: [],
    }
    lists.value.unshift(localList)

    if (navigator.onLine) {
      try {
        const created = await listService.create({ name, id })
        await db.shoppingLists.update(id, {
          accessCode: created.accessCode ?? undefined,
          synced: true,
        })
        const idx = lists.value.findIndex((l) => l.id === id)
        if (idx !== -1) lists.value[idx] = created
        return created
      } catch {
        await syncService.addToQueue('create', 'list', id, { name })
      }
    } else {
      await syncService.addToQueue('create', 'list', id, { name })
    }

    return localList
  }

  async function syncPendingLists(): Promise<void> {
    const unsynced = await db.shoppingLists.filter((l: any) => !l.synced && !l.deletedAt).toArray()
    for (const local of unsynced) {
      try {
        const created = await listService.create({ name: local.name, id: local.id })
        await db.shoppingLists.update(local.id!, { synced: true })
        const idx = lists.value.findIndex((l) => l.id === local.id)
        if (idx !== -1) lists.value[idx] = { ...lists.value[idx], ...created, id: local.id! }
      } catch {
        // Wird beim nächsten Reconnect erneut versucht
      }
    }
  }

  async function updateList(id: string, payload: Partial<ShoppingList>) {
    const now = new Date().toISOString()
    
    await db.shoppingLists.update(id, {
      name: payload.name,
      accessCode: payload.accessCode,
      synced: false,
    })

    const idx = lists.value.findIndex((l) => l.id === id)
    if (idx !== -1) {
      lists.value[idx] = { ...lists.value[idx], ...payload, updatedAt: now }
    }

    if (navigator.onLine) {
      try {
        const updated = await listService.update(id, payload)
        await db.shoppingLists.update(id, { version: updated.version, synced: true })
        const idx2 = lists.value.findIndex((l) => l.id === id)
        if (idx2 !== -1) lists.value[idx2] = { ...lists.value[idx2], version: updated.version }
        return updated
      } catch {
        await syncService.addToQueue('update', 'list', id, payload)
      }
    } else {
      await syncService.addToQueue('update', 'list', id, payload)
    }

    return lists.value.find((l) => l.id === id)
  }

  async function removeList(id: string) {
    await db.shoppingLists.delete(id)
    lists.value = lists.value.filter((l) => l.id !== id)

    if (navigator.onLine) {
      try {
        await listService.remove(id)
      } catch {
        await syncService.addToQueue('delete', 'list', id, {})
      }
    } else {
      await syncService.addToQueue('delete', 'list', id, {})
    }
  }

  return {
    lists,
    loading,
    error,
    fetchLists,
    createList,
    updateList,
    removeList,
    syncPendingLists,
  }
}
