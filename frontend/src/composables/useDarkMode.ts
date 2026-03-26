import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'

const STORAGE_KEY = 'sirbuysalot-darkmode'
const isDark = ref(false)

export function useDarkMode() {
  const theme = useTheme()

  function applyTheme() {
    theme.global.name.value = isDark.value ? 'dark' : 'light'
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark.value))
    applyTheme()
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isDark.value = JSON.parse(stored)
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        isDark.value = e.matches
        applyTheme()
      }
    })
  })

  watch(isDark, () => applyTheme())

  return { isDark, toggle }
}
