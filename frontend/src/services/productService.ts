import api from './api'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

export const productService = {
  async getAll(listId: string): Promise<Product[]> {
    const { data } = await api.get<Product[]>(`/lists/${listId}/products`)
    return data
  },

  async create(listId: string, payload: CreateProductPayload): Promise<Product> {
    const { data } = await api.post<Product>(`/lists/${listId}/products`, payload)
    return data
  },

  async update(listId: string, productId: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await api.put<Product>(`/lists/${listId}/products/${productId}`, payload)
    return data
  },

  async togglePurchase(listId: string, productId: string, purchasedBy: string): Promise<Product> {
    const { data } = await api.patch<Product>(`/lists/${listId}/products/${productId}/purchase`, { purchasedBy })
    return data
  },

  async remove(listId: string, productId: string): Promise<void> {
    await api.delete(`/lists/${listId}/products/${productId}`)
  },
}
