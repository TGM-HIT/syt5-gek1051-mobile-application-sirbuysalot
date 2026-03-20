# Tech-Doc: US-11 - Produkt wiederherstellen

**Story:** #21 - Produkt wiederherstellen  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-10 (Produkt ausblenden)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, ausgeblendete Produkte wiederherzustellen. Die wiederhergestellten Produkte erscheinen wieder in der aktiven Einkaufsliste.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Ausgeblendete anzeigen | Liste der ausgeblendeten Produkte |
| 2 | Wiederherstellen-Button | Ein-Klick-Wiederherstellung |
| 3 | Alle wiederherstellen | Option "Alle wiederherstellen" |
| 4 | Sofortige Rückkehr | Produkt erscheint wieder in Liste |
| 5 | Offline-Support | Wiederherstellung funktioniert offline |

---

## 3. UI/UX Anforderungen

### 3.1 Wiederherstellen-Bereich

```
┌─────────────────────────────────────────┐
│  ─────────────────────────────────────  │
│  Ausgeblendete Produkte (2)    [👁️]    │
│  ─────────────────────────────────────  │
│  🗑️ Karotten              [↩️ Wiederherstellen] │
│  🗑️ Zwiebeln             [↩️ Wiederherstellen] │
│  ─────────────────────────────────────  │
│  [Alle wiederherstellen]               │
└─────────────────────────────────────────┘
```

### 3.2 Toggle-Button

```
┌─────────────────────────────────────────┐
│  Header mit Toggle:                     │
│  ─────────────────────────────────────  │
│  Einkaufsliste          👁️ [Ausblenden] │
│  12 Produkte                            │
└─────────────────────────────────────────┘

Nach Klick auf 👁️:
┌─────────────────────────────────────────┐
│  Header mit Toggle:                     │
│  ─────────────────────────────────────  │
│  Einkaufsliste          👁️ [Anzeigen]  │
│  12 Produkte + 3 ausgeblendet          │
└─────────────────────────────────────────┘
```

### 3.3 Design-Spezifikation

| Element | Style |
|---------|-------|
| Toggle-Icon | `mdi-eye-off` / `mdi-eye` |
| Badge | Anzahl ausgeblendete anzeigen |
| Restore-Button | `v-btn` mit `prepend-icon="mdi-restore"` |

---

## 4. Datenmodell

### 4.1 Wiederherstellen

```typescript
interface RestoreProductResponse {
  id: string
  deletedAt: null          // deletedAt wird auf null gesetzt
  version: number
}
```

### 4.2 API-Request

```typescript
// PATCH /api/lists/{listId}/products/{productId}/restore
interface RestoreProductResponse {
  id: string
  name: string
  deletedAt: null
  version: number
}
```

---

## 5. Implementierung

### 5.1 Frontend - ListView mit Restore

```vue
<!-- src/views/ListView.vue -->

<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <!-- Header -->
        <div class="d-flex align-center mb-4">
          <v-btn icon="mdi-arrow-left" variant="tonal" to="/" />
          <h1 class="text-h4 font-weight-bold ml-3">{{ listName }}</h1>
          <v-spacer />
          <v-badge
            v-if="hiddenProducts.length > 0"
            :content="hiddenProducts.length"
            color="grey"
            class="mr-2"
          >
            <v-btn
              :icon="showHidden ? 'mdi-eye' : 'mdi-eye-off'"
              variant="tonal"
              size="small"
              @click="showHidden = !showHidden"
            />
          </v-badge>
        </div>

        <!-- Hidden Products Section -->
        <v-expand-transition>
          <div v-if="showHidden && hiddenProducts.length > 0">
            <v-card class="mb-4 pa-2" color="grey-lighten-4">
              <div class="d-flex align-center justify-space-between mb-2 px-2">
                <span class="text-caption text-medium-emphasis font-weight-bold">
                  AUSGEBLENDETE ({{ hiddenProducts.length }})
                </span>
                <v-btn
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="restoreAll"
                >
                  Alle wiederherstellen
                </v-btn>
              </div>

              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="product in hiddenProducts"
                  :key="product.id"
                  class="mb-1"
                >
                  <template #prepend>
                    <v-icon icon="mdi-delete-outline" color="grey" size="20" />
                  </template>
                  
                  <v-list-item-title class="text-body-2">
                    {{ product.name }}
                  </v-list-item-title>
                  
                  <template #append>
                    <v-btn
                      icon="mdi-restore"
                      variant="text"
                      size="small"
                      color="primary"
                      @click="restoreProduct(product.id)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </div>
        </v-expand-transition>

        <!-- Active Products -->
        <transition-group name="product" tag="div">
          <v-card
            v-for="product in activeProducts"
            :key="product.id"
            class="mb-3"
            border
            @click="onTogglePurchase(product)"
          >
            <!-- ... product card ... -->
          </v-card>
        </transition-group>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProducts } from '@/composables/useProducts'

const listId = route.params.id as string
const { products, fetchProducts, hideProduct, restoreProduct: restoreFromService } = useProducts(listId)

const showHidden = ref(false)

const activeProducts = computed(() => 
  products.value.filter(p => !p.deletedAt)
)

const hiddenProducts = computed(() => 
  products.value.filter(p => p.deletedAt)
)

onMounted(() => {
  fetchProducts()
})

async function restoreProduct(productId: string) {
  await restoreFromService(productId)
  showSnackbar('Produkt wiederhergestellt', 'success')
}

async function restoreAll() {
  for (const product of hiddenProducts.value) {
    await restoreFromService(product.id)
  }
  showHidden.value = false
  showSnackbar(`${hiddenProducts.value.length} Produkte wiederhergestellt`, 'success')
}
</script>
```

