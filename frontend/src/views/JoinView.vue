<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4">
          <v-card-title class="text-center">Liste beitreten</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="joining" indeterminate color="primary" class="d-block mx-auto" />
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const accessCode = route.params.code as string

const joining = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  // TODO (US-03): implement join logic - look up list by accessCode, redirect to list view
  // For now just show the access code was received
  joining.value = false
  error.value = `Beitritt mit Code "${accessCode}" - noch nicht implementiert (US-03)`
})
</script>
