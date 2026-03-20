import { vi } from 'vitest'

Object.defineProperty(navigator, 'onLine', {
  get() { return this._isOnline ?? true },
  set(value) { this._isOnline = value },
  configurable: true
})

Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  },
  configurable: true
})

global.fetch = vi.fn()

vi.mock('@/db', () => {
  const storage = new Map<number, any>()
  let idCounter = 0

  const createTable = () => ({
    add: vi.fn(async (item) => {
      const id = ++idCounter
      storage.set(id, { ...item, id })
      return id
    }),
    get: vi.fn(async (id) => storage.get(id)),
    put: vi.fn(async (item) => {
      const id = item.id || ++idCounter
      storage.set(id, { ...item, id })
      return id
    }),
    update: vi.fn(async (id, changes) => {
      const existing = storage.get(id)
      if (existing) {
        storage.set(id, { ...existing, ...changes })
      }
    }),
    delete: vi.fn(async (id) => storage.delete(id)),
    toArray: vi.fn(async () => Array.from(storage.values())),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => Array.from(storage.values()).filter(i => i.synced === false)),
        count: vi.fn(async () => Array.from(storage.values()).filter(i => i.synced === false).length),
      })),
      above: vi.fn(() => ({
        filter: vi.fn(async () => Array.from(storage.values()).filter(i => i.synced === true)),
      })),
    })),
    clear: vi.fn(async () => storage.clear()),
    count: vi.fn(async () => storage.size),
  })

  return {
    db: {
      shoppingLists: createTable(),
      products: createTable(),
      tags: createTable(),
      productTags: createTable(),
      syncQueue: createTable(),
      delete: vi.fn(),
      open: vi.fn(),
    },
  }
})
