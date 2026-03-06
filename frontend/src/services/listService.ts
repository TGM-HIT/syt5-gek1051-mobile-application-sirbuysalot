import api from './api'
import type { ShoppingList, CreateListPayload } from '@/types'

export const listService = {
  async getAll(): Promise<ShoppingList[]> {
    const { data } = await api.get<ShoppingList[]>('/lists')
    return data
  },

  async getById(id: string): Promise<ShoppingList> {
    const { data } = await api.get<ShoppingList>(`/lists/${id}`)
    return data
  },

  async create(payload: CreateListPayload): Promise<ShoppingList> {
    const { data } = await api.post<ShoppingList>('/lists', payload)
    return data
  },

  async update(id: string, payload: Partial<ShoppingList>): Promise<ShoppingList> {
    const { data } = await api.put<ShoppingList>(`/lists/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/lists/${id}`)
  },
}
