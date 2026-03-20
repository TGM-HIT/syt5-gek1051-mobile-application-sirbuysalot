# Tech-Doc: US-10 - Produkt ausblenden

**Story:** #15 - Produkt ausblenden  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-04 (Produkt hinzufügen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, Produkte aus der aktiven Ansicht auszublenden (Soft Delete). Die Daten bleiben in der Datenbank erhalten und können später wiederhergestellt werden.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Swipe-to-hide | Wischen nach links zeigt "Ausblenden" |
| 2 | Button-Option | Kontextmenü oder Button zum Ausblenden |
| 3 | Sofortiges Ausblenden | Produkt verschwindet aus der Liste |
| 4 | Soft-Delete | Daten bleiben in DB (deletedAt Timestamp) |
| 5 | Offline-Support | Ausblenden funktioniert offline |

---

## 3. UI/UX Anforderungen

### 3.1 Swipe-Geste

```
Normal:                    Swipe Links:
┌──────────────────────┐  ┌──────────────────────┐
│ [✓] 🍎 Äpfel    [€2] │  │              [✓] 🍎 Äpfel    [€2] │
└──────────────────────┘  └──────────────────────┘
                              ←─────────
                                Rot (Ausblenden)

                              ←─────────
                                    └──────────────────────┐
              ←─────────              │  🗑️ Ausblenden   │
                                       └──────────────────────┘
```

### 3.2 Swipe-Aktion

| Richtung | Aktion |
|----------|--------|
| Links wischen | Ausblenden (Delete) |
| Rechts wischen | Als gekauft markieren |

### 3.3 Design-Spezifikation

