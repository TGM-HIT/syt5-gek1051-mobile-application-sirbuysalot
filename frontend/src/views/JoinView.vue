<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <div class="text-center mb-6">
          <v-icon icon="mdi-account-plus" size="64" color="primary" class="mb-4" />
          <h1 class="text-h4 font-weight-bold">Liste beitreten</h1>
        </div>

        <v-card class="pa-6" border>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
            {{ error }}
          </v-alert>

          <template v-if="listFound && !joined">
            <div class="text-center mb-6">
              <v-icon icon="mdi-format-list-checks" size="48" color="success" class="mb-2" />
              <div class="text-h6 font-weight-bold">{{ listName }}</div>
              <div class="text-body-2 text-medium-emphasis">
                Code: {{ accessCode }}
              </div>
            </div>

            <v-text-field
              v-model="displayNameInput"
              label="Dein Anzeigename"
              placeholder="z.B. Max, Anna..."
              prepend-inner-icon="mdi-account"
              autofocus
              hide-details="auto"
              class="mb-4"
              :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
              @keyup.enter="onJoin"
            />

            <v-btn
              color="primary"
              block
              size="large"
              :disabled="!displayNameInput.trim()"
              :loading="joining"
              prepend-icon="mdi-login"
              @click="onJoin"
            >
              Beitreten
            </v-btn>
          </template>

          <template v-if="joined">
            <div class="text-center">
              <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
              <div class="text-h6 font-weight-bold mb-2">Erfolgreich beigetreten!</div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Du bist jetzt Mitglied von "{{ listName }}".
              </div>
              <v-btn color="primary" :to="`/list/${listId}`" prepend-icon="mdi-arrow-right">
                Zur Liste
              </v-btn>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listService } from '@/services/listService'
import { userService } from '@/services/userService'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const router = useRouter()
const accessCode = route.params.code as string
const { setDisplayName, displayName, isLoggedIn } = useUser()

const loading = ref(true)
const error = ref<string | null>(null)
const listFound = ref(false)
const listName = ref('')
const listId = ref('')
const displayNameInput = ref('')
const joining = ref(false)
const joined = ref(false)

onMounted(async () => {
  try {
    const { data } = await (await import('@/services/api')).default.get(`/lists/join/${accessCode}`)
    listId.value = data.id
    listName.value = data.name
    listFound.value = true

    if (isLoggedIn()) {
      displayNameInput.value = displayName()
    }
  } catch {
    error.value = `Keine Liste mit dem Code "${accessCode}" gefunden.`
  } finally {
    loading.value = false
  }
})

async function onJoin() {
  const name = displayNameInput.value.trim()
  if (!name) return

  joining.value = true
  try {
    await userService.joinList(listId.value, name)
    setDisplayName(name)
    joined.value = true
  } catch {
    error.value = 'Fehler beim Beitreten. Bitte versuche es erneut.'
  } finally {
    joining.value = false
  }
}
</script>
