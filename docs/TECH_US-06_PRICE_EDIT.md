# Tech-Doc: US-06 - Preis bearbeiten

**Story:** #12 - Preis bearbeiten  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-04 (Produkt hinzufügen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, den Preis eines Produkts nachträglich einzutragen oder zu ändern. Preise sind optional und werden mit dem Währungssymbol (EUR) angezeigt.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Inline-Bearbeitung | Preis kann direkt in der Produktzeile bearbeitet werden |
| 2 | Dialog-Bearbeitung | Optional: Dialog für detaillierte Bearbeitung |
| 3 | Numerische Validierung | Nur Dezimalzahlen erlaubt |
| 4 | Währungsformat | Anzeige mit EUR-Symbol |
| 5 | Preis optional | Preis kann auch entfernt werden |
| 6 | Offline-Support | Preisänderungen funktionieren offline |

---

## 3. UI/UX Anforderungen

### 3.1 Inline-Preis-Bearbeitung

```
┌─────────────────────────────────────────┐
│  [✓] 🍎 Äpfel                [€2,99 📝] │
│       [Obst] [Bio]                      │
│                                         │
│  [ ] 🥕 Karotten                       │
│       [Gemüse]                         │
└─────────────────────────────────────────┘

Beim Klick auf Preis oder Stift-Icon:
┌─────────────────────────────────────────┐
│  [✓] 🍎 Äpfel                ┌────────┐ │
│       [Obst] [Bio]           │2,99 EUR│ │
│                              └────────┘ │
└─────────────────────────────────────────┘
```

### 3.2 Preis-Dialog

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 💶 Preis bearbeiten       │ │
│  └───────────────────────────┘ │
│                                 │
│  Produkt: Äpfel                 │
│                                 │
│  ┌───────────────────────────┐ │
│  │  2,99                     │ │
│  │  €                        │ │
│  └───────────────────────────┘ │
│                                 │
│  [Preis entfernen]              │
│                                 │
│         [Abbrechen] [Speichern] │
└─────────────────────────────────┘
```

### 3.3 Preis-Anzeige

| Preis vorhanden | Preis fehlt |
|----------------|-------------|
| `€2,99` (tonal chip) | `-` oder leer |
| Grün wenn gekauft | Grau wenn ungekauft |

---

## 4. Datenmodell

### 4.1 Product Update

```typescript
interface UpdateProductRequest {
  name?: string
  price?: number | null        // null = Preis entfernen
  position?: number
}
```

### 4.2 API-Request

```typescript
// PUT /api/lists/{listId}/products/{productId}
interface UpdateProductPayload {
  price?: number | null
}
```

---

## 5. Implementierung

### 5.1 Frontend - ListView mit Preis-Bearbeitung

```vue
<!-- src/views/ListView.vue -->

<template>
  <!-- Product list with editable price -->
  <v-card
    v-for="product in products"
    :key="product.id"
    class="mb-3 product-card"
    :class="{ 'product-purchased': product.purchased }"
    border
  >
    <div class="d-flex align-center pa-4">
      <v-checkbox-btn
        :model-value="product.purchased"
        :color="product.purchased ? 'success' : 'primary'"
        class="mr-3 flex-shrink-0"
        @click="onTogglePurchase(product)"
      />

      <div class="flex-grow-1 min-width-0">
        <!-- Product name -->
        <div
          class="text-subtitle-1 font-weight-medium"
          :class="{ 'text-decoration-line-through text-medium-emphasis': product.purchased }"
          @click="startEditingPrice(product)"
        >
          {{ product.name }}
        </div>

        <!-- Tags -->
        <div v-if="product.tags?.length" class="mt-1 d-flex flex-wrap ga-1">
          <v-chip
            v-for="tag in product.tags"
            :key="tag.id"
            size="x-small"
            variant="tonal"
            color="secondary"
          >
            {{ tag.name }}
          </v-chip>
        </div>
      </div>

      <!-- Price display / edit -->
      <div class="ml-2 flex-shrink-0">
        <template v-if="editingPriceId === product.id">
          <v-text-field
            v-model.number="editingPrice"
            type="number"
            step="0.01"
            min="0"
            density="compact"
            hide-details
            autofocus
            style="width: 100px"
            @blur="savePrice(product)"
            @keyup.enter="savePrice(product)"
            @keyup.escape="cancelPriceEdit"
          />
        </template>
        <template v-else>
          <v-chip
            :color="product.purchased ? 'success' : 'primary'"
            variant="tonal"
            size="small"
            class="font-weight-bold"
            @click="startEditingPrice(product)"
          >
            {{ product.price != null ? formatPrice(product.price) : '-' }}
            <v-icon v-if="product.price != null" icon="mdi-pencil" size="12" class="ml-1" />
          </v-chip>
        </template>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import type { Product } from '@/types'

