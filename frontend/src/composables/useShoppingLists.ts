import { ref } from 'vue'
import { listService } from '@/services/listService'
import { db } from '@/db'
import type { ShoppingList as DexieList } from '@/db'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function toApiList(local: DexieList): ShoppingList {
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
        const remote = await listService.getAll()
        for (const list of remote) {
          await db.shoppingLists.put({
            id: list.id,
            name: list.name,
            accessCode: list.accessCode ?? undefined,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
            deletedAt: list.deletedAt ?? undefined,
            version: list.version,
            synced: true,
          })
        }
        lists.value = remote
      } else {
        const local = await db.shoppingLists.filter((l) => !l.deletedAt).toArray()
        lists.value = local.map(toApiList)
      }
    } catch {
      // Fallback to local cache on network error
      try {
        const local = await db.shoppingLists.filter((l) => !l.deletedAt).toArray()
        lists.value = local.map(toApiList)
        if (local.length === 0) {
          error.value = 'Keine Verbindung zum Server'
        }
      } catch (e: any) {
        error.value = e.message ?? 'Fehler beim Laden der Listen'
      }
    } finally {
      loading.value = false
    }
  }

  async function createList(name: string): Promise<ShoppingList> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // 1. Offline-First: lokal speichern mit synced: false
    await db.shoppingLists.add({
      id,
      name,
      createdAt: now,
      updatedAt: now,
      version: 1,
      synced: false,
    })

    // 2. Sofort reaktiv in der Liste anzeigen
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

    // 3. Wenn online: per POST /api/lists synchronisieren
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
        // Bleibt als synced: false – wird beim nächsten Online-Gang nachgeholt
      }
    }

    return localList
  }

  async function syncPendingLists(): Promise<void> {
    const unsynced = await db.shoppingLists.filter((l) => !l.synced && !l.deletedAt).toArray()
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
    const updated = await listService.update(id, payload)
    const idx = lists.value.findIndex((l) => l.id === id)
    if (idx !== -1) lists.value[idx] = updated
    return updated
  }

  async function removeList(id: string) {
    await listService.remove(id)
    lists.value = lists.value.filter((l) => l.id !== id)
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
