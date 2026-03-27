# Prompt: Dark Mode Implementation with Vuetify 3

## When
Early April 2026, during US-18 implementation

## Context
We needed a dark mode toggle for our shopping list PWA. The team was debating between a system-preference-only approach vs user-toggleable. We went with user-toggleable because it's more flexible and the user story said "aktivieren koennen".

## Prompt (sinngemäß)
"Ich baue an einer Vue 3 + Vuetify 3 PWA für Einkaufslisten. Wir brauchen einen Dark Mode Toggle. Wie implementiert man das am besten mit Vuetify 3? Soll ich die Theme-Konfiguration in vuetify.ts ändern oder einen eigenen Composable bauen? Und wie persistiere ich die Einstellung am besten?"

## Ergebnis
- Neuer Composable `useDarkMode.ts`:
  ```typescript
  import { ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  
  const STORAGE_KEY = 'sirbuysalot_darkmode'
  
  export function useDarkMode() {
    const theme = useTheme()
    const isDark = ref(false)
    
    function toggle() {
      isDark.value = !isDark.value
      theme.global.name.value = isDark.value ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark.value))
    }
    
    function init() {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        isDark.value = JSON.parse(stored)
      } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      theme.global.name.value = isDark.value ? 'dark' : 'light'
      
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          isDark.value = e.matches
          theme.global.name.value = isDark.value ? 'dark' : 'light'
        }
      })
    }
    
    return { isDark, toggle, init }
  }
  ```

- Theme-Konfiguration in vuetify.ts mit dark-Support
- Toggle-Button in der App-Bar oder Settings
- Persistenz über localStorage

## Was wir daraus mitgenommen haben
Vuetify 3 macht Dark Mode relatively einfach über das Theme-System. Der Composable-Ansatz ist sauber weil die Logik gekapselt ist. Die Medienabfrage für System-Präferenz sollte nur als Fallback verwendet werden wenn der User noch keine explizite Wahl getroffen hat.

## Key Takeaways
- `useTheme()` aus vuetify, nicht selbst implementieren
- Theme-Objekt: `theme.global.name.value = 'dark'`
- localStorage für Persistenz, System-Präferenz nur als Fallback
- Event-Listener für `change` Event der matchMedia wichtig für Edge Cases