const { updateProduct } = useProducts(listId)

const editingPriceId = ref<string | null>(null)
const editingPrice = ref<number | null>(null)

function startEditingPrice(product: Product) {
  editingPriceId.value = product.id
  editingPrice.value = product.price ?? null
}

function cancelPriceEdit() {
  editingPriceId.value = null
  editingPrice.value = null
}

async function savePrice(product: Product) {
  await updateProduct(product.id, {
    price: editingPriceId.value ? editingPrice.value : undefined
  })
  editingPriceId.value = null
  editingPrice.value = null
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}
</script>
```

### 5.2 Backend - ProductController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ProductController.java

@PutMapping("/{productId}")
public ResponseEntity<Product> update(
        @PathVariable UUID listId,
        @PathVariable UUID productId,
        @RequestBody @Valid UpdateProductRequest request) {
    
    Product updated = productService.update(
        listId,
        productId,
        request.getName(),
        request.getPrice(),
        request.getPosition()
    );
    
    return ResponseEntity.ok(updated);
}
```

### 5.3 Backend - ProductService

```java
// src/main/java/at/tgm/sirbuysalot/service/ProductService.java

@Transactional
public Product update(UUID listId, UUID productId, String name, 
                      BigDecimal price, Integer position) {
    Product product = productRepository.findByIdAndListId(productId, listId)
        .orElseThrow(() -> new NotFoundException("Product not found"));
    
    if (name != null) {
        product.setName(name);
    }
    if (price != null) {
        product.setPrice(price);
    }
    if (position != null) {
        product.setPosition(position);
    }
    
    product.setVersion(product.getVersion() + 1);
    return productRepository.save(product);
}
```

---

## 6. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| PUT | `/api/lists/{listId}/products/{productId}` | `{ name?, price?, position? }` | `Product` | Produkt aktualisieren |
| PATCH | `/api/lists/{listId}/products/{productId}/price` | `{ price }` | `Product` | Nur Preis aktualisieren |

---

## 7. Tests

### 7.1 Unit Tests (Vitest)

```typescript
// src/tests/priceEdit.test.ts

describe('Price editing', () => {
  it('should update product price', async () => {
    const product = await addProduct({ name: 'Milch', price: null })
    
    await updateProduct(product.id, { price: 2.99 })
    
    const updated = products.value.find(p => p.id === product.id)
    expect(updated?.price).toBe(2.99)
  })

  it('should format price as EUR', () => {
    expect(formatPrice(2.99)).toBe('2,99 €')
    expect(formatPrice(10)).toBe('10,00 €')
  })

  it('should allow removing price', async () => {
    const product = await addProduct({ name: 'Test', price: 5 })
    
    await updateProduct(product.id, { price: null })
    
    const updated = products.value.find(p => p.id === product.id)
    expect(updated?.price).toBeNull()
  })

  it('should validate numeric input', async () => {
    // Non-numeric input should be rejected by v-text-field type="number"
    const input = 'abc'
    const parsed = parseFloat(input)
    expect(isNaN(parsed)).toBe(true)
  })
})
```

### 7.2 Integration Tests (Backend)

```java
// src/test/java/ProductControllerTest.java

@Test
void updateProductPrice_shouldReturn200() throws Exception {
    UUID listId = UUID.randomUUID();
    UUID productId = UUID.randomUUID();
    
    mockMvc.perform(put("/api/lists/{listId}/products/{productId}", listId, productId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"price\": 2.99}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.price").value(2.99));
}

@Test
void updateProductPrice_null_shouldRemovePrice() throws Exception {
    UUID listId = UUID.randomUUID();
    UUID productId = UUID.randomUUID();
    
    mockMvc.perform(put("/api/lists/{listId}/products/{productId}", listId, productId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"price\": null}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.price").doesNotExist());
}
```

---

## 8. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-04 | Benötigt | Produkt muss existieren |
| US-22 | Baut auf | Gesamtkosten anzeigen |

---

## 9. Definition of Done

- [ ] Inline-Preis-Bearbeitung implementiert (Klick auf Preis öffnet Eingabefeld)
- [ ] Numerische Validierung (nur Dezimalzahlen)
- [ ] EUR-Formatierung mit Intl.NumberFormat
- [ ] Preis kann auf null gesetzt werden
- [ ] useProducts.updateProduct() für Preis-Updates
- [ ] Offline-Support für Preisänderungen
- [ ] Unit-Tests vorhanden

---

## 10. Nächste Story

**US-07:** Als gekauft markieren - Ermöglicht das Markieren von Produkten als gekauft.
