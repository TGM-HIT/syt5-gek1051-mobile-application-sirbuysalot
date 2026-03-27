# Prompt: Implementing Drag & Drop with vuedraggable

## When
Late March 2026, working on US-23

## Context
We wanted users to be able to reorder products within a shopping list by dragging and dropping. Vuetify doesn't have a built-in draggable list component, so we looked at vuedraggable which is a Vue 3 wrapper for SortableJS.

## Prompt (exact wording)
"I'm building a shopping list app with Vue 3 and Vuetify 3. I need drag and drop functionality for reordering products within a list. I installed vuedraggable but I'm confused about how to use it with v-model and how to sync the order back to my backend. Can you show me a working example?"

## Ergebnis
- vuedraggable eingebunden mit:
  ```typescript
  import draggable from 'vuedraggable'
  ```
  
- Template mit v-model:
  ```vue
  <draggable
    v-model="draggableProducts"
    item-key="id"
    handle=".drag-handle"
    animation="200"
    ghost-class="drag-ghost"
    @end="onDragEnd"
  >
    <template #item="{ element: product }">
      <!-- product card -->
    </template>
  </draggable>
  ```

- Computed Property für v-model binding:
  ```typescript
  const draggableProducts = computed({
    get: () => sortedProducts.value,
    set: (val: Product[]) => {
      val.forEach((p, idx) => {
        const original = products.value.find((o) => o.id === p.id)
        if (original) original.position = idx
      })
    },
  })
  ```

- Backend-Aufruf für Persistenz:
  ```typescript
  async function onDragEnd() {
    const order = products.value.map((p, idx) => ({ id: p.id, position: idx }))
    try {
      await productService.reorder(listId, order)
    } catch {
      // silent fail - local order still applies
    }
  }
  ```

## Was wir daraus mitgenommen haben
vuedraggable mit Vue 3 Composition API braucht eine computed property mit getter/setter weil das v-model direkt an eine gefilterte/sortierte Liste gebunden ist. Ohne computed würde die originale products-Liste nicht aktualisiert werden.

Die `@end` Event ist wichtig - darin sollte der Backend-Call passieren. Die Positionen werden lokal sofort aktualisiert für smooth UX, der Backend-Call ist fire-and-forget weil ein Fehler hier nicht kritisch ist.

## Key Takeaways
- `item-key="id"` ist required
- `handle=".drag-handle"` für Touch-freundliche Bedienung
- `ghost-class` für visuelle Rückmeldung beim Drag
- Backend-Call sollte im `@end` Event sein, nicht `@change`
- Lokale Position sofort aktualisieren für smooth UX