### 5.2 Frontend - useProducts Erweiterung

```typescript
// src/composables/useProducts.ts

export function useProducts(listId: string) {
  // ... existing code ...

  async function restoreProduct(productId: string) {
    const now = new Date().toISOString()
    const product = products.value.find(p => p.id === productId)
    
    if (!product) {
      const dbProduct = await db.products.get(productId)
      if (dbProduct) {
        product = {
          id: dbProduct.id!,
          listId: dbProduct.listId,
          name: dbProduct.name,
          price: dbProduct.price ?? null,
          purchased: dbProduct.purchased,
          purchasedBy: dbProduct.purchasedBy ?? null,
          purchasedAt: dbProduct.purchasedAt ?? null,
          position: dbProduct.position ?? null,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          deletedAt: dbProduct.deletedAt ?? null,
          version: dbProduct.version,
          tags: [],
        }
      }
    }
    
    if (!product) return

    await db.products.update(productId, {
      deletedAt: undefined,
      lastModified: now,
      synced: false,
    })

    const restoredProduct = {
      ...product,
      deletedAt: null,
      updatedAt: now,
    }

    products.value.push(restoredProduct)

    if (navigator.onLine) {
      try {
        await productService.restore(listId, productId)
        await db.products.update(productId, { synced: true })
      } catch (e) {
        await syncService.addToQueue('update', 'product', productId, { deletedAt: null, listId })
      }
    } else {
      await syncService.addToQueue('update', 'product', productId, { deletedAt: null, listId })
    }
  }

  async function fetchProducts(includeHidden = false) {
    // ... existing code ...
    // Optionally load hidden products from server
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
    restoreProduct,
    removeProduct,
  }
}
```

### 5.3 Backend - ProductController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ProductController.java

@PatchMapping("/{productId}/restore")
public ResponseEntity<Product> restoreProduct(
        @PathVariable UUID listId,
        @PathVariable UUID productId) {
    
    Product product = productService.restoreProduct(listId, productId);
    return ResponseEntity.ok(product);
}

@GetMapping
public ResponseEntity<List<Product>> getProducts(
        @PathVariable UUID listId,
        @RequestParam(defaultValue = "false") boolean includeHidden) {
    
    List<Product> products = includeHidden 
        ? productService.getAllProductsIncludingHidden(listId)
        : productService.getActiveProducts(listId);
    
    return ResponseEntity.ok(products);
}
```

### 5.4 Backend - ProductService

```java
// src/main/java/at/tgm/sirbuysalot/service/ProductService.java

@Transactional
public Product restoreProduct(UUID listId, UUID productId) {
    Product product = productRepository.findByIdAndListId(productId, listId)
        .orElseThrow(() -> new NotFoundException("Product not found"));
    
    product.setDeletedAt(null);
    product.setVersion(product.getVersion() + 1);
    
    return productRepository.save(product);
}

public List<Product> getActiveProducts(UUID listId) {
    return productRepository.findByListIdAndDeletedAtIsNull(listId);
}

public List<Product> getAllProductsIncludingHidden(UUID listId) {
    return productRepository.findByListId(listId);
}
```

---

## 6. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| PATCH | `/api/lists/{listId}/products/{productId}/restore` | - | `Product` | Produkt wiederherstellen |
| GET | `/api/lists/{listId}/products` | `?includeHidden=true` | `Product[]` | Mit ausgeblendeten |

---

## 7. Tests

### 7.1 Unit Tests (Vitest)

```typescript
// src/tests/restoreProduct.test.ts

describe('Restore Product', () => {
  it('should clear deletedAt timestamp', async () => {
    const product = await addProduct({ name: 'Test' })
    await hideProduct(product.id)
    
    const hidden = await db.products.get(product.id)
    expect(hidden?.deletedAt).toBeDefined()
    
    await restoreProduct(product.id)
    
    const restored = await db.products.get(product.id)
    expect(restored?.deletedAt).toBeUndefined()
  })

  it('should add product back to active list', async () => {
    const product = await addProduct({ name: 'Test' })
    await hideProduct(product.id)
    expect(activeProducts.value.length).toBe(0)
    
    await restoreProduct(product.id)
    
    expect(activeProducts.value.length).toBe(1)
    expect(activeProducts.value[0].id).toBe(product.id)
  })

  it('should restore multiple products at once', async () => {
    const p1 = await addProduct({ name: 'Test 1' })
    const p2 = await addProduct({ name: 'Test 2' })
    
    await hideProduct(p1.id)
    await hideProduct(p2.id)
    
    await restoreAll()
    
    expect(activeProducts.value.length).toBe(2)
  })
})
```

---

## 8. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-10 | Benötigt | Produkt muss ausgeblendet sein |

---

## 9. Definition of Done

- [ ] Toggle-Button zum Ein-/Ausblenden der ausgeblendeten Produkte
- [ ] Liste der ausgeblendeten Produkte mit Wiederherstellen-Button
- [ ] Einzelne Wiederherstellung funktioniert
- [ ] "Alle wiederherstellen" funktioniert
- [ ] deletedAt wird auf null gesetzt
- [ ] Produkt erscheint wieder in aktiver Liste
- [ ] Snackbar-Bestätigung
- [ ] Offline-Support
- [ ] Unit-Tests vorhanden

---

## 10. Nächste Story

**US-15:** Liste ausblenden - Ermöglicht das Soft-Delete ganzer Einkaufslisten.
