<template>
  <v-dialog :model-value="modelValue" max-width="440" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="pa-2">
      <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
        <v-icon icon="mdi-pencil" color="primary" class="mr-2" />
        Produkt bearbeiten
      </v-card-title>
      <v-card-text class="px-6">
        <v-text-field
          v-model="localName"
          label="Produktname"
          prepend-inner-icon="mdi-food-apple"
          autofocus
          hide-details="auto"
          class="mb-4"
          :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
        />
        <v-text-field
          v-model.number="localPrice"
          label="Preis (optional)"
          prepend-inner-icon="mdi-currency-eur"
          type="number"
          step="0.01"
          min="0"
          hide-details="auto"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :disabled="!localName.trim()"
          :loading="saving"
          prepend-icon="mdi-check"
          @click="onSave"
        >
          Speichern
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '@/types'

const props = defineProps<{
  modelValue: boolean
  product: Product | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { name: string; price: number | null }]
}>()

const localName = ref('')
const localPrice = ref<number | undefined>(undefined)

watch(() => props.product, (p) => {
  if (p) {
    localName.value = p.name
    localPrice.value = p.price ?? undefined
  }
})

function onSave() {
  emit('save', {
    name: localName.value.trim(),
    price: localPrice.value ?? null,
  })
}
</script>
