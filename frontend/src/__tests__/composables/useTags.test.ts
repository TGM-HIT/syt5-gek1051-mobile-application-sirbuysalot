import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTags } from '@/composables/useTags'
import { tagService } from '@/services/tagService'
import type { Tag } from '@/types'

vi.mock('@/services/tagService', () => ({
  tagService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setProductTags: vi.fn(),
  },
}))

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 't1',
    name: 'Dairy',
    ...overrides,
  }
}

describe('useTags', () => {
  const listId = 'list-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchTags populates tags', async () => {
    const mockTags = [makeTag()]
    vi.mocked(tagService.getAll).mockResolvedValue(mockTags)

    const { tags, fetchTags } = useTags(listId)
    await fetchTags()

    expect(tagService.getAll).toHaveBeenCalledWith(listId)
    expect(tags.value).toEqual(mockTags)
  })

  it('fetchTags sets loading state', async () => {
    vi.mocked(tagService.getAll).mockResolvedValue([])

    const { loading, fetchTags } = useTags(listId)

    const promise = fetchTags()
    expect(loading.value).toBe(true)

    await promise
    expect(loading.value).toBe(false)
  })

  it('fetchTags silently handles errors', async () => {
    vi.mocked(tagService.getAll).mockRejectedValue(new Error('Network error'))

    const { tags, loading, fetchTags } = useTags(listId)
    await fetchTags()

    // Tags remain empty, loading is reset, no error thrown
    expect(tags.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('createTag appends to tags', async () => {
    const created = makeTag({ id: 't2', name: 'Fruits' })
    vi.mocked(tagService.create).mockResolvedValue(created)

    const { tags, createTag } = useTags(listId)
    const result = await createTag('Fruits')

    expect(tagService.create).toHaveBeenCalledWith(listId, 'Fruits')
    expect(result).toEqual(created)
    expect(tags.value).toContainEqual(created)
  })

  it('updateTag replaces the tag in the array', async () => {
    const original = makeTag()
    const updated = makeTag({ name: 'Organic Dairy' })
    vi.mocked(tagService.update).mockResolvedValue(updated)

    const { tags, updateTag } = useTags(listId)
    tags.value = [original]
    await updateTag('t1', 'Organic Dairy')

    expect(tagService.update).toHaveBeenCalledWith(listId, 't1', 'Organic Dairy')
    expect(tags.value[0].name).toBe('Organic Dairy')
  })

  it('removeTag filters out the tag', async () => {
    vi.mocked(tagService.remove).mockResolvedValue()

    const { tags, removeTag } = useTags(listId)
    tags.value = [makeTag()]
    await removeTag('t1')

    expect(tagService.remove).toHaveBeenCalledWith(listId, 't1')
    expect(tags.value).toHaveLength(0)
  })

  it('setProductTags delegates to tagService', async () => {
    const response = { tagIds: ['t1', 't2'] }
    vi.mocked(tagService.setProductTags).mockResolvedValue(response)

    const { setProductTags } = useTags(listId)
    const result = await setProductTags('p1', ['t1', 't2'])

    expect(tagService.setProductTags).toHaveBeenCalledWith(listId, 'p1', ['t1', 't2'])
    expect(result).toEqual(response)
  })

  it('createTag with empty string sends empty name', async () => {
    const created = makeTag({ id: 't3', name: '' })
    vi.mocked(tagService.create).mockResolvedValue(created)

    const { createTag } = useTags(listId)
    const result = await createTag('')

    expect(tagService.create).toHaveBeenCalledWith(listId, '')
    expect(result.name).toBe('')
  })
})
