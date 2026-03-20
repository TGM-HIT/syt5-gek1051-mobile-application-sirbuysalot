# Tech-Doc: US-05 - Tags zuweisen

**Story:** #17 - Tags zuweisen  
**Story Points:** 5  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-04 (Produkt hinzufügen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, Produkten Tags (Kategorien/Gruppen) zuzuweisen. Tags sind frei wählbare Textfelder und werden visuell als farbige Chips am Produkt angezeigt.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Tag hinzufügen | Dialog zum Hinzufügen von Tags |
| 2 | Mehrere Tags | Ein Produkt kann mehrere Tags haben |
| 3 | Vorschläge | Vorhandene Tags werden als Vorschläge angezeigt |
| 4 | Chips anzeigen | Tags werden als farbige Chips am Produkt angezeigt |
| 5 | Tag entfernen | Tags können vom Produkt entfernt werden |
| 6 | Offline-Support | Tags funktionieren auch offline |

---

## 3. UI/UX Anforderungen

### 3.1 Tag-Dialog

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 🏷️ Tags bearbeiten        │ │
│  └───────────────────────────┘ │
│                                 │
│  Aktuelle Tags:                 │
│  ┌───────────────────────────┐ │
│  │ [Obst ×] [Bio ×]          │ │
│  └───────────────────────────┘ │
│                                 │
│  Tag hinzufügen:                │
│  ┌───────────────────────────┐ │
│  │  Tag eingeben...           │ │
│  └───────────────────────────┘ │
│                                 │
│  Vorschläge:                    │
│  ┌───────────────────────────┐ │
│  │ (Obst) (Gemüse) (Milch)   │ │
│  └───────────────────────────┘ │
│                                 │
│         [Abbrechen] [Speichern] │
└─────────────────────────────────┘
```

### 3.2 Produkt mit Tags

```
┌─────────────────────────────────┐
│  [✓] 🍎 Äpfel                  │
│       [Obst] [Bio]              │
│                                │
│  [ ] 🥕 Karotten                │
│       [Gemüse]                 │
└─────────────────────────────────┘
```

---

## 4. Datenmodell

### 4.1 Tag (Frontend)

```typescript
interface Tag {
  id: string                    // UUID
  name: string                  // Tag-Name (z.B. "Obst")
  listId: string               // Zugehörige Liste
  color?: string               // Optional: Farbe
}
```

### 4.2 ProductTag (M2M Beziehung)

```typescript
interface ProductTag {
  productId: string
  tagId: string
}
```

### 4.3 API-Requests

```typescript
// PUT /api/lists/{listId}/products/{productId}/tags
interface UpdateProductTagsRequest {
  tagIds: string[]              // Array von Tag-IDs
}

// POST /api/lists/{listId}/tags
interface CreateTagRequest {
  name: string
}

// GET /api/lists/{listId}/tags
// Response: Tag[]
```

---

## 5. Implementierung

### 5.1 Frontend - useTags Composable

```typescript
// src/composables/useTags.ts

import { ref } from 'vue'
import { db, type Tag as DbTag } from '@/db'
import { tagService } from '@/services/tagService'

export function useTags(listId: string) {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  async function fetchTags() {
    loading.value = true
    try {
      if (navigator.onLine) {
        const serverTags = await tagService.getAll(listId)
        tags.value = serverTags
        await db.tags.where('listId').equals(listId).delete()
        for (const tag of serverTags) {
          await db.tags.put(tag)
        }
      } else {
        const localTags = await db.tags.where('listId').equals(listId).toArray()
        tags.value = localTags.map(t => ({
          id: t.id!,
          name: t.name,
          listId: t.listId,
          color: t.color
        }))
      }
    } finally {
      loading.value = false
    }
  }

  async function createTag(name: string) {
    const now = new Date().toISOString()
    const tempId = crypto.randomUUID()

    const localTag: DbTag = {
      id: tempId,
      name,
      listId,
      color: undefined,
    }

    await db.tags.add(localTag)
    tags.value.push({ id: tempId, name, listId })

    if (navigator.onLine) {
      try {
        const created = await tagService.create(listId, { name })
        await db.tags.update(tempId, { id: created.id })
        return created
      } catch (e) {
        await syncService.addToQueue('create', 'tag', tempId, { name, listId })
      }
    }

    return { id: tempId, name, listId }
  }

  async function getTagsForProduct(productId: string): Promise<Tag[]> {
    const productTags = await db.productTags.where('productId').equals(productId).toArray()
    const tagIds = productTags.map(pt => pt.tagId)
    const tagRecords = await db.tags.where('id').anyOf(tagIds).toArray()
    return tagRecords.map(t => ({
      id: t.id!,
      name: t.name,
      listId: t.listId,
      color: t.color
    }))
  }

  async function setTagsForProduct(productId: string, tagIds: string[]) {
    await db.productTags.where('productId').equals(productId).delete()
    for (const tagId of tagIds) {
      await db.productTags.put({ productId, tagId })
    }

    if (navigator.onLine) {
      try {
        await tagService.setProductTags(listId, productId, tagIds)
      } catch (e) {
        await syncService.addToQueue('update', 'productTags', productId, { tagIds })
      }
    }
  }

  return { tags, loading, fetchTags, createTag, getTagsForProduct, setTagsForProduct }
}
```

### 5.2 Frontend - Tag Chip Component

```vue
<!-- src/components/TagChip.vue -->

<template>
  <v-chip
    :color="tag.color || 'secondary'"
    size="small"
    variant="tonal"
    closable
    @click:close="$emit('remove', tag.id)"
  >
    {{ tag.name }}
  </v-chip>
</template>

<script setup lang="ts">
defineProps<{
  tag: { id: string; name: string; color?: string }
}>()

defineEmits<{
  (e: 'remove', tagId: string): void
}>()
</script>
```

### 5.3 Frontend - Tag Dialog

```vue
<!-- src/components/ProductTagDialog.vue -->

<template>
  <v-dialog v-model="show" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-tag-multiple" class="mr-2" />
        Tags bearbeiten
      </v-card-title>
      
      <v-card-text>
        <div v-if="selectedTags.length > 0" class="mb-4">
          <div class="text-caption text-medium-emphasis mb-2">Aktuelle Tags</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="tag in selectedTags"
              :key="tag.id"
              color="secondary"
              variant="tonal"
              closable
              @click:close="removeTag(tag.id)"
            >
              {{ tag.name }}
            </v-chip>
          </div>
        </div>

        <v-autocomplete
          v-model="newTagName"
          label="Tag hinzufügen"
          :items="availableTags"
          item-title="name"
          item-value="id"
          :custom-filter="tagFilter"
          class="mb-4"
        >
          <template #no-data>
            <v-list-item>
              <template #title>
                <span class="text-medium-emphasis">Neuen Tag erstellen:</span>
                <span class="font-weight-bold ml-1">"{{ newTagName }}"</span>
              </template>
              <template #append>
                <v-btn
                  v-if="newTagName.trim()"
                  icon="mdi-plus"
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="createAndAddTag"
                />
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <div v-if="otherTags.length > 0">
          <div class="text-caption text-medium-emphasis mb-2">Vorschläge</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="tag in otherTags"
              :key="tag.id"
              variant="outlined"
              size="small"
              @click="addExistingTag(tag)"
            >
              {{ tag.name }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="show = false">Fertig</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTags } from '@/composables/useTags'

const props = defineProps<{
  listId: string
  productId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { tags, fetchTags, createTag, getTagsForProduct, setTagsForProduct } = useTags(props.listId)

const selectedTags = ref<{ id: string; name: string }[]>([])
const newTagName = ref('')

const selectedTagIds = computed(() => selectedTags.value.map(t => t.id))
const availableTags = computed(() => tags.value)
const otherTags = computed(() => 
  tags.value.filter(t => !selectedTagIds.value.includes(t.id))
)

watch(show, async (val) => {
  if (val) {
    await fetchTags()
    selectedTags.value = await getTagsForProduct(props.productId)
  }
})

function tagFilter(items: any[], query: string) {
  return items.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  )
}

function addExistingTag(tag: { id: string; name: string }) {
  if (!selectedTagIds.value.includes(tag.id)) {
    selectedTags.value.push(tag)
    saveTags()
  }
}

async function createAndAddTag() {
  if (!newTagName.value.trim()) return
  const tag = await createTag(newTagName.value.trim())
  selectedTags.value.push(tag)
  newTagName.value = ''
  saveTags()
}

function removeTag(tagId: string) {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
  saveTags()
}

async function saveTags() {
  await setTagsForProduct(props.productId, selectedTagIds.value)
}
</script>
```

### 5.4 Backend - TagController

```java
// src/main/java/at/tgm/sirbuysalot/controller/TagController.java

@RestController
@RequestMapping("/api/lists/{listId}/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<Tag>> getTags(@PathVariable UUID listId) {
        return ResponseEntity.ok(tagService.getTagsForList(listId));
    }

    @PostMapping
    public ResponseEntity<Tag> createTag(@PathVariable UUID listId, 
                                         @RequestBody @Valid CreateTagRequest request) {
        Tag tag = tagService.createTag(listId, request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(tag);
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<Void> setProductTags(
            @PathVariable UUID listId,
            @PathVariable UUID productId,
            @RequestBody SetProductTagsRequest request) {
        tagService.setProductTags(listId, productId, request.getTagIds());
        return ResponseEntity.ok().build();
    }
}
```

---

## 6. IndexedDB Schema (Erweiterung)

```typescript
// src/db/index.ts

db.version(3).stores({
  // ... existing tables ...
  tags: {
    keyPath: 'id',
    indexes: ['id', 'name', 'listId']
  },
  productTags: {
    keyPath: ['productId', 'tagId'],
    indexes: ['productId', 'tagId']
  }
})
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| GET | `/api/lists/{listId}/tags` | - | `Tag[]` | Alle Tags einer Liste |
| POST | `/api/lists/{listId}/tags` | `{ name }` | `Tag` | Tag erstellen |
| PUT | `/api/lists/{listId}/tags/products/{productId}` | `{ tagIds }` | - | Tags setzen |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/tags.test.ts

describe('Tags', () => {
  it('should create a tag', async () => {
    const tag = await createTag('Obst')
    expect(tag.name).toBe('Obst')
    expect(tag.listId).toBeDefined()
  })

  it('should assign multiple tags to product', async () => {
    const tag1 = await createTag('Obst')
    const tag2 = await createTag('Bio')
    
    await setTagsForProduct('prod-1', [tag1.id, tag2.id])
    
    const productTags = await getTagsForProduct('prod-1')
    expect(productTags.length).toBe(2)
  })

  it('should suggest existing tags', async () => {
    await createTag('Milch')
    await createTag('Milchprodukte')
    
    const suggestions = tags.value.filter(t => t.name.includes('Milch'))
    expect(suggestions.length).toBe(2)
  })
})
```

---

## 9. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-04 | Benötigt | Produkt muss existieren |
| US-20 | Baut auf | Tags verwalten |
| US-21 | Baut auf | Nach Tags filtern |

---

## 10. Definition of Done

- [ ] Tag-Dialog mit Chips-Display implementiert
- [ ] Autocomplete mit Tag-Vorschlägen
- [ ] Neuen Tag erstellen und sofort zuweisen
- [ ] Tags als farbige Chips am Produkt anzeigen
- [ ] Tags aus Produkt entfernen
- [ ] IndexedDB-Tabellen für Tags und ProductTags
- [ ] REST-Endpunkte im Backend
- [ ] Unit-Tests vorhanden

---

## 11. Nächste Story

**US-06:** Preis bearbeiten - Ermöglicht das nachträgliche Eintragen oder Ändern von Preisen.
