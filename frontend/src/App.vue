<template>
  <v-app>
    <v-app-bar elevation="0" class="app-bar-gradient">
      <template #prepend>
        <div class="d-flex align-center ml-2">
          <div class="logo-mark">
            <v-icon color="white" icon="mdi-crown" size="18" />
          </div>
        </div>
      </template>

      <v-app-bar-title>
        <router-link to="/" class="text-white text-decoration-none d-flex align-center">
          <span class="logo-text">Sir</span><span class="logo-text-bold">BuysALot</span>
        </router-link>
      </v-app-bar-title>

      <template #append>
        <v-btn
          :icon="isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          variant="text"
          color="white"
          size="small"
          class="mr-1"
          @click="toggleDarkMode"
        />
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

    <OfflineBanner />

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
import { ref, computed, onMounted, provide, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useDarkMode } from '@/composables/useDarkMode'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { syncService } from '@/services/syncService'
import OfflineBanner from '@/components/OfflineBanner.vue'

const route = useRoute()
const { displayName, isLoggedIn, setDisplayName } = useUser()
const { isDark, toggle: toggleDarkMode } = useDarkMode()
const { isOnline } = useOnlineStatus()

// Sync all pending offline changes when coming back online
watch(isOnline, async (online) => {
  if (online) {
    try {
      await syncService.syncAllPending()
    } catch {
      // Silent fail, individual list views will handle their own sync
    }
  }
})

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
  if (isLoggedIn()) {
    nameInput.value = displayName()
  } else if (!route.path.startsWith('/join')) {
    showNameDialog.value = true
  }
})

watch(() => route.path, (path) => {
  if (path.startsWith('/join')) {
    showNameDialog.value = false
  }
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
  background: linear-gradient(135deg, #1B6B4A 0%, #145238 60%, #0F3D2A 100%) !important;
}

.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.logo-text {
  font-weight: 300;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  opacity: 0.9;
}

.logo-text-bold {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
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

/* Refined card borders */
.v-card--variant-elevated,
.v-card--variant-flat {
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
}
.v-theme--dark .v-card--variant-elevated,
.v-theme--dark .v-card--variant-flat {
  border-color: rgba(255, 255, 255, 0.08) !important;
}

/* Global responsive utilities */
@media (max-width: 600px) {
  .v-container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  .v-dialog > .v-overlay__content {
    margin: 12px !important;
    max-width: calc(100% - 24px) !important;
  }
}
</style>
