# Tech-Doc: US-08 - Wer/Wann anzeigen

**Story:** #14 - Wer/Wann anzeigen  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-07 (Als gekauft markieren)

---

## 1. Überblick

Diese Story zeigt bei markierten Produkten den Namen des Benutzers und die Uhrzeit der Markierung an. Dies verhindert Doppelkäufe und macht den Einkaufsprozess transparent.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Anzeigename | Name des Käufers wird angezeigt |
| 2 | Uhrzeit | Zeitstempel der Markierung |
| 3 | Formatierung | "Käufer · HH:MM" Format |
| 4 | Aktualisierung | Info aktualisiert sich bei Statusänderung |
| 5 | Anonym | Wenn kein Name vorhanden, anonym anzeigen |

---

## 3. UI/UX Anforderungen

### 3.1 Gekauftes Produkt mit Info

```
┌─────────────────────────────────────────┐
│  [✓] 🍎 Äpfel                [€2,99]  │
│       [Obst] [Bio]                      │
│       ✓ Max Muster · 14:32             │ ← Käufer + Uhrzeit
└─────────────────────────────────────────┘
```

### 3.2 Design-Spezifikation

| Element | Style |
|---------|-------|
| Käufer-Info | `text-caption text-medium-emphasis` |
| Icon | `mdi-check-circle` (12px, success color) |
| Trennung | ` · ` (Mittepunkt) |
| Format Zeit | `HH:MM` (24-Stunden) |

---

## 4. Datenmodell

### 4.1 Product mit Käuferspur

```typescript
interface Product {
  // ... existing fields ...
  purchased: boolean
  purchasedBy?: string           // Anzeigename des Käufers
  purchasedAt?: string           // ISO 8601 Timestamp
}
```

### 4.2 Backend - Product Entity

```java
// Product.java

@Entity
public class Product {
    private Boolean purchased = false;
    private String purchasedBy;
    private LocalDateTime purchasedAt;
    // ...
}
```

---

## 5. Implementierung

### 5.1 Frontend - ListView mit Käuferinfo

```vue
<!-- src/views/ListView.vue -->

<template>
  <!-- Product list item -->
  <v-card
    v-for="product in products"
    :key="product.id"
    class="mb-3 product-card"
    :class="{ 'product-purchased': product.purchased }"
    border
    @click="onTogglePurchase(product)"
  >
    <div class="d-flex align-center pa-4">
      <v-checkbox-btn
        :model-value="product.purchased"
        :color="product.purchased ? 'success' : 'primary'"
        class="mr-3 flex-shrink-0"
        @click.stop="onTogglePurchase(product)"
      />

      <div class="flex-grow-1 min-width-0">
        <!-- Product name -->
        <div
          class="text-subtitle-1 font-weight-medium"
          :class="{ 'text-decoration-line-through text-medium-emphasis': product.purchased }"
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

        <!-- Purchased by info -->
        <div
          v-if="product.purchased && product.purchasedBy"
          class="text-caption text-medium-emphasis mt-1 d-flex align-center"
        >
          <v-icon icon="mdi-check-circle" size="12" color="success" class="mr-1" />
          {{ product.purchasedBy }}{{ formatTime(product.purchasedAt) }}
        </div>
      </div>

      <!-- Price badge -->
      <v-chip
        v-if="product.price != null"
        :color="product.purchased ? 'success' : 'primary'"
        variant="tonal"
        size="small"
        class="ml-2 flex-shrink-0 font-weight-bold"
      >
        {{ formatPrice(product.price) }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useProducts } from '@/composables/useProducts'
import { useUser } from '@/composables/useUser'
import type { Product } from '@/types'

const listId = route.params.id as string
const { displayName } = useUser()
const { togglePurchase } = useProducts(listId)

async function onTogglePurchase(product: Product) {
  await togglePurchase(product.id, displayName())
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return ` · ${date.toLocaleTimeString('de-AT', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}
</script>
```

### 5.2 Backend - ProductService (togglePurchase)

```java
// src/main/java/at/tgm/sirbuysalot/service/ProductService.java

@Transactional
public Product togglePurchase(UUID productId, String purchasedBy) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new NotFoundException("Product not found"));
    
    boolean newPurchasedState = !product.getPurchased();
    product.setPurchased(newPurchasedState);
    
    if (newPurchasedState) {
        product.setPurchasedBy(purchasedBy);
        product.setPurchasedAt(LocalDateTime.now());
    } else {
        product.setPurchasedBy(null);
        product.setPurchasedAt(null);
    }
    
    product.setVersion(product.getVersion() + 1);
    return productRepository.save(product);
}
```

### 5.3 Backend - ProductController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ProductController.java

@PatchMapping("/{productId}/purchase")
public ResponseEntity<Product> togglePurchase(
        @PathVariable UUID listId,
        @PathVariable UUID productId,
        @RequestBody TogglePurchaseRequest request) {
    
    Product product = productService.togglePurchase(productId, request.getPurchasedBy());
    return ResponseEntity.ok(product);
}
```

