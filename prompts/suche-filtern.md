# Prompt: Search Functionality with Fuzzy Matching

## When
During US-09 implementation, March 2026

## Context
We needed a search feature that allows users to find products in their list by typing even single letters. Simple string.includes() wasn't good enough - we wanted it to be responsive and work with partial matches.

## Prompt (exact wording)
"Our shopping list app needs a search bar that filters products as the user types. Requirements: should work with single letters, case-insensitive, search in product names AND tags. We're using Vue 3 Composition API. Should I debounce the input? What's the best approach for this?"

## Ergebnis
- Computed property für gefilterte Produkte:
  ```typescript
  const filteredProducts = computed(() => {
    let result = products.value
    
    // Text search
    const query = (searchQuery.value ?? '').toLowerCase().trim()
    if (query) {
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query)
        const tagMatch = p.tags?.some((t) => 
          t.name.toLowerCase().includes(query)
        )
        return nameMatch || tagMatch
      })
    }
    
    // Tag filter
    if (selectedTags.value.length > 0) {
      result = result.filter((p) =>
        p.tags?.some((t) => selectedTags.value.includes(t.id))
      )
    }
    
    return result
  })
  ```

- v-text-field mit clearable:
  ```vue
  <v-text-field
    v-model="searchQuery"
    label="Produkte durchsuchen..."
    prepend-inner-icon="mdi-magnify"
    clearable
    density="compact"
    hide-details
    class="mb-3"
  />
  ```

- Debounce wäre overkill hier weil:
  1. Filterung passiert client-side
  2. Vue's computed properties sind schon reactive
  3. Bei < 100 Produkten ist performance kein Problem

## Was wir daraus mitgenommen haben
Debouncing ist bei serverseitiger Suche wichtig, aber bei client-side filtering mit < 100 Items unnötig. Die computed property reagiert schnell genug auf jede Eingabe.

Die Suche sollte sowohl im Produktnamen als auch in den Tags suchen - das verbessert die UX erheblich weil man oft "Obst" sucht und nicht "Äpfel".

`toLowerCase()` + `includes()` ist für deutsche Umlaute wichtig weil sonst "ä" != "a" wäre.

## Key Takeaways
- Client-side filtering mit computed property
- `toLowerCase().includes()` für case-insensitive Suche
- Suche in Tags inkludieren
- Debounce nur bei API-Calls nötig
- `clearable` prop für einfach "x" zum Leeren
