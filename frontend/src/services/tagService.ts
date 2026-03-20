import api from './api'
import { db } from '@/db'
import { syncService } from './syncService'
import type { Tag } from '@/types'

export const tagService = {
  async getAll(listId: string): Promise<Tag[]> {
    const { data } = await api.get<Tag[]>(`/lists/${listId}/tags`)
    return data
  },

  async create(listId: string, payload: { name: string }): Promise<Tag> {
    const { data } = await api.post<Tag>(`/lists/${listId}/tags`, payload)
    return data
  },

  async update(listId: string, tagId: string, payload: { name: string }): Promise<Tag> {
    const { data } = await api.put<Tag>(`/lists/${listId}/tags/${tagId}`, payload)
    return data
  },

  async delete(listId: string, tagId: string): Promise<void> {
    await api.delete(`/lists/${listId}/tags/${tagId}`)
  },

  async syncTags(listId: string): Promise<void> {
    if (!navigator.onLine) return

    try {
      const serverTags = await this.getAll(listId)
      await db.tags.where('listId').equals(listId).delete()
      for (const tag of serverTags) {
        await db.tags.put({
          id: tag.id,
          name: tag.name,
          listId,
        })
      }
    } catch (e) {
      const localTags = await db.tags.where('listId').equals(listId).toArray()
      if (localTags.length === 0) {
        throw e
      }
    }
  },
}
