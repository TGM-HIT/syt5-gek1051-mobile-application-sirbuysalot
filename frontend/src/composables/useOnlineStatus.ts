import { ref, watch, onMounted, onUnmounted } from 'vue'
import { syncService } from '@/services/syncService'

const isOnline = ref(navigator.onLine)
const pendingSyncCount = ref(0)

let updateInterval: ReturnType<typeof setInterval> | null = null

function handleOnline() {
  isOnline.value = true
}

function handleOffline() {
  isOnline.value = false
}

export function useOnlineStatus() {
  async function updatePendingCount() {
    pendingSyncCount.value = await syncService.getPendingCount()
  }

  async function triggerSync() {
    if (!isOnline.value) return
    await syncService.processQueue()
    await updatePendingCount()
  }

  watch(isOnline, async (online) => {
    if (online) {
      await triggerSync()
    }
  })

  return {
    isOnline,
    pendingSyncCount,
    updatePendingCount,
    triggerSync,
  }
}

export function initOnlineStatus() {
  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    syncService.getPendingCount().then((count) => {
      pendingSyncCount.value = count
    })
    
    updateInterval = setInterval(async () => {
      if (isOnline.value) {
        const count = await syncService.getPendingCount()
        if (count > 0) {
          await syncService.processQueue()
          pendingSyncCount.value = await syncService.getPendingCount()
        }
      } else {
        pendingSyncCount.value = await syncService.getPendingCount()
      }
    }, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })
}
