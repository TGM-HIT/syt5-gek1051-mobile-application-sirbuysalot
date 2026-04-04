import { ref } from 'vue'

const STORAGE_KEY = 'sirbuysalot_user'
const LISTS_KEY = 'sirbuysalot_my_lists'

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

function loadMyListIds(): string[] {
  const raw = localStorage.getItem(LISTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

const user = ref<LocalUser | null>(loadUser())
const myListIds = ref<string[]>(loadMyListIds())

export function useUser() {
  function setDisplayName(name: string) {
    user.value = { displayName: name }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function addMyList(listId: string) {
    if (!myListIds.value.includes(listId)) {
      myListIds.value.push(listId)
      localStorage.setItem(LISTS_KEY, JSON.stringify(myListIds.value))
    }
  }

  function removeMyList(listId: string) {
    myListIds.value = myListIds.value.filter((id) => id !== listId)
    localStorage.setItem(LISTS_KEY, JSON.stringify(myListIds.value))
  }

  return {
    user,
    myListIds,
    displayName: () => user.value?.displayName ?? 'Anonym',
    isLoggedIn: () => user.value !== null,
    setDisplayName,
    clearUser,
    addMyList,
    removeMyList,
  }
}
