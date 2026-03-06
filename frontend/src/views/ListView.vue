<template>
  <v-container>
    <v-row>
      <v-col>
        <v-btn icon="mdi-arrow-left" variant="text" to="/" class="mb-2" />
        <h1 class="text-h4 mb-4">Produkte</h1>
        <p class="text-body-2 text-grey mb-4">Listen-ID: {{ route.params.id }}</p>

        <v-btn color="primary" prepend-icon="mdi-plus" class="mb-4">
          Produkt hinzufuegen
        </v-btn>

        <v-card v-if="products.length === 0" variant="tonal" class="pa-4 text-center">
          Noch keine Produkte in dieser Liste.
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

interface ProductItem {
  id: string
  name: string
  price?: number
  purchased: boolean
}

const products = ref<ProductItem[]>([])
</script>
