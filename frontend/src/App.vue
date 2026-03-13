<template>
  <v-app>
    <v-app-bar elevation="0" class="app-bar-gradient">
      <template #prepend>
        <v-avatar color="white" size="36" class="ml-2">
          <v-icon color="primary" icon="mdi-cart" />
        </v-avatar>
      </template>

      <v-app-bar-title>
        <router-link to="/" class="text-white text-decoration-none font-weight-bold">
          SirBuysALot
        </router-link>
      </v-app-bar-title>

      <template #append>
        <v-btn
          v-if="!isLoggedIn()"
          variant="outlined"
          color="white"
          size="small"
          rounded="pill"
          prepend-icon="mdi-account-plus"
          @click="showNameDialog = true"
        >
          Name setzen
        </v-btn>
        <v-chip
          v-else
          color="white"
          variant="flat"
          size="small"
          class="user-chip"
          @click="showNameDialog = true"
        >
          <v-avatar start color="secondary" size="24">
            <span class="text-caption font-weight-bold">{{ initials }}</span>
          </v-avatar>
          {{ displayName() }}
        </v-chip>
      </template>
    </v-app-bar>

    <v-main class="bg-background">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="pill" location="bottom">
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.icon" class="mr-2" />
        {{ snackbar.text }}
      </div>
    </v-snackbar>

    <v-dialog v-model="showNameDialog" max-width="420" persistent>
      <v-card class="pa-2">
        <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-account-circle" color="primary" class="mr-2" />
          Wer bist du?
        </v-card-title>
        <v-card-text class="px-6">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Dein Name wird anderen Teilnehmern angezeigt.
          </p>
          <v-text-field
            v-model="nameInput"
            label="Anzeigename"
            prepend-inner-icon="mdi-account"
            autofocus
            hide-details="auto"
            @keyup.enter="saveName"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn v-if="isLoggedIn()" variant="text" @click="showNameDialog = false">
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!nameInput.trim()"
            prepend-icon="mdi-check"
            @click="saveName"
          >
            Speichern
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide, reactive } from 'vue'
import { useUser } from '@/composables/useUser'
import { useShoppingLists } from '@/composables/useShoppingLists'

const { displayName, isLoggedIn, setDisplayName } = useUser()
const { syncPendingLists } = useShoppingLists()

const showNameDialog = ref(false)
const nameInput = ref('')

const initials = computed(() => {
  const name = displayName()
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
  icon: 'mdi-check-circle',
})

function showSnackbar(text: string, color = 'success', icon = 'mdi-check-circle') {
  snackbar.text = text
  snackbar.color = color
  snackbar.icon = icon
  snackbar.show = true
}

provide('showSnackbar', showSnackbar)

onMounted(() => {
  if (!isLoggedIn()) {
    showNameDialog.value = true
  } else {
    nameInput.value = displayName()
  }
  window.addEventListener('online', syncPendingLists)
})

onUnmounted(() => {
  window.removeEventListener('online', syncPendingLists)
})

function saveName() {
  const name = nameInput.value.trim()
  if (!name) return
  setDisplayName(name)
  showNameDialog.value = false
  showSnackbar(`Willkommen, ${name}!`)
}
</script>

<style>
.app-bar-gradient {
  background: linear-gradient(135deg, #4A90D9 0%, #6C63FF 100%) !important;
}

.user-chip {
  cursor: pointer;
  transition: transform 0.15s ease;
}
.user-chip:hover {
  transform: scale(1.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
