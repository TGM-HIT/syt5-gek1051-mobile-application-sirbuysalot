import { ref } from 'vue'
import { listService } from '@/services/listService'
import type { ShoppingList } from '@/types'

const lists = ref<ShoppingList[]>([])
const deletedLists = ref<ShoppingList[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useShoppingLists() {
  async function fetchLists() {
    if (lists.value.length === 0) {
      loading.value = true
    }
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
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der gelöschten Listen'
    }
  }

  async function restoreList(id: string) {
    const restored = await listService.restore(id)
    deletedLists.value = deletedLists.value.filter((l) => l.id !== id)
    lists.value.unshift(restored)
    return restored
  }

  async function duplicateList(id: string) {
    const duplicated = await listService.duplicate(id)
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
