# Tech-Doc: US-07 - Produkt als "gekauft" markieren

**Story:** #19 - Als gekauft markieren/entmarkieren  
**Story Points:** 5  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-04 (Produkt hinzufügen)  
**Folgt auf:** US-08 (Wer/Wann anzeigen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, Produkte als "gekauft" zu markieren oder diese Markierung wieder aufzuheben. Die visuelle Darstellung erfolgt durchgestrichen und ausgegraut. Die Änderung wird lokal gespeichert, synchronisiert und in Echtzeit an alle verbundenen Clients über WebSocket verteilt.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Markieren | Klick/Tap markiert Produkt als "gekauft" |
| 2 | Visuell | Durchgestrichen + ausgegraut |
| 3 | Entmarkieren | Erneuter Klick hebt Markierung auf |
| 4 | Lokale Speicherung | Mit Zeitstempel in Dexie.js |
| 5 | WebSocket | Echtzeit-Verteilung an alle Clients |
| 6 | Offline | Funktioniert auch ohne Internet |

---

## 3. UI/UX Anforderungen

### 3.1 Visuelle Darstellung

| Zustand | CSS/Classes | Beschreibung |
|---------|--------------|--------------|
| Nicht gekauft | Normal | Vollständig sichtbar |
| Gekauft | `text-decoration: line-through`<br>`opacity: 0.7` | Durchgestrichen, ausgegraut |

### 3.2 Produkt-Karte Layout

```
┌────────────────────────────────────────────┐
│ [✓] │ Produktname                  │ €2,99 │
│      │ Gekauft von: Max • 14:30    │        │
│      │ 🏷️ Tag1  🏷️ Tag2           │        │
└────────────────────────────────────────────┘
     ↑ Checkbox + Klick auf Karte
```

### 3.3 Vuetify-Styling

```vue
<v-card
  :class="{ 'product-purchased': product.purchased }"
  @click="onTogglePurchase(product)"
>
  <div class="d-flex align-center">
    <v-checkbox-btn :model-value="product.purchased" />
    
    <div>
      <div
        class="text-subtitle-1"
        :class="{ 'text-decoration-line-through text-medium-emphasis': product.purchased }"
      >
        {{ product.name }}
      </div>
      
      <div v-if="product.purchased && product.purchasedBy" class="text-caption">
        {{ product.purchasedBy }} · {{ formatTime(product.purchasedAt) }}
      </div>
    </div>
  </div>
</v-card>

<style scoped>
.product-purchased {
  opacity: 0.7;
}
</style>
```

---

## 4. Datenmodell

### 4.1 Erweiterung Product

```typescript
interface Product {
  // ... bestehende Felder
  purchased: boolean              // Gekauft-Status
  purchasedBy?: string            // Anzeigename des Käufers
  purchasedAt?: string            // ISO 8601 Timestamp
}
```

### 4.2 API-Request (PATCH)

```typescript
// PATCH /api/lists/{listId}/products/{productId}/purchase
interface TogglePurchaseRequest {
  purchasedBy: string              // Anzeigename des aktuellen Benutzers
}
```

### 4.3 API-Response

```typescript
interface TogglePurchaseResponse {
  id: string
  purchased: boolean
  purchasedBy: string
  purchasedAt: string             // Neuer Timestamp
  version: number
}
```

---

## 5. Implementierung

### 5.1 Frontend - useProducts Composable

```typescript
// src/composables/useProducts.ts

export function useProducts(listId: string) {
  const products = ref<Product[]>([])

  async function togglePurchase(productId: string, displayName: string) {
    const product = products.value.find(p => p.id === productId)
    if (!product) return

    const now = new Date().toISOString()
    const purchased = !product.purchased
    const purchasedAt = purchased ? now : undefined
    const purchasedBy = purchased ? displayName : undefined

    // 1. Lokal aktualisieren
    const localProduct = await db.products.get(productId)
    if (localProduct) {
      await db.products.update(productId, {
        purchased,
        purchasedBy,
        purchasedAt,
        lastModified: now,
        synced: false,
      })
    }

    // 2. UI aktualisieren
    const idx = products.value.findIndex(p => p.id === productId)
    if (idx !== -1) {
      products.value[idx] = {
        ...products.value[idx],
        purchased,
        purchasedBy: purchasedBy ?? null,
        purchasedAt: purchasedAt ?? null,
        updatedAt: now,
      }
    }

    // 3. Online? -> Server-Sync
    if (navigator.onLine) {
      try {
        const updated = await productService.togglePurchase(listId, productId, displayName)
        await db.products.update(productId, {
          version: updated.version,
          synced: true,
        })
        
        const idx2 = products.value.findIndex(p => p.id === productId)
        if (idx2 !== -1) {
          products.value[idx2].version = updated.version
        }
      } catch (e) {
        await syncService.addToQueue('update', 'product', productId, {
          purchased,
          purchasedBy,
          listId,
        })
      }
    } else {
      await syncService.addToQueue('update', 'product', productId, {
        purchased,
        purchasedBy,
        listId,
      })
    }
  }

  return { products, togglePurchase }
}
```

### 5.2 Backend - ProductController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ProductController.java

@RestController
@RequestMapping("/api/lists/{listId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final SimpMessagingTemplate messagingTemplate;

    @PatchMapping("/{productId}/purchase")
    public ResponseEntity<Product> togglePurchase(
            @PathVariable UUID listId,
            @PathVariable UUID productId,
            @RequestBody TogglePurchaseRequest request) {
        
        Product updated = productService.togglePurchase(listId, productId, request.getPurchasedBy());
        
        // WebSocket: An alle Clients der Liste senden
        messagingTemplate.convertAndSend(
            "/topic/lists/" + listId + "/products",
            updated
        );
        
        return ResponseEntity.ok(updated);
    }
}
```

### 5.3 Backend - ProductService

```java
// src/main/java/at/tgm/sirbuysalot/service/ProductService.java

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public Product togglePurchase(UUID listId, UUID productId, String purchasedBy) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found"));
        
        // Toggle Status
        boolean newStatus = !product.getPurchased();
        product.setPurchased(newStatus);
        product.setPurchasedBy(newStatus ? purchasedBy : null);
        product.setPurchasedAt(newStatus ? LocalDateTime.now() : null);
        product.setVersion(product.getVersion() + 1);
        
        return productRepository.save(product);
    }
}
```

---

## 6. WebSocket Integration

### 6.1 Frontend - WebSocket Service

```typescript
// src/services/websocketService.ts