---

## 6. useUser Composable

```typescript
// src/composables/useUser.ts

import { ref } from 'vue'

const displayName = ref<string | null>(null)

export function useUser() {
  function setDisplayName(name: string) {
    displayName.value = name
    localStorage.setItem('user_displayName', name)
  }

  function loadDisplayName() {
    displayName.value = localStorage.getItem('user_displayName')
  }

  function getDisplayName(): string {
    if (!displayName.value) {
      loadDisplayName()
    }
    return displayName.value || 'Unbekannt'
  }

  return {
    displayName,
    setDisplayName,
    loadDisplayName,
    getDisplayName,
  }
}
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| PATCH | `/api/lists/{listId}/products/{productId}/purchase` | `{ purchasedBy }` | `Product` | Kauf-Status toggeln |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/purchaseInfo.test.ts

describe('Purchase Info', () => {
  it('should display purchaser name', () => {
    const product = {
      purchased: true,
      purchasedBy: 'Max Muster',
      purchasedAt: '2024-01-15T14:32:00.000Z'
    }
    
    const info = formatPurchaseInfo(product)
    expect(info).toContain('Max Muster')
    expect(info).toContain('14:32')
  })

  it('should format time correctly', () => {
    expect(formatTime('2024-01-15T09:05:00.000Z')).toBe(' · 09:05')
    expect(formatTime('2024-01-15T23:59:00.000Z')).toBe(' · 23:59')
  })

  it('should not show info for unpurchased products', () => {
    const product = {
      purchased: false,
      purchasedBy: null,
      purchasedAt: null
    }
    
    const info = formatPurchaseInfo(product)
    expect(info).toBe('')
  })
})
```

### 8.2 Integration Tests (Backend)

```java
// src/test/java/ProductControllerTest.java

@Test
void togglePurchase_shouldSetPurchasedByAndTime() throws Exception {
    UUID productId = UUID.randomUUID();
    
    mockMvc.perform(patch("/api/lists/{listId}/products/{productId}/purchase", 
            listId, productId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"purchasedBy\": \"Max Muster\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.purchased").value(true))
        .andExpect(jsonPath("$.purchasedBy").value("Max Muster"))
        .andExpect(jsonPath("$.purchasedAt").exists());
}
```

---

## 9. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-07 | Benötigt | Kauf-Status muss existieren |
| US-03 | Benötigt | DisplayName kommt vom Beitritt |

---

## 10. Definition of Done

- [ ] Käuferinfo wird bei gekauften Produkten angezeigt
- [ ] Format: "Name · HH:MM"
- [ ] purchaseBy und purchaseAt werden korrekt gesetzt
- [ ] displayName wird aus useUser geladen
- [ ] Zeitformatierung mit Intl.DateTimeFormat
- [ ] Unit-Tests vorhanden

---

## 11. Nächste Story

**US-09:** Produkte durchsuchen - Ermöglicht das Filtern von Produkten nach Namen.
