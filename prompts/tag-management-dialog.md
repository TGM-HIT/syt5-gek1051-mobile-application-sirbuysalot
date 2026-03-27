# Prompt: Tag Management - Creating a Dialog Component

## When
During US-20 implementation, late March 2026

## Context
We needed a dialog where users can create, edit, and delete tags for their shopping list. The dialog should be reusable and handle all CRUD operations for tags.

## Prompt (exact wording)
"I need a tag management dialog for my Vue 3 + Vuetify app. It should show all existing tags as chips with a delete button, and have an input field to create new tags. What's the best component structure? Should I put this logic in the parent or in the dialog itself?"

## Ergebnis
- TagManagementDialog.vue:
  ```vue
  <template>
    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>Tags verwalten</v-card-title>
        
        <v-card-text>
          <!-- Existing tags -->
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-chip
              v-for="tag in tags"
              :key="tag.id"
              closable
              color="secondary"
              @click:close="$emit('delete', tag.id)"
            >
              {{ tag.name }}
            </v-chip>
          </div>
          
          <!-- Create new -->
          <v-text-field
            v-model="newTagName"
            label="Neuer Tag"
            append-inner-icon="mdi-plus"
            @click:append-inner="createNewTag"
            @keyup.enter="createNewTag"
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Schließen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const props = defineProps<{
    modelValue: boolean
    tags: Tag[]
  }>()
  
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    create: [name: string]
    delete: [tagId: string]
  }>()
  
  const dialog = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })
  
  const newTagName = ref('')
  
  function createNewTag() {
    if (!newTagName.value.trim()) return
    emit('create', newTagName.value.trim())
    newTagName.value = ''
  }
  </script>
  ```

## Was wir daraus mitgenommen haben
Die Trennung von UI und Business Logic ist wichtig. Der Dialog sollte nur die UI kümmern, die Events an den Parent emitten. Der Parent (ListView) ruft dann die Service-Methoden auf.

`v-model` mit computed getter/setter für das `v-dialog` ist der Vue 3 Way. Das ermöglicht:
```vue
<TagManagementDialog
  v-model="showTagManagement"
  :tags="allTags"
  @create="onCreateTag"
  @delete="onDeleteTag"
/>
```

Die Chips mit `closable` sind intuitiv - man sieht sofort dass man sie löschen kann.

## Key Takeaways
- Dialog als eigenständige wiederverwendbare Komponente
- v-model mit computed für Parent-Communication
- Events für Aktionen (create, delete)
- Props für Daten (tags)
- v-chip mit closable für einfaches Löschen
