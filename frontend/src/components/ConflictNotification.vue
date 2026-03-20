<template>
  <v-snackbar
    v-model="visible"
    color="warning"
    timeout="8000"
    location="top"
    rounded="lg"
    multi-line
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-alert-circle" class="mr-3" size="large" />
      <div>
        <div class="text-subtitle-2 font-weight-bold">Versionskonflikt</div>
        <div class="text-body-2">
          {{ message }}
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn variant="text" @click="onReload">
        Neu laden
      </v-btn>
      <v-btn variant="text" @click="visible = false">
        Schliessen
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  message?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reload: []
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function onReload() {
  visible.value = false
  emit('reload')
}
</script>
