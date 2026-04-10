import { ref } from 'vue'
import { listService } from '@/services/listService'
import { useUser } from '@/composables/useUser'
import { db } from '@/db'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const deletedLists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useShoppingLists() {
  const { myListIds, addMyList } = useUser()

  let initialLoad = true

  async function cacheLists(items: ShoppingList[]) {
    for (const list of items) {
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
  }

  async function loadFromCache(): Promise<ShoppingList[]> {
    const cached = await db.shoppingLists
      .filter((l) => !l.deletedAt && myListIds.value.includes(l.id!))
      .toArray()
    return cached.map((l) => ({
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

  async function fetchLists() {
    if (initialLoad) {
      loading.value = true
    }
    error.value = null
    try {
      const all = await listService.getAll()
      lists.value = all.filter((l) => myListIds.value.includes(l.id))
      await cacheLists(lists.value)
    } catch (e: any) {
      if (!navigator.onLine) {
        const cached = await loadFromCache()
        if (cached.length > 0 || lists.value.length === 0) {
          lists.value = cached
        }
      } else {
        error.value = e.message ?? 'Fehler beim Laden der Listen'
      }
    } finally {
      loading.value = false
      initialLoad = false
    }
  }

  async function createList(name: string) {
    const created = await listService.create({ name })
    addMyList(created.id)
    await fetchLists()
    return created
  }

  async function updateList(id: string, payload: Partial<ShoppingList>) {
    const updated = await listService.update(id, payload)
    await fetchLists()
    return updated
  }

  async function removeList(id: string) {
    await listService.remove(id)
    await fetchLists()
  }

  async function fetchDeletedLists() {
    try {
      deletedLists.value = await listService.getDeleted()
    } catch {
      // silent when offline
    }
  }

  async function restoreList(id: string) {
    const restored = await listService.restore(id)
    addMyList(restored.id)
    deletedLists.value = deletedLists.value.filter((l) => l.id !== id)
    lists.value.unshift(restored)
    return restored
  }

  async function duplicateList(id: string) {
    const duplicated = await listService.duplicate(id)
    addMyList(duplicated.id)
    lists.value.unshift(duplicated)
    return duplicated
  }

  return {
    lists,
    deletedLists,
    loading,
    error,
    fetchLists,
    createList,
    updateList,
    removeList,
    fetchDeletedLists,
    restoreList,
    duplicateList,
  }
}
