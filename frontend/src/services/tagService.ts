import api from './api'
import type { Tag } from '@/types'

export const tagService = {
  async getAll(listId: string): Promise<Tag[]> {
    const { data } = await api.get<Tag[]>(`/lists/${listId}/tags`)
    return data
  },

  async create(listId: string, name: string): Promise<Tag> {
    const { data } = await api.post<Tag>(`/lists/${listId}/tags`, { name })
    return data
  },

  async update(listId: string, tagId: string, name: string): Promise<Tag> {
    const { data } = await api.put<Tag>(`/lists/${listId}/tags/${tagId}`, { name })
    return data
  },

  async remove(listId: string, tagId: string): Promise<void> {
    await api.delete(`/lists/${listId}/tags/${tagId}`)
  },

  async setProductTags(listId: string, productId: string, tagIds: string[]): Promise<any> {
    const { data } = await api.patch(`/lists/${listId}/products/${productId}/tags`, { tagIds })
    return data
  },
}
