import api from './api'
import type { AppUser } from '@/types'

export const userService = {
  async getUsers(listId: string): Promise<AppUser[]> {
    const { data } = await api.get<AppUser[]>(`/lists/${listId}/users`)
    return data
  },

  async joinList(listId: string, displayName: string): Promise<AppUser> {
    const { data } = await api.post<AppUser>(`/lists/${listId}/users`, { displayName })
    return data
  },
}
