<template>
  <div class="p2p-status">
    <v-chip
      v-if="connected"
      size="small"
      :color="peerCount > 0 ? 'success' : 'info'"
      variant="tonal"
      class="mr-2"
    >
      <v-icon icon="mdi-access-point" size="small" class="mr-1" />
      P2P {{ peerCount > 0 ? `(${peerCount})` : '' }}
    </v-chip>

    <v-dialog v-model="showConnect" max-width="400">
      <template #activator="{ props }">
        <v-btn
          v-if="connected"
          v-bind="props"
          icon="mdi-link-plus"
          variant="text"
          size="x-small"
          color="primary"
        />
      </template>
      <v-card class="pa-2">
        <v-card-title class="text-h6 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-access-point-network" color="primary" class="mr-2" />
          Peer verbinden
        </v-card-title>
        <v-card-text class="px-6">
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">Deine Peer-ID:</div>
            <v-text-field
              :model-value="peerId ?? ''"
              readonly
              density="compact"
              hide-details
              variant="outlined"
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyPeerId"
            />
          </div>
          <v-text-field
            v-model="remotePeerInput"
            label="Peer-ID eingeben"
            density="compact"
            hide-details
            variant="outlined"
            placeholder="sirbuysalot-..."
            @keyup.enter="onConnect"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showConnect = false">Schliessen</v-btn>
          <v-btn color="primary" :disabled="!remotePeerInput.trim()" @click="onConnect">
            Verbinden
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'

const props = defineProps<{
  peerId: Ref<string | null> | string | null
  connected: Ref<boolean> | boolean
  peerCount: Ref<number> | number
}>()

const emit = defineEmits<{
  connect: [peerId: string]
}>()

const showConnect = ref(false)
const remotePeerInput = ref('')

function copyPeerId() {
  const id = typeof props.peerId === 'object' && props.peerId !== null
    ? (props.peerId as Ref<string | null>).value
    : props.peerId
  if (id) navigator.clipboard.writeText(id)
}

function onConnect() {
  const id = remotePeerInput.value.trim()
  if (id) {
    emit('connect', id)
    remotePeerInput.value = ''
    showConnect.value = false
  }
}
</script>

<style scoped>
.p2p-status {
  display: inline-flex;
  align-items: center;
}
</style>
