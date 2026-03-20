# Tech-Doc: US-04 - Produkt zu Einkaufsliste hinzufügen

**Story:** #11 - Produkt hinzufügen  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-01 (Einkaufsliste erstellen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, Produkte zu einer Einkaufsliste hinzuzufügen. Produkte haben einen Pflichtfeld "Name" und ein optionales Feld "Preis". Die Erstellung erfolgt nach dem **Offline-First** Prinzip.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Pflichtfeld | Produktname ist erforderlich (darf nicht leer sein) |
| 2 | Optional | Preis kann eingegeben oder leer bleiben |
| 3 | Sofortige Anzeige | Produkt erscheint ohne Verzögerung |
| 4 | Validierung | Fehlermeldung bei leerem Namen |

---

## 3. UI/UX Anforderungen

### 3.1 Komponenten

| Komponente | Vuetify | Beschreibung |
|------------|---------|--------------|
| FAB | `v-btn` (fab) | "+" Button zum Öffnen |
| Dialog | `v-dialog` | Modal für Produkteingabe |
| Textfeld (Name) | `v-text-field` | Pflichtfeld |
| Textfeld (Preis) | `v-text-field` | Optionales Feld, type="number" |
| Buttons | `v-btn` | Abbrechen / Hinzufügen |

### 3.2 Validierung

```vue
<v-text-field
  v-model="productName"
  label="Produktname"
  :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
  prepend-inner-icon="mdi-food-apple"
  autofocus
/>

<v-text-field
  v-model.number="productPrice"
  label="Preis (optional)"
  type="number"
  step="0.01"
  min="0"
  prepend-inner-icon="mdi-currency-eur"
/>
```

### 3.3 Dialog-Layout

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 🛒 Neues Produkt         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🍎 Was brauchst du?      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💶 Preis (optional)      │ │
│  └───────────────────────────┘ │
│                                 │
│         [Abbrechen] [Hinzufügen] │
└─────────────────────────────────┘
```

---

## 4. Datenmodell

### 4.1 Product (Frontend)

```typescript
interface Product {
  id: string                    // UUID (client-generiert)
  listId: string               // Fremdschlüssel zur Liste
  name: string                  // Produktname
  price?: number               // Preis (optional, nullable)
  purchased: boolean           // Gekauft-Status (default: false)
  purchasedBy?: string          // Wer hat gekauft
  purchasedAt?: string          // Wann gekauft
  position: number             // Sortierreihenfolge
  createdAt: string             // ISO 8601
  updatedAt: string            // ISO 8601
  lastModified: string          // ISO 8601
  deletedAt?: string            // Soft-Delete
  version: number                // Für Konflikterkennung
  synced: boolean               // true = mit Server identisch
}
```

### 4.2 API-Request

```typescript
// POST /api/lists/{listId}/products
interface CreateProductRequest {
  name: string                  // Pflichtfeld
  price?: number | null         // Optional
}
```

### 4.3 API-Response

```typescript
interface CreateProductResponse {
  id: string
  listId: string
  name: string
  price: number | null
  purchased: boolean
  position: number
  version: number
  createdAt: string
  updatedAt: string
}
```

---

## 5. Implementierung

### 5.1 Frontend - useProducts Composable

```typescript
// src/composables/useProducts.ts

function generateUUID(): string {
  return crypto.randomUUID()
}

