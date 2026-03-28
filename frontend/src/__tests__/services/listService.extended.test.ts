import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listService } from '@/services/listService'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('listService (extended)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('joinByCode fetches list by access code', async () => {
    const list = { id: '1', name: 'Groceries', accessCode: 'abc12345' }
    vi.mocked(api.get).mockResolvedValue({ data: list })

    const result = await listService.joinByCode('abc12345')

    expect(api.get).toHaveBeenCalledWith('/lists/join/abc12345')
    expect(result).toEqual(list)
  })

  it('joinByCode propagates 404 error', async () => {
    const error = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })
    vi.mocked(api.get).mockRejectedValue(error)

    await expect(listService.joinByCode('invalid')).rejects.toThrow('Not Found')
  })

  it('getDeleted fetches soft-deleted lists', async () => {
    const deleted = [{ id: '1', name: 'Old List', deletedAt: '2025-01-01' }]
    vi.mocked(api.get).mockResolvedValue({ data: deleted })

    const result = await listService.getDeleted()

    expect(api.get).toHaveBeenCalledWith('/lists/deleted')
    expect(result).toEqual(deleted)
  })

  it('restore patches a deleted list back', async () => {
    const restored = { id: '1', name: 'Groceries', deletedAt: null }
    vi.mocked(api.patch).mockResolvedValue({ data: restored })

    const result = await listService.restore('1')

    expect(api.patch).toHaveBeenCalledWith('/lists/1/restore')
    expect(result).toEqual(restored)
  })

  it('duplicate creates a copy of a list', async () => {
    const duplicated = { id: '2', name: 'Groceries (copy)', accessCode: 'xyz99999' }
    vi.mocked(api.post).mockResolvedValue({ data: duplicated })

    const result = await listService.duplicate('1')

    expect(api.post).toHaveBeenCalledWith('/lists/1/duplicate')
    expect(result).toEqual(duplicated)
  })

  it('getAll propagates network error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

    await expect(listService.getAll()).rejects.toThrow('Network error')
  })

  it('remove propagates 404 error', async () => {
    const error = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })
    vi.mocked(api.delete).mockRejectedValue(error)

    await expect(listService.remove('nonexistent')).rejects.toThrow('Not Found')
  })

  it('create with empty name sends the request', async () => {
    const error = Object.assign(new Error('Bad Request'), {
      response: { status: 400 },
    })
    vi.mocked(api.post).mockRejectedValue(error)

    await expect(listService.create({ name: '' })).rejects.toThrow('Bad Request')
  })
})
