import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tagService } from '@/services/tagService'
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

describe('tagService', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAll fetches tags for a list', async () => {
    const tags = [{ id: 't1', name: 'Urgent' }]
    vi.mocked(api.get).mockResolvedValue({ data: tags })

    const result = await tagService.getAll(listId)

    expect(api.get).toHaveBeenCalledWith(`/lists/${listId}/tags`)
    expect(result).toEqual(tags)
  })

  it('create posts a new tag', async () => {
    const tag = { id: 't1', name: 'Dairy' }
    vi.mocked(api.post).mockResolvedValue({ data: tag })

    const result = await tagService.create(listId, 'Dairy')

    expect(api.post).toHaveBeenCalledWith(`/lists/${listId}/tags`, { name: 'Dairy' })
    expect(result).toEqual(tag)
  })

  it('update puts tag changes', async () => {
    const tag = { id: 't1', name: 'Updated' }
    vi.mocked(api.put).mockResolvedValue({ data: tag })

    const result = await tagService.update(listId, 't1', 'Updated')

    expect(api.put).toHaveBeenCalledWith(`/lists/${listId}/tags/t1`, { name: 'Updated' })
    expect(result).toEqual(tag)
  })

  it('remove deletes a tag', async () => {
    vi.mocked(api.delete).mockResolvedValue({})

    await tagService.remove(listId, 't1')

    expect(api.delete).toHaveBeenCalledWith(`/lists/${listId}/tags/t1`)
  })

  it('setProductTags patches product tags', async () => {
    const response = { tagIds: ['t1', 't2'] }
    vi.mocked(api.patch).mockResolvedValue({ data: response })

    const result = await tagService.setProductTags(listId, 'p1', ['t1', 't2'])

    expect(api.patch).toHaveBeenCalledWith(`/lists/${listId}/products/p1/tags`, {
      tagIds: ['t1', 't2'],
    })
    expect(result).toEqual(response)
  })

  it('create with empty name still sends request', async () => {
    const tag = { id: 't1', name: '' }
    vi.mocked(api.post).mockResolvedValue({ data: tag })

    const result = await tagService.create(listId, '')

    expect(api.post).toHaveBeenCalledWith(`/lists/${listId}/tags`, { name: '' })
    expect(result).toEqual(tag)
  })

  it('getAll returns empty array when no tags exist', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    const result = await tagService.getAll(listId)

    expect(result).toEqual([])
  })

  it('getAll propagates network error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

    await expect(tagService.getAll(listId)).rejects.toThrow('Network error')
  })
})
