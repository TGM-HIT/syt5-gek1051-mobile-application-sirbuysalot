# Prompt: Online-Status erkennen mit navigator.onLine

## Wann
Maerz 2026, als wir mit US-12 angefangen haben

## Kontext
Wir mussten wissen ob der User gerade Online oder Offline ist. Die App sollte ihm das anzeigen und nur dann Sync-Versuche starten wenn er wirklich Online ist.

## Prompt (exact wording)
"I need to detect when my Vue 3 PWA goes online or offline. I know `navigator.onLine` exists but I've heard it's unreliable. Is there a better way? How do I make sure the sync starts automatically when the user comes back online?"

## Ergebnis
- Einfaches Composable das beide Events trackt:
  ```typescript
  export function useOnlineStatus() {
    const isOnline = ref(navigator.onLine)
    
    const update = () => { isOnline.value = navigator.onLine }
    
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    
    onUnmounted(() => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    })
    
    return { isOnline }
  }
  ```

- OfflineBanner.vue Komponente die in App.vue eingebunden wird:
  ```vue
  <v-banner v-if="!isOnline" lines="one" icon="mdi-wifi-off" color="warning">
    Du bist offline. Aenderungen werden automatisch synchronisiert wenn du wieder online bist.
  </v-banner>
  ```

- SyncTrigger: Watch auf `isOnline` und `when(true)` -> Sync starten
  ```typescript
  watch(isOnline, (online) => {
    if (online) syncPendingChanges()
  })
  ```

## Was wir daraus mitgenommen haben
`navigator.onLine` ist fuer die meisten Faelle gut genug. Die Ungenauigkeit besteht darin dass es nur sagt ob ein Network-Request moeglich waere, nicht ob der Backend-Server wirklich antwortet. Aber das ist OK weil:
1. Wenn `navigator.onLine` true ist, machen wir den Sync-Call
2. Wenn der Call fehlschlaegt, bleibt die Aenderung in pendingChanges
3. Beim naechsten `online`-Event versuchen wir es erneut

Das Retry-Logik im Batch-Sync-Endpoint kuemmert sich um fehlgeschlagene Einzel-Requests.

## Key Takeaways
- `navigator.onLine` + `online`/`offline` Events reichen fuer PWA
- Watch auf isOnline fuer automatischen Sync-Trigger
- OfflineBanner UI gibt dem User Feedback
- pendingChanges in IndexedDB garantieren dass nichts verloren geht
