import { describe, it, expect, beforeEach } from 'vitest'
import { useUser } from '@/composables/useUser'

describe('useUser', () => {
  beforeEach(() => {
    localStorage.clear()
    const { clearUser } = useUser()
    clearUser()
  })

  it('returns anonymous when no user is set', () => {
    const { displayName, isLoggedIn } = useUser()

    expect(isLoggedIn()).toBe(false)
    expect(displayName()).toBe('Anonym')
  })

  it('setDisplayName persists the user', () => {
    const { setDisplayName, displayName, isLoggedIn } = useUser()

    setDisplayName('Alice')

    expect(displayName()).toBe('Alice')
    expect(isLoggedIn()).toBe(true)
    expect(localStorage.getItem('sirbuysalot_user')).toContain('Alice')
  })

  it('clearUser removes the user', () => {
    const { setDisplayName, clearUser, isLoggedIn } = useUser()

    setDisplayName('Alice')
    clearUser()

    expect(isLoggedIn()).toBe(false)
    expect(localStorage.getItem('sirbuysalot_user')).toBeNull()
  })

  it('displayName returns the saved name', () => {
    const { setDisplayName, displayName } = useUser()

    setDisplayName('Bob')

    expect(displayName()).toBe('Bob')
  })
})
