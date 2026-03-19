import { ref } from 'vue'

const STORAGE_KEY = 'sirbuysalot_user'

interface LocalUser {
  displayName: string
}

function loadUser(): LocalUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LocalUser
  } catch {
    return null
  }
}

const user = ref<LocalUser | null>(loadUser())

export function useUser() {
  function setDisplayName(name: string) {
    user.value = { displayName: name }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user,
    displayName: () => user.value?.displayName ?? 'Anonym',
    isLoggedIn: () => user.value !== null,
    setDisplayName,
    clearUser,
  }
}
