import { ref } from 'vue'
import { listService } from '@/services/listService'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const deletedLists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useShoppingLists() {
  async function fetchLists() {
    loading.value = true
    error.value = null
    try {
      lists.value = await listService.getAll()
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der Listen'
    } finally {
      loading.value = false
    }
  }

  async function createList(name: string) {
    const created = await listService.create({ name })
    lists.value.unshift(created)
    return created
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

  async function fetchDeletedLists() {
    try {
      deletedLists.value = await listService.getDeleted()
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der geloeschten Listen'
    }
  }

  async function restoreList(id: string) {
    const restored = await listService.restore(id)
    deletedLists.value = deletedLists.value.filter((l) => l.id !== id)
    lists.value.unshift(restored)
    return restored
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
  }
}
