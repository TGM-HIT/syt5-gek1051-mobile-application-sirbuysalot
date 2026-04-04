<template>
  <v-container class="py-8">
    <!-- Hero -->
    <div class="text-center mb-6 mb-sm-8">
      <div class="hero-icon-wrap mx-auto mb-3 mb-sm-4">
        <v-icon icon="mdi-crown" :size="smAndDown ? 28 : 36" color="white" />
      </div>
      <h1 :class="smAndDown ? 'text-h5' : 'text-h3'" class="font-weight-bold mb-2">Deine Listen</h1>
      <p class="text-body-2 text-sm-body-1 text-medium-emphasis">
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
            <div class="d-flex align-center pa-3 pa-sm-4">
              <v-avatar color="primary" variant="tonal" :size="smAndDown ? 40 : 48" class="mr-3 mr-sm-4">
                <v-icon icon="mdi-format-list-checks" :size="smAndDown ? 20 : 24" />
              </v-avatar>

              <div class="flex-grow-1 min-width-0">
                <div class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold text-truncate">{{ list.name }}</div>
                <div class="text-caption text-sm-body-2 text-medium-emphasis">
                  <v-icon icon="mdi-package-variant" size="14" class="mr-1" />
                  {{ list.products?.length ?? 0 }} Produkte
                  <span v-if="(list.users?.length ?? 0) > 0" class="ml-2 ml-sm-3">
                    <v-icon icon="mdi-account-group" size="14" class="mr-1" />
                    {{ list.users.length }} Teilnehmer
                  </span>
                </div>
              </div>

              <v-btn
                icon="mdi-content-copy"
                variant="text"
                :size="smAndDown ? 'x-small' : 'small'"
                color="grey"
                @click.prevent="onDuplicateList(list)"
              />
              <v-btn
                icon="mdi-pencil"
                variant="text"
                :size="smAndDown ? 'x-small' : 'small'"
                color="grey"
                @click.prevent="openEditDialog(list)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                :size="smAndDown ? 'x-small' : 'small'"
                color="error"
                @click.prevent="confirmDeleteList(list)"
              />
              <v-icon icon="mdi-chevron-right" color="grey" size="small" />
            </div>
          </v-card>
        </transition-group>

        <!-- Deleted lists toggle -->
        <div class="d-flex align-center mt-6 mb-3">
          <v-switch
            v-model="showDeleted"
            label="Gelöschte Listen anzeigen"
            density="compact"
            hide-details
            color="warning"
            @update:model-value="(val: boolean) => val && fetchDeletedLists()"
          />
        </div>

        <!-- Deleted lists -->
        <template v-if="showDeleted">
          <v-card
            v-for="list in deletedLists"
            :key="list.id"
            class="mb-3"
            border
            variant="outlined"
            color="grey"
          >
            <div class="d-flex align-center pa-4">
              <v-avatar color="grey" variant="tonal" size="48" class="mr-4">
                <v-icon icon="mdi-delete-outline" />
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold text-medium-emphasis text-decoration-line-through">
                  {{ list.name }}
                </div>
              </div>
              <v-btn
                color="success"
                variant="tonal"
                size="small"
                prepend-icon="mdi-restore"
                @click="onRestoreList(list)"
              >
                Wiederherstellen
              </v-btn>
            </div>
          </v-card>

          <v-card v-if="deletedLists.length === 0" class="pa-6 text-center" border variant="outlined">
            <div class="text-body-2 text-medium-emphasis">Keine gelöschten Listen vorhanden.</div>
          </v-card>
        </template>

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
            label="Wie soll die Liste heißen?"
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

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card class="pa-2">
        <v-card-title class="text-h6 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Liste löschen?
        </v-card-title>
        <v-card-text class="px-6">
          <p class="text-body-2">
            Soll die Liste <strong>"{{ deleteTarget?.name }}"</strong> wirklich gelöscht werden?
            Die Liste kann später wiederhergestellt werden.
          </p>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Abbrechen</v-btn>
          <v-btn color="error" prepend-icon="mdi-delete" @click="onDeleteList">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit dialog -->
    <v-dialog v-model="showEdit" max-width="440">
      <v-card class="pa-2">
        <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-pencil" color="primary" class="mr-2" />
          Liste umbenennen
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="editListName"
            label="Neuer Name"
            prepend-inner-icon="mdi-format-list-bulleted"
            autofocus
            hide-details="auto"
            :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
            @keyup.enter="onUpdateList"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showEdit = false">Abbrechen</v-btn>
          <v-btn
            color="primary"
            :disabled="!editListName.trim()"
            :loading="updating"
            prepend-icon="mdi-check"
            @click="onUpdateList"
          >
            Speichern
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useShoppingLists } from '@/composables/useShoppingLists'
import { useUser } from '@/composables/useUser'
import { userService } from '@/services/userService'
import type { ShoppingList } from '@/types'

const router = useRouter()
const { displayName } = useUser()
const { smAndDown } = useDisplay()
const showSnackbar = inject<(text: string, color?: string, icon?: string) => void>('showSnackbar')!
const { lists, deletedLists, loading, error, fetchLists, createList, updateList, removeList, fetchDeletedLists, restoreList, duplicateList } = useShoppingLists()

const showCreate = ref(false)
const newListName = ref('')
const creating = ref(false)

const showEdit = ref(false)
const editListName = ref('')
const editListId = ref('')
const updating = ref(false)

const showDeleteConfirm = ref(false)
const deleteTarget = ref<ShoppingList | null>(null)
const showDeleted = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchLists()
  pollInterval = setInterval(() => fetchLists(), 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

async function onCreateList() {
  const name = newListName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const created = await createList(name)
    await userService.joinList(created.id, displayName())
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

function openEditDialog(list: ShoppingList) {
  editListId.value = list.id
  editListName.value = list.name
  showEdit.value = true
}

async function onDuplicateList(list: ShoppingList) {
  try {
    await duplicateList(list.id)
    showSnackbar(`"${list.name}" dupliziert`, 'success', 'mdi-content-copy')
  } catch {
    error.value = 'Fehler beim Duplizieren'
  }
}

function confirmDeleteList(list: ShoppingList) {
  deleteTarget.value = list
  showDeleteConfirm.value = true
}

async function onRestoreList(list: ShoppingList) {
  try {
    await restoreList(list.id)
    showSnackbar(`"${list.name}" wiederhergestellt`, 'success', 'mdi-restore')
  } catch {
    error.value = 'Fehler beim Wiederherstellen'
  }
}

async function onDeleteList() {
  if (!deleteTarget.value) return
  try {
    await removeList(deleteTarget.value.id)
    showDeleteConfirm.value = false
    showSnackbar(`"${deleteTarget.value.name}" gelöscht`, 'success', 'mdi-delete-check')
    deleteTarget.value = null
  } catch {
    error.value = 'Fehler beim Löschen der Liste'
  }
}

async function onUpdateList() {
  const name = editListName.value.trim()
  if (!name) return
  updating.value = true
  try {
    await updateList(editListId.value, { name })
    showEdit.value = false
    showSnackbar(`Liste umbenannt zu "${name}"`)
  } catch {
    error.value = 'Fehler beim Umbenennen'
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.hero-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1B6B4A 0%, #145238 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(27, 107, 74, 0.25);
}

.min-width-0 {
  min-width: 0;
}
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
