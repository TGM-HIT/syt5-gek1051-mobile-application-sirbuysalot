<template>
  <v-slide-y-transition>
    <v-banner
      v-if="!isOnline"
      color="warning"
      icon="mdi-wifi-off"
      density="compact"
      class="offline-banner"
    >
      <template #text>
        Du bist offline. Aenderungen werden lokal gespeichert und bei Verbindung synchronisiert.
      </template>
    </v-banner>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
</script>

<style scoped>
.offline-banner {
  position: sticky;
  top: 64px;
  z-index: 100;
}
</style>
