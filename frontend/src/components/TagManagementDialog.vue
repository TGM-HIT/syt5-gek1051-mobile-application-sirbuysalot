<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="pa-2">
      <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
        <v-icon icon="mdi-tag-multiple" color="secondary" class="mr-2" />
        Tags verwalten
      </v-card-title>
      <v-card-text class="px-6">
        <!-- New tag -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="newTagName"
            label="Neuer Tag"
            prepend-inner-icon="mdi-tag-plus"
            density="compact"
            hide-details
            @keyup.enter="onCreateTag"
          />
          <v-btn
            color="secondary"
            :disabled="!newTagName.trim()"
            icon="mdi-plus"
            size="small"
            @click="onCreateTag"
          />
        </div>

        <!-- Tag list -->
        <div v-for="tag in tags" :key="tag.id" class="d-flex align-center mb-2">
          <v-chip color="secondary" variant="tonal" label class="flex-grow-1">
            {{ tag.name }}
          </v-chip>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="x-small"
            color="error"
            class="ml-2"
            @click="$emit('delete', tag.id)"
          />
        </div>

        <div v-if="tags.length === 0" class="text-body-2 text-medium-emphasis text-center py-4">
          Noch keine Tags vorhanden
        </div>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Schließen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tag } from '@/types'

defineProps<{
  modelValue: boolean
  tags: Tag[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  create: [name: string]
  delete: [tagId: string]
}>()

const newTagName = ref('')

function onCreateTag() {
  const name = newTagName.value.trim()
  if (!name) return
  emit('create', name)
  newTagName.value = ''
}
</script>
