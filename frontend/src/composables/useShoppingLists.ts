import { ref } from 'vue'
import { listService } from '@/services/listService'
import { syncService } from '@/services/syncService'
import { db, type ShoppingList as DbShoppingList } from '@/db'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function generateUUID(): string {
  return crypto.randomUUID()
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
            lastModified: list.updatedAt,
            version: list.version,
            synced: true,
          })
        }
      } else {
        const localLists = await db.shoppingLists.toArray()
        lists.value = localLists.map((l) => ({
          id: l.id!,
          name: l.name,
          accessCode: l.accessCode ?? null,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          deletedAt: l.deletedAt ?? null,
          version: l.version,
          products: [],
          users: [],
        }))
      }
    } catch (e: any) {
      const localLists = await db.shoppingLists.toArray()
      if (localLists.length > 0) {
        lists.value = localLists.map((l) => ({
          id: l.id!,
          name: l.name,
          accessCode: l.accessCode ?? null,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          deletedAt: l.deletedAt ?? null,
          version: l.version,
          products: [],
          users: [],
        }))
      } else {
        error.value = e.message ?? 'Fehler beim Laden der Listen'
      }
    } finally {
      loading.value = false
    }
  }

  async function createList(name: string) {
    const now = new Date().toISOString()
    const tempId = generateUUID()

    const localList: DbShoppingList = {
      id: tempId,
      name,
      createdAt: now,
      updatedAt: now,
      lastModified: now,
      version: 0,
      synced: false,
    }

    await db.shoppingLists.add(localList)
    lists.value.unshift({
      id: tempId,
      name,
      accessCode: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 0,
      products: [],
      users: [],
    })

    if (navigator.onLine) {
      try {
        const created = await listService.create({ name })
        await db.shoppingLists.update(tempId, {
          id: created.id,
          version: created.version,
          synced: true,
        })
        const idx = lists.value.findIndex((l) => l.id === tempId)
        if (idx !== -1) lists.value[idx] = { ...lists.value[idx], id: created.id, version: created.version }
        return created
      } catch (e) {
        await syncService.addToQueue('create', 'list', tempId, { name })
      }
    } else {
      await syncService.addToQueue('create', 'list', tempId, { name })
    }

    return lists.value.find((l) => l.id === tempId)
  }

  async function updateList(id: string, payload: Partial<ShoppingList>) {
    const now = new Date().toISOString()
    const localList = await db.shoppingLists.get(id)

    if (localList) {
      const updateData: Partial<DbShoppingList> = {
        lastModified: now,
        synced: false,
      }
      if (payload.name !== undefined) updateData.name = payload.name
      if (payload.accessCode !== undefined) updateData.accessCode = payload.accessCode ?? undefined
      await db.shoppingLists.update(id, updateData)
    }

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
      } catch (e) {
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
      } catch (e) {
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
  }
}