export function useProducts(listId: string) {
  const products = ref<Product[]>([])

  async function addProduct(payload: { name: string; price?: number | null }) {
    const now = new Date().toISOString()
    const tempId = generateUUID()

    const localProduct: Product = {
      id: tempId,
      listId,
      name: payload.name,
      price: payload.price ?? undefined,
      purchased: false,
      position: products.value.length,
      createdAt: now,
      updatedAt: now,
      lastModified: now,
      version: 0,
      synced: false,
    }

    // 1. Lokal speichern
    await db.products.add(localProduct)
    products.value.push(localProduct)

    // 2. Online? -> Server-Sync
    if (navigator.onLine) {
      try {
        const created = await productService.create(listId, payload)
        
        // 3. Server-ID updaten
        await db.products.update(tempId, {
          id: created.id,
          version: created.version,
          synced: true,
        })
        
        // 4. Lokal aktualisieren
        const idx = products.value.findIndex(p => p.id === tempId)
        if (idx !== -1) {
          products.value[idx] = { ...products.value[idx], id: created.id, version: created.version }
        }
        
        return created
      } catch (e) {
        // 5. Bei Fehler: Queue
        await syncService.addToQueue('create', 'product', tempId, { ...payload, listId })
      }
    } else {
      // 5. Offline: Queue
      await syncService.addToQueue('create', 'product', tempId, { ...payload, listId })
    }

    return products.value.find(p => p.id === tempId)
  }

  return { products, addProduct }
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

    @PostMapping
    public ResponseEntity<Product> create(
            @PathVariable UUID listId,
            @RequestBody @Valid CreateProductRequest request) {
        
        Product product = productService.create(listId, request.getName(), request.getPrice());
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
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
    private final ListRepository listRepository;

    @Transactional
    public Product create(UUID listId, String name, BigDecimal price) {
        // Prüfe ob Liste existiert
        ShoppingList list = listRepository.findById(listId)
            .orElseThrow(() -> new NotFoundException("List not found"));

        // Position = höchste Position + 1
        int maxPosition = productRepository.findMaxPositionByListId(listId);
        
        Product product = Product.builder()
            .list(list)
            .name(name)
            .price(price)
            .purchased(false)
            .position(maxPosition + 1)
            .version(1)
            .build();
        
        return productRepository.save(product);
    }
}
```

---

## 6. Frontend - ListView Komponente

```vue
<!-- src/views/ListView.vue -->

<template>
  <!-- FAB -->
  <v-btn
    v-if="products.length > 0"
    color="primary"
    icon="mdi-plus"
    position="fixed"
    location="bottom end"
    class="ma-6"
    elevation="8"
    @click="showAdd = true"
  />

  <!-- Add Dialog -->
  <v-dialog v-model="showAdd" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-package-variant-plus" />
        Neues Produkt
      </v-card-title>
      
      <v-card-text>
        <v-text-field
          v-model="newProductName"
          label="Was brauchst du?"
          placeholder="z.B. Milch, Brot, Eier..."
          prepend-inner-icon="mdi-food-apple"
          :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
          autofocus
          class="mb-4"
        />
        
        <v-text-field
          v-model.number="newProductPrice"
          label="Preis (optional)"
          type="number"
          step="0.01"
          min="0"
          prepend-inner-icon="mdi-currency-eur"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showAdd = false">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :disabled="!newProductName.trim()"
          @click="onAddProduct"
        >
          Hinzufügen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{ listId: string }>()
const { addProduct } = useProducts(props.listId)

const showAdd = ref(false)
const newProductName = ref('')
const newProductPrice = ref<number | undefined>(undefined)

async function onAddProduct() {
  const name = newProductName.value.trim()
  if (!name) return
  
  await addProduct({
    name,
    price: newProductPrice.value ?? null,
  })
  
  showAdd.value = false
  newProductName.value = ''
  newProductPrice.value = undefined
}
</script>
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|----------|-----------|--------------|
| POST | `/api/lists/{listId}/products` | `{ name, price? }` | `Product` | Produkt erstellen |
| GET | `/api/lists/{listId}/products` | - | `Product[]` | Alle Produkte abrufen |
| PUT | `/api/lists/{listId}/products/{productId}` | `{ name, price? }` | `Product` | Produkt aktualisieren |
| DELETE | `/api/lists/{listId}/products/{productId}` | - | - | Produkt löschen |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/addProduct.test.ts

describe('addProduct', () => {
  it('should add product with name', async () => {
    const result = await addProduct({ name: 'Milch', price: 2.99 })
    
    expect(result.name).toBe('Milch')
    expect(result.price).toBe(2.99)
    expect(result.purchased).toBe(false)
  })

  it('should allow null price', async () => {
    const result = await addProduct({ name: 'Brot' })
    
    expect(result.name).toBe('Brot')
    expect(result.price).toBeUndefined()
  })

  it('should assign position incrementally', async () => {
    await addProduct({ name: 'Item 1' })
    const item2 = await addProduct({ name: 'Item 2' })
    
    expect(item2.position).toBe(1)
  })
})
```

### 8.2 Integration Tests (Backend)

```java
// src/test/java/ProductControllerTest.java

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createProduct_shouldReturn201() throws Exception {
        UUID listId = UUID.randomUUID();
        
        mockMvc.perform(post("/api/lists/{listId}/products", listId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Milch\", \"price\": 2.99}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Milch"))
            .andExpect(jsonPath("$.price").value(2.99))
            .andExpect(jsonPath("$.purchased").value(false));
    }

    @Test
    void createProduct_withoutPrice_shouldSucceed() throws Exception {
        UUID listId = UUID.randomUUID();
        
        mockMvc.perform(post("/api/lists/{listId}/products", listId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Brot\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Brot"))
            .andExpect(jsonPath("$.price").doesNotExist());
    }
}
```

---

## 9. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-01 | Benötigt | Liste muss existieren |
| US-05 | Baut auf | Tags zuweisen |
| US-06 | Baut auf | Preis bearbeiten |
| US-07 | Baut auf | Als gekauft markieren |

---

## 10. Implementierungsreihenfolge

```
US-01 (Liste erstellen)
    └── US-04 (Produkt hinzufügen) ← DIESE STORY
            ├── US-06 (Preis bearbeiten)
            ├── US-05 (Tags zuweisen)
            ├── US-07 (Als gekauft markieren)
            │       └── US-08 (Wer/Wann anzeigen)
            ├── US-09 (Produkte durchsuchen)
            ├── US-10 (Produkt ausblenden)
            │       └── US-11 (Produkt wiederherstellen)
            └── US-23 (Drag & Drop sortieren)
```

---

## 11. Definition of Done

- [ ] Produkt-Dialog mit Vuetify implementiert und validiert
- [ ] Name ist Pflichtfeld (Validierung)
- [ ] Preis ist optional
- [ ] Lokales Speichern in Dexie.js funktioniert (inkl. Offline)
- [ ] REST-Endpunkt POST /api/lists/{listId}/products implementiert
- [ ] Produkt erscheint sofort in der Liste
- [ ] Unit-Tests (Vitest) vorhanden
- [ ] Unit-Tests (JUnit 5) für Backend vorhanden

---

## 12. Nächste Story

**US-06:** Preis bearbeiten - Ermöglicht das nachträgliche Eintragen oder Ändern von Preisen.
