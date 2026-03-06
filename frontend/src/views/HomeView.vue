<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Einkaufslisten</h1>

        <v-btn color="primary" prepend-icon="mdi-plus" class="mb-4">
          Neue Liste erstellen
        </v-btn>

        <v-card
          v-for="list in lists"
          :key="list.id"
          class="mb-2"
          :to="`/list/${list.id}`"
          variant="outlined"
        >
          <v-card-title>{{ list.name }}</v-card-title>
        </v-card>

        <v-card v-if="lists.length === 0" variant="tonal" class="pa-4 text-center">
          Noch keine Einkaufslisten vorhanden.
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ListItem {
  id: string
  name: string
}

const lists = ref<ListItem[]>([])
</script>
