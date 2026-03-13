import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listService } from '@/services/listService'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('listService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAll fetches all lists', async () => {
    const lists = [{ id: '1', name: 'Groceries' }]
    vi.mocked(api.get).mockResolvedValue({ data: lists })

    const result = await listService.getAll()

    expect(api.get).toHaveBeenCalledWith('/lists')
    expect(result).toEqual(lists)
  })

  it('getById fetches a single list', async () => {
    const list = { id: '1', name: 'Groceries' }
    vi.mocked(api.get).mockResolvedValue({ data: list })

    const result = await listService.getById('1')

    expect(api.get).toHaveBeenCalledWith('/lists/1')
    expect(result).toEqual(list)
  })

  it('create posts a new list', async () => {
    const list = { id: '1', name: 'Groceries', accessCode: 'abc12345' }
    vi.mocked(api.post).mockResolvedValue({ data: list })

    const result = await listService.create({ name: 'Groceries' })

    expect(api.post).toHaveBeenCalledWith('/lists', { name: 'Groceries' })
    expect(result).toEqual(list)
  })

  it('update puts list changes', async () => {
    const list = { id: '1', name: 'Updated' }
    vi.mocked(api.put).mockResolvedValue({ data: list })

    const result = await listService.update('1', { name: 'Updated' })

    expect(api.put).toHaveBeenCalledWith('/lists/1', { name: 'Updated' })
    expect(result).toEqual(list)
  })

  it('remove deletes a list', async () => {
    vi.mocked(api.delete).mockResolvedValue({})

    await listService.remove('1')

    expect(api.delete).toHaveBeenCalledWith('/lists/1')
  })
})
