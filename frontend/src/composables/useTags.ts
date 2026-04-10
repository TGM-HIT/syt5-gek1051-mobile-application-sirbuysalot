import { ref } from 'vue'
import { tagService } from '@/services/tagService'
import { db } from '@/db'
import type { Tag } from '@/types'

export function useTags(listId: string) {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  async function cacheTags(items: Tag[]) {
    await db.tags.where('listId').equals(listId).delete()
    const dbTags = items.map((t) => ({ id: t.id, name: t.name, listId }))
    if (dbTags.length > 0) {
      await db.tags.bulkPut(dbTags)
    }
  }

  async function loadFromCache(): Promise<Tag[]> {
    const cached = await db.tags.where('listId').equals(listId).toArray()
    return cached.map((t) => ({ id: t.id!, name: t.name }))
  }

  async function fetchTags() {
    loading.value = true
    try {
      tags.value = await tagService.getAll(listId)
      await cacheTags(tags.value)
    } catch {
      if (!navigator.onLine) {
        tags.value = await loadFromCache()
      }
    } finally {
      loading.value = false
    }
  }

  async function createTag(name: string) {
    const created = await tagService.create(listId, name)
    tags.value.push(created)
    return created
  }

  async function updateTag(tagId: string, name: string) {
    const updated = await tagService.update(listId, tagId, name)
    const idx = tags.value.findIndex((t) => t.id === tagId)
    if (idx !== -1) tags.value[idx] = updated
    return updated
  }

  async function removeTag(tagId: string) {
    await tagService.remove(listId, tagId)
    tags.value = tags.value.filter((t) => t.id !== tagId)
  }

  async function setProductTags(productId: string, tagIds: string[]) {
    return await tagService.setProductTags(listId, productId, tagIds)
  }

  return {
    tags,
    loading,
    fetchTags,
    createTag,
    updateTag,
    removeTag,
    setProductTags,
  }
}
