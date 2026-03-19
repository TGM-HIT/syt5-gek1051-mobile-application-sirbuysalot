<template>
  <v-container class="py-8">
    <!-- Hero -->
    <div class="text-center mb-8">
      <v-icon icon="mdi-cart-variant" size="64" color="primary" class="mb-4" />
      <h1 class="text-h3 font-weight-bold mb-2">Deine Listen</h1>
      <p class="text-body-1 text-medium-emphasis">
        Erstelle und teile Einkaufslisten mit deinem Team.
      </p>
    </div>

    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-6" />

        <v-alert v-if="error" type="error" variant="tonal" class="mb-6" closable rounded="xl">
          {{ error }}
        </v-alert>

        <!-- List cards -->
        <transition-group name="list" tag="div">
          <v-card
            v-for="list in lists"
            :key="list.id"
            :to="`/list/${list.id}`"
            class="mb-3 list-card"
            border
            hover
          >
            <div class="d-flex align-center pa-4">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                <v-icon icon="mdi-format-list-checks" />
              </v-avatar>

              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold">{{ list.name }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  <v-icon icon="mdi-package-variant" size="14" class="mr-1" />
                  {{ list.products?.length ?? 0 }} Produkte
                  <span v-if="(list.users?.length ?? 0) > 0" class="ml-3">
                    <v-icon icon="mdi-account-group" size="14" class="mr-1" />
                    {{ list.users.length }} Teilnehmer
                  </span>
                </div>
              </div>

              <v-icon icon="mdi-chevron-right" color="grey" />
            </div>
          </v-card>
        </transition-group>

        <!-- Empty state -->
        <v-card v-if="!loading && lists.length === 0" class="pa-8 text-center" border>
          <v-icon icon="mdi-cart-off" size="80" color="grey-lighten-1" class="mb-4" />
          <div class="text-h6 text-medium-emphasis mb-2">Noch keine Listen</div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            Erstelle deine erste Einkaufsliste!
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="showCreate = true">
            Neue Liste
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- FAB -->
    <v-btn
      v-if="lists.length > 0"
      color="primary"
      icon="mdi-plus"
      size="large"
      position="fixed"
      location="bottom end"
      class="ma-6 fab-btn"
      elevation="8"
      @click="showCreate = true"
    />

    <!-- Create dialog -->
    <v-dialog v-model="showCreate" max-width="440">
      <v-card class="pa-2">
        <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-playlist-plus" color="primary" class="mr-2" />
          Neue Liste
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="newListName"
            label="Wie soll die Liste heissen?"
            placeholder="z.B. Wocheneinkauf"
            prepend-inner-icon="mdi-format-list-bulleted"
            autofocus
            hide-details="auto"
            :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
            @keyup.enter="onCreateList"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showCreate = false">Abbrechen</v-btn>
          <v-btn
            color="primary"
            :disabled="!newListName.trim()"
            :loading="creating"
            prepend-icon="mdi-check"
            @click="onCreateList"
          >
            Erstellen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingLists } from '@/composables/useShoppingLists'

const router = useRouter()
const showSnackbar = inject<(text: string, color?: string, icon?: string) => void>('showSnackbar')!
const { lists, loading, error, fetchLists, createList } = useShoppingLists()

const showCreate = ref(false)
const newListName = ref('')
const creating = ref(false)

onMounted(() => {
  fetchLists()
})

async function onCreateList() {
  const name = newListName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const created = await createList(name)
    showCreate.value = false
    newListName.value = ''
    showSnackbar(`"${created.name}" erstellt!`)
    router.push(`/list/${created.id}`)
  } catch {
    error.value = 'Fehler beim Erstellen der Liste'
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.list-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

.fab-btn {
  transition: transform 0.2s ease;
}
.fab-btn:hover {
  transform: scale(1.1);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
