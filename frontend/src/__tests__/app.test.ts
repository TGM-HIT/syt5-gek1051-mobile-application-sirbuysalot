import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('smoke test - app module loads', async () => {
    const types = await import('@/types')
    expect(types).toBeDefined()
  })
})