import { ref } from 'vue'

const isConnected = ref(false)
const subscribers = new Map<string, Function[]>()

export function connectWebSocket(listId: string) {
  const ws = new WebSocket('ws://localhost:8080/ws')
  
  ws.onopen = () => {
    isConnected.value = true
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE',
      topic: `/topic/lists/${listId}/products`
    }))
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    const handlers = subscribers.get(data.topic)
    handlers?.forEach(handler => handler(data.payload))
  }

  return ws
}

export function subscribe(topic: string, handler: Function) {
  if (!subscribers.has(topic)) {
    subscribers.set(topic, [])
  }
  subscribers.get(topic)!.push(handler)
}

export function unsubscribe(topic: string, handler: Function) {
  const handlers = subscribers.get(topic)
  if (handlers) {
    const index = handlers.indexOf(handler)
    if (index > -1) handlers.splice(index, 1)
  }
}
```

### 6.2 WebSocket Config (Backend)

```java
// src/main/java/at/tgm/sirbuysalot/config/WebSocketConfig.java

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS();
    }
}
```

---

## 7. Frontend - ListView Komponente

```vue
<!-- src/views/ListView.vue -->

<template>
  <v-card
    v-for="product in products"
    :key="product.id"
    :class="{ 'product-purchased': product.purchased }"
    class="mb-3"
    border
    @click="onTogglePurchase(product)"
  >
    <div class="d-flex align-center pa-4">
      <v-checkbox-btn
        :model-value="product.purchased"
        :color="product.purchased ? 'success' : 'primary'"
        class="mr-3"
      />

      <div class="flex-grow-1">
        <div
          class="text-subtitle-1 font-weight-medium"
          :class="{ 'text-decoration-line-through text-medium-emphasis': product.purchased }"
        >
          {{ product.name }}
        </div>

        <!-- Wer/Wann Info (siehe US-08) -->
        <div
          v-if="product.purchased && product.purchasedBy"
          class="text-caption text-medium-emphasis mt-1"
        >
          <v-icon icon="mdi-check-circle" size="12" color="success" class="mr-1" />
          {{ product.purchasedBy }} · {{ formatTime(product.purchasedAt) }}
        </div>
      </div>

      <v-chip
        v-if="product.price != null"
        :color="product.purchased ? 'success' : 'primary'"
        variant="tonal"
        size="small"
      >
        {{ formatPrice(product.price) }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
const { togglePurchase } = useProducts(props.listId)
const { displayName } = useUser()

async function onTogglePurchase(product: Product) {
  await togglePurchase(product.id, displayName())
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(price)
}
</script>

<style scoped>
.product-purchased {
  opacity: 0.7;
}
</style>
```

---

## 8. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|----------|---------|--------------|
| PATCH | `/api/lists/{listId}/products/{productId}/purchase` | `{ purchasedBy }` | `Product` | Kauf-Status toggeln |

### 8.1 WebSocket Topics

| Topic | Nachricht | Beschreibung |
|-------|-----------|--------------|
| `/topic/lists/{listId}/products` | `Product` | Update an alle Clients |

---

## 9. Tests

### 9.1 Unit Tests (Vitest)

```typescript
// src/tests/togglePurchase.test.ts

describe('togglePurchase', () => {
  it('should toggle purchased status', async () => {
    const product = await addProduct({ name: 'Test' })
    
    expect(product.purchased).toBe(false)
    
    await togglePurchase(product.id, 'Max')
    
    const updated = products.value.find(p => p.id === product.id)
    expect(updated?.purchased).toBe(true)
    expect(updated?.purchasedBy).toBe('Max')
  })

  it('should set purchasedAt timestamp when marking', async () => {
    await togglePurchase(productId, 'Max')
    
    const updated = products.value.find(p => p.id === productId)
    expect(updated?.purchasedAt).toBeDefined()
  })

  it('should clear purchasedBy when unmarking', async () => {
    await togglePurchase(productId, 'Max')   // Markieren
    await togglePurchase(productId, 'Max')   // Entmarkieren
    
    const updated = products.value.find(p => p.id === productId)
    expect(updated?.purchased).toBe(false)
    expect(updated?.purchasedBy).toBeNull()
  })
})
```

### 9.2 Backend Tests

```java
// src/test/java/ProductControllerTest.java

@Test
void togglePurchase_shouldToggleStatus() throws Exception {
    UUID listId = UUID.randomUUID();
    UUID productId = UUID.randomUUID();
    
    mockMvc.perform(patch("/api/lists/{listId}/products/{productId}/purchase", listId, productId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"purchasedBy\": \"Max\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.purchased").value(true))
        .andExpect(jsonPath("$.purchasedBy").value("Max"));
}
```

---

## 10. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-04 | Benötigt | Produkt muss existieren |
| **US-08** | **Folgt direkt** | Wer/Wann anzeigen |

---

## 11. Definition of Done

- [ ] Toggle-Funktion implementiert
- [ ] Visuell korrekte Darstellung (durchgestrichen, ausgegraut)
- [ ] Lokales Speichern in Dexie.js mit Zeitstempel
- [ ] Echtzeit-Verteilung via WebSocket
- [ ] Synchronisation nach Offline-Phase
- [ ] Unit-Tests (Vitest) vorhanden
- [ ] Unit-Tests (JUnit 5) vorhanden

---

## 12. Nächste Story

**US-08:** Wer/Wann anzeigen - Zeigt den Namen und die Uhrzeit des Käufers an.