| Element | Style |
|---------|-------|
| Swipe-Background | Rot (#F44336) mit Mülleimer-Icon |
| Haptic Feedback | Vibration bei Aktion (mobile) |
| Undo-Snackbar | "Produkt ausgeblendet" + Undo-Button (5s) |

---

## 4. Datenmodell

### 4.1 Product mit Soft-Delete

```typescript
interface Product {
  // ... existing fields ...
  deletedAt?: string            // ISO 8601 - wenn gesetzt, ist Produkt ausgeblendet
}
```

### 4.2 API-Request

```typescript
// DELETE /api/lists/{listId}/products/{productId}
// oder
// PATCH /api/lists/{listId}/products/{productId}/hide
interface HideProductResponse {
  id: string
  deletedAt: string
}
```

---

## 5. Implementierung

### 5.1 Frontend - Swipeable Product Card

```vue
<!-- src/components/SwipeableProductCard.vue -->

<template>
  <div class="swipe-container" ref="containerRef">
    <!-- Background actions -->
    <div class="swipe-action left" @click="$emit('toggle-purchase')">
      <v-icon icon="mdi-check" color="white" />
    </div>
    <div class="swipe-action right" @click="$emit('hide')">
      <v-icon icon="mdi-delete" color="white" />
    </div>

    <!-- Main card -->
    <v-card
      class="product-card"
      :class="{ 'product-purchased': product.purchased }"
      :style="{ transform: `translateX(${offsetX}px)` }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- ... product content ... -->
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'hide'): void
  (e: 'toggle-purchase'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const offsetX = ref(0)
const startX = ref(0)
const SWIPE_THRESHOLD = 100

function onTouchStart(e: TouchEvent) {
  startX.value = e.touches[0].clientX
}

function onTouchMove(e: TouchEvent) {
  const currentX = e.touches[0].clientX
  const diff = currentX - startX.value
  offsetX.value = Math.max(-150, Math.min(150, diff))
}

function onTouchEnd() {
  if (offsetX.value < -SWIPE_THRESHOLD) {
    emit('hide')
  } else if (offsetX.value > SWIPE_THRESHOLD) {
    emit('toggle-purchase')
  }
  offsetX.value = 0
}
</script>

<style scoped>
.swipe-container {
  position: relative;
  overflow: hidden;
}

.swipe-action {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-action.left {
  left: 0;
  background: #4CAF50; /* Green for purchase */
}

.swipe-action.right {
  right: 0;
  background: #F44336; /* Red for hide */
}

.product-card {
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;
}
</style>
```

### 5.2 Alternative: Vuetify v-slide-group

```vue
<!-- src/components/ProductListItem.vue -->

<template>
  <v-list-item
    class="product-item"
    @click="$emit('toggle')"
  >
    <template #prepend>
      <v-checkbox-btn :model-value="product.purchased" />
    </template>
    
    <v-list-item-title :class="{ 'text-decoration-line-through': product.purchased }">
      {{ product.name }}
    </v-list-item-title>
    
    <template #append>
      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        size="small"
        @click.stop="$emit('hide')"
      />
    </template>
  </v-list-item>
</template>
```

### 5.3 Frontend - useProducts Erweiterung

```typescript
// src/composables/useProducts.ts

export function useProducts(listId: string) {
  // ... existing code ...

  async function hideProduct(productId: string) {
    const now = new Date().toISOString()
    
    await db.products.update(productId, {
      deletedAt: now,
      lastModified: now,
      synced: false,
    })
    
    products.value = products.value.filter(p => p.id !== productId)

    if (navigator.onLine) {
      try {
        await productService.hide(listId, productId)
        await db.products.update(productId, { synced: true })
      } catch (e) {
        await syncService.addToQueue('delete', 'product', productId, { listId })
      }
    } else {
      await syncService.addToQueue('delete', 'product', productId, { listId })
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    togglePurchase,
    hideProduct,
    removeProduct, // hard delete
  }
}
```

### 5.4 Backend - ProductController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ProductController.java

@DeleteMapping("/{productId}")
public ResponseEntity<Product> hideProduct(
        @PathVariable UUID listId,
        @PathVariable UUID productId) {
    
    Product product = productService.hideProduct(listId, productId);
    return ResponseEntity.ok(product);
}
```

### 5.5 Backend - ProductService

```java
// src/main/java/at/tgm/sirbuysalot/service/ProductService.java

@Transactional
public Product hideProduct(UUID listId, UUID productId) {
    Product product = productRepository.findByIdAndListId(productId, listId)
        .orElseThrow(() -> new NotFoundException("Product not found"));
    
    product.setDeletedAt(LocalDateTime.now());
    product.setVersion(product.getVersion() + 1);
    
    return productRepository.save(product);
}
```

---

## 6. Undo-Funktion

```typescript
// src/views/ListView.vue

const snackbar = ref(false)
const undoProduct = ref<Product | null>(null)

async function onHideProduct(product: Product) {
  undoProduct.value = { ...product }
  await hideProduct(product.id)
  
  snackbar.value = true
  
  // Undo-Timeout
  setTimeout(() => {
    undoProduct.value = null
  }, 5000)
}

async function onUndoHide() {
  if (undoProduct.value) {
    await restoreProduct(undoProduct.value.id)
    undoProduct.value = null
  }
  snackbar.value = false
}
```

```vue
<v-snackbar v-model="snackbar" :timeout="5000">
  Produkt ausgeblendet
  <template #actions>
    <v-btn variant="text" @click="onUndoHide">
      Rückgängig
    </v-btn>
    <v-btn variant="text" @click="snackbar = false">
      Schließen
    </v-btn>
  </template>
</v-snackbar>
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| DELETE | `/api/lists/{listId}/products/{productId}` | - | `Product` | Produkt ausblenden (soft delete) |
| GET | `/api/lists/{listId}/products?includeHidden=true` | - | `Product[]` | Inkl. ausgeblendete |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/hideProduct.test.ts

describe('Hide Product', () => {
  it('should set deletedAt timestamp', async () => {
    const product = await addProduct({ name: 'Test' })
    
    await hideProduct(product.id)
    
    const updated = await db.products.get(product.id)
    expect(updated?.deletedAt).toBeDefined()
  })

  it('should remove from visible list', async () => {
    const product = await addProduct({ name: 'Test' })
    expect(products.value.length).toBe(1)
    
    await hideProduct(product.id)
    
    expect(products.value.length).toBe(0)
  })

  it('should allow undo within timeout', async () => {
    const product = await addProduct({ name: 'Test' })
    
    await hideProduct(product.id)
    await restoreProduct(product.id)
    
    const restored = products.value.find(p => p.id === product.id)
    expect(restored).toBeDefined()
    expect(restored?.deletedAt).toBeNull()
  })
})
```

---

## 9. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-04 | Benötigt | Produkt muss existieren |
| US-11 | Baut auf | Wiederherstellen |

---

## 10. Definition of Done

- [ ] Swipe-Geste zum Ausblenden (links wischen)
- [ ] Alternativ: Button im Kontextmenü
- [ ] deletedAt wird gesetzt
- [ ] Produkt verschwindet aus aktiver Liste
- [ ] Undo-Snackbar mit 5s Timeout
- [ ] Offline-Support für hideProduct
- [ ] Unit-Tests vorhanden

---

## 11. Nächste Story

**US-11:** Produkt wiederherstellen - Ermöglicht das Wiederherstellen ausgeblendeter Produkte.
