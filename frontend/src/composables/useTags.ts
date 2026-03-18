import { ref } from 'vue'
import { tagService } from '@/services/tagService'
import type { Tag } from '@/types'

export function useTags(listId: string) {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  async function fetchTags() {
    loading.value = true
    try {
      tags.value = await tagService.getAll(listId)
    } catch {
      // silent fail, tags are optional
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
