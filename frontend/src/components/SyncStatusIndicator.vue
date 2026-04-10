<template>
  <div class="sync-indicator">
    <v-chip
      v-if="pendingCount > 0"
      size="small"
      :color="syncing ? 'info' : 'warning'"
      variant="tonal"
      class="mr-2"
    >
      <v-progress-circular
        v-if="syncing"
        indeterminate
        size="14"
        width="2"
        class="mr-1"
      />
      <v-icon v-else icon="mdi-cloud-upload-outline" size="small" class="mr-1" />
      {{ syncing ? 'Synchronisiert...' : `${pendingCount} ausstehend` }}
    </v-chip>

    <v-tooltip :text="connectionText" location="bottom">
      <template #activator="{ props }">
        <v-icon
          v-bind="props"
          :icon="connectionIcon"
          :color="connectionColor"
          size="small"
        />
      </template>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { syncService } from '@/services/syncService'
import { websocketService } from '@/services/websocketService'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const props = defineProps<{
  listId: string
}>()

const { isOnline } = useOnlineStatus()
const pendingCount = ref(0)
const syncing = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const wsConnected = websocketService.connected

const connectionIcon = computed(() => {
  if (!isOnline.value) return 'mdi-cloud-off-outline'
  if (wsConnected.value) return 'mdi-cloud-check'
  return 'mdi-cloud-outline'
})

const connectionColor = computed(() => {
  if (!isOnline.value) return 'grey'
  if (wsConnected.value) return 'success'
  return 'warning'
})

const connectionText = computed(() => {
  if (!isOnline.value) return 'Offline'
  if (wsConnected.value) return 'Echtzeit verbunden'
  return 'Nur REST-Verbindung'
})

async function updatePendingCount() {
  pendingCount.value = await syncService.getPendingCount()
}

async function syncNow() {
  if (!isOnline.value || syncing.value || pendingCount.value === 0) return

  syncing.value = true
  try {
    await syncService.syncPendingChanges(props.listId)
    await updatePendingCount()
  } catch {
    // Sync failed, will retry later
  } finally {
    syncing.value = false
  }
}

watch(isOnline, (online) => {
  if (online) {
    syncNow()
  }
})

onMounted(() => {
  updatePendingCount()
  pollTimer = setInterval(updatePendingCount, 2000)

  // Connect WebSocket for this list
  if (isOnline.value) {
    websocketService.connect(props.listId)
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  websocketService.disconnect()
})
</script>

<style scoped>
.sync-indicator {
  display: flex;
  align-items: center;
}
</style>
