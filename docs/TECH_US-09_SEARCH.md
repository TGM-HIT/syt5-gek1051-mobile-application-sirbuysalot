# Tech-Doc: US-09 - Produkte durchsuchen

**Story:** #20 - Produkte durchsuchen  
**Story Points:** 5  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-04 (Produkt hinzufügen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, Produkte in der Einkaufsliste zu durchsuchen. Die Suche startet bereits ab dem ersten Buchstaben und filtert die Produkte in Echtzeit.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Suchfeld | Immer sichtbar über der Produktliste |
| 2 | Echtzeit-Filter | Suche startet ab erstem Buchstaben |
| 3 | Groß-/Kleinschreibung | Wird ignoriert |
| 4 | Produktname | Suche durchsucht Produktnamen |
| 5 | Tags | Suche durchsucht auch Tags (optional) |
| 6 | Leerer Filter | Zurücksetzen zeigt alle Produkte |

---

## 3. UI/UX Anforderungen

### 3.1 Suchfeld-Layout

```
┌─────────────────────────────────────────┐
│  Einkaufsliste                          │
│  ─────────────────────────────────────  │
│  ┌─────────────────────────────────────┐ │
│  │ 🔍 Produkt suchen...                │ │
│  └─────────────────────────────────────┘ │
│  ─────────────────────────────────────  │
│  Produkte (3)                           │
│  ─────────────────────────────────────  │
│  [✓] 🍎 Äpfel                [€2,99]   │
│       [Obst] [Bio]                      │
│  [ ] 🥕 Karotten                         │
│  [ ] 🍌 Bananen                         │
└─────────────────────────────────────────┘

Nach Suche nach "Ap":
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ │
│  │ 🔍 Ap                        [✕]   │ │
│  └─────────────────────────────────────┘ │
│  ─────────────────────────────────────  │
│  Gefunden: 1                             │
│  ─────────────────────────────────────  │
│  [✓] 🍎 Äpfel                [€2,99]   │
│       [Obst] [Bio]                      │
│                                         │
│  Verbergen [👁️ 3 ausgeblendet]          │
└─────────────────────────────────────────┘
```

### 3.2 Design-Spezifikation

| Element | Style |
|---------|-------|
| Suchfeld | `v-text-field` mit `prepend-inner-icon="mdi-magnify"` |
| Clear-Button | `append-inner-icon="mdi-close"` |
| Platzierung | Oberhalb der Produktliste, sticky |
| Feedback | "Gefunden: X" oder "Keine Ergebnisse" |

---

## 4. Implementierung

### 4.1 Frontend - ListView mit Suche

```vue
<!-- src/views/ListView.vue -->

<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <!-- Header -->
        <div class="d-flex align-center mb-4">
          <v-btn icon="mdi-arrow-left" variant="tonal" size="small" to="/" class="mr-3" />
          <div class="flex-grow-1">
            <h1 class="text-h4 font-weight-bold">{{ listName }}</h1>
            <div class="text-body-2 text-medium-emphasis">
              {{ filteredProducts.length }} Produkte
              <span v-if="searchQuery"> (gefiltert)</span>
            </div>
          </div>
        </div>

        <!-- Search Field -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Produkt suchen..."
          prepend-inner-icon="mdi-magnify"
          :append-inner-icon="searchQuery ? 'mdi-close' : undefined"
          clearable
          hide-details
          class="mb-4"
          @click:append-inner="searchQuery = ''"
        />

        <!-- Empty search state -->
        <v-alert
          v-if="searchQuery && filteredProducts.length === 0"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          Keine Produkte gefunden für "{{ searchQuery }}"
        </v-alert>

        <!-- Product list -->
        <transition-group name="product" tag="div">
          <v-card
            v-for="product in filteredProducts"
            :key="product.id"
            class="mb-3 product-card"
            :class="{ 'product-purchased': product.purchased }"
            border
            @click="onTogglePurchase(product)"
          >
            <!-- ... product card content ... -->
          </v-card>
        </transition-group>

        <!-- Hidden count badge -->
        <v-chip
          v-if="searchQuery && hiddenCount > 0"
          color="grey"
          variant="flat"
          size="small"
          class="mt-2"
        >
          {{ hiddenCount }} ausgeblendet
        </v-chip>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProducts } from '@/composables/useProducts'
import type { Product } from '@/types'

const { products } = useProducts(listId)

const searchQuery = ref('')

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) {
    return products.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return products.value.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(query)
    const tagMatch = product.tags?.some(tag => 
      tag.name.toLowerCase().includes(query)
    )
    
    return nameMatch || tagMatch
  })
})

const hiddenCount = computed(() => {
  if (!searchQuery.value.trim()) return 0
  return products.value.length - filteredProducts.value.length
})
</script>
```

### 4.2 Alternative: Debounced Search

```typescript
// src/composables/useSearch.ts

import { ref, watch } from 'vue'

export function useSearch<T>(
  items: Ref<T[]>,
  searchFields: (item: T) => string[]
) {
  const searchQuery = ref('')
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout>

  watch(searchQuery, (query) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = query
    }, 150) // 150ms debounce
  })

  const filteredItems = computed(() => {
    if (!debouncedQuery.value.trim()) {
      return items.value
    }

    const query = debouncedQuery.value.toLowerCase().trim()

    return items.value.filter(item => {
      return searchFields(item).some(field => 
        field.toLowerCase().includes(query)
      )
    })
  })

  function clearSearch() {
    searchQuery.value = ''
    debouncedQuery.value = ''
  }

  return {
    searchQuery,
    filteredItems,
    clearSearch,
  }
}
```

---

## 5. Client-Side vs Server-Side Search

### 5.1 Client-Side (empfohlen für kleine Listen)

```typescript
// Für Listen mit < 100 Produkten
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  
  return products.value.filter(p => 
    p.name.toLowerCase().includes(query)
  )
})
```

### 5.2 Server-Side (für große Listen)

```typescript
// src/services/productService.ts

async function searchProducts(listId: string, query: string): Promise<Product[]> {
  const response = await api.get(`/lists/${listId}/products/search`, {
    params: { q: query }
  })
  return response.data
}
```

---

## 6. Tests

### 6.1 Unit Tests (Vitest)

```typescript
// src/tests/search.test.ts

describe('Product Search', () => {
  const mockProducts = [
    { id: '1', name: 'Äpfel', tags: [{ name: 'Obst' }] },
    { id: '2', name: 'Bananen', tags: [{ name: 'Obst' }] },
    { id: '3', name: 'Milch', tags: [{ name: 'Milchprodukte' }] },
    { id: '4', name: 'Brot', tags: [] },
  ]

  it('should filter by product name', () => {
    const result = mockProducts.filter(p => 
      p.name.toLowerCase().includes('ap')
    )
    expect(result.length).toBe(2) // Äpfel, Bananen
  })

  it('should filter by tag name', () => {
    const result = mockProducts.filter(p => 
      p.tags.some(t => t.name.toLowerCase().includes('obst'))
    )
    expect(result.length).toBe(2) // Äpfel, Bananen
  })

  it('should be case insensitive', () => {
    const result = mockProducts.filter(p => 
      p.name.toLowerCase().includes('MILCH')
    )
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Milch')
  })

  it('should return all products for empty query', () => {
    const result = mockProducts.filter(p => {
      if (!searchQuery) return true
      return p.name.toLowerCase().includes(searchQuery)
    })
    expect(result.length).toBe(4)
  })

  it('should filter starting from first character', () => {
    const result = mockProducts.filter(p => 
      p.name.toLowerCase().startsWith('m')
    )
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Milch')
  })
})
```

---

## 7. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-04 | Benötigt | Produkte müssen existieren |
| US-05 | Optional | Tag-Suche ist optional |

---

## 8. Definition of Done

- [ ] Suchfeld ist immer sichtbar über der Produktliste
- [ ] Suche startet ab dem ersten Buchstaben
- [ ] Groß-/Kleinschreibung wird ignoriert
- [ ] Suche filtert in Echtzeit (computed property)
- [ ] Clear-Button setzt Filter zurück
- [ ] "Keine Ergebnisse"-Meldung bei leerem Resultat
- [ ] Unit-Tests vorhanden

---

## 9. Performance-Hinweise

| Aspekt | Empfehlung |
|--------|------------|
| Debounce | 150-300ms bei Server-Side-Search |
| Client-Side | Für < 100 Produkte geeignet |
| Index | Bei großen Listen: virtual scrolling |

---

## 10. Nächste Story

**US-10:** Produkt ausblenden - Ermöglicht das Soft-Delete von Produkten.
