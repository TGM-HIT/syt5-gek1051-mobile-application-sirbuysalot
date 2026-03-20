# Tech-Doc: US-01 - Neue Einkaufsliste erstellen

**Story:** #10 - Neue Einkaufsliste mit Namen erstellen  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, neue Einkaufslisten mit einem Namen zu erstellen. Die Erstellung erfolgt nach dem **Offline-First** Prinzip - die Liste wird zuerst lokal gespeichert und dann mit dem Server synchronisiert.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Dialog öffnen | FAB oder Button öffnet Vuetify v-dialog |
| 2 | Validierung | Listenname darf nicht leer sein |
| 3 | Lokale Speicherung | Sofort in Dexie.js (synced: false) |
| 4 | Server-Sync | POST /api/lists bei bestehender Verbindung |
| 5 | UUID-Generierung | Client-seitig generiert für Konfliktlösung |
| 6 | Reaktivität | Liste erscheint sofort in der Übersicht |
| 7 | Offline-Modus | Funktioniert auch ohne Internet |

---

## 3. UI/UX Anforderungen

### 3.1 Komponenten

| Komponente | Vuetify | Beschreibung |
|------------|----------|--------------|
| FAB | `v-btn` (fab) | "+" Button zum Öffnen des Dialogs |
| Dialog | `v-dialog` | Modal für Listennamen-Eingabe |
| Textfeld | `v-text-field` | Name-Eingabe mit Validierung |
| Buttons | `v-btn` | Abbrechen / Erstellen |

### 3.2 Validierung

```vue
<v-text-field
  v-model="listName"
  :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
  label="Listenname"
  autofocus
/>
```

### 3.3 Dialog-Layout

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 📋 Neue Liste             │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Listenname eingeben...    │ │
│  └───────────────────────────┘ │
│                                 │
│         [Abbrechen] [Erstellen] │
└─────────────────────────────────┘
```

---

## 4. Datenmodell

### 4.1 ShoppingList (Frontend)

```typescript
interface ShoppingList {
  id: string                    // UUID (client-generiert)
  name: string                  // Name der Liste
  accessCode?: string           // Einladungscode (server-generiert)
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  lastModified: string          // ISO 8601 (für Sync)
  deletedAt?: string            // Soft-Delete
  version: number              // Für Konflikterkennung
  synced: boolean              // true = mit Server identisch
}
```

### 4.2 API-Request

```typescript
// POST /api/lists
interface CreateListRequest {
  name: string
}
```

### 4.3 API-Response

```typescript
interface CreateListResponse {
  id: string
  name: string
  accessCode: string
  version: number
  createdAt: string
  updatedAt: string
}
```

---

## 5. Implementierung

### 5.1 Frontend - useShoppingLists Composable

```typescript
// src/composables/useShoppingLists.ts

function generateUUID(): string {
  return crypto.randomUUID()
}

async function createList(name: string) {
  const now = new Date().toISOString()
  const tempId = generateUUID()  // Client-generierte UUID

  const localList: ShoppingList = {
    id: tempId,
    name,
    createdAt: now,
    updatedAt: now,
    lastModified: now,
    version: 0,
    synced: false,
  }

  // 1. Lokal speichern
  await db.shoppingLists.add(localList)
  lists.value.unshift(localList)

  // 2. Online? -> Server-Sync
  if (navigator.onLine) {
    try {
      const created = await listService.create({ name })
      
      // 3. Server-ID updaten und als synced markieren
      await db.shoppingLists.update(tempId, {
        id: created.id,
        version: created.version,
        synced: true,
      })
      
      // 4. Lokale Liste mit Server-Daten aktualisieren
      const idx = lists.value.findIndex(l => l.id === tempId)
      if (idx !== -1) {
        lists.value[idx] = { ...lists.value[idx], id: created.id, version: created.version }
      }
      
      return created
    } catch (e) {
      // 5. Bei Fehler: Zur Queue hinzufügen
      await syncService.addToQueue('create', 'list', tempId, { name })
    }
  } else {
    // 5. Offline: Zur Queue hinzufügen
    await syncService.addToQueue('create', 'list', tempId, { name })
  }

  return lists.value.find(l => l.id === tempId)
}
```

### 5.2 Backend - ListController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ListController.java

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class ListController {

    private final ListService listService;

    @PostMapping
    public ResponseEntity<ShoppingList> create(@RequestBody @Valid CreateListRequest request) {
        ShoppingList list = listService.create(request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(list);
    }
}
```

### 5.3 Backend - ListService

```java
// src/main/java/at/tgm/sirbuysalot/service/ListService.java

@Service
@RequiredArgsConstructor
public class ListService {

    private final ListRepository listRepository;

    @Transactional
    public ShoppingList create(String name) {
        ShoppingList list = ShoppingList.builder()
            .name(name)
            .accessCode(generateAccessCode())  // Server-generiert
            .version(1)
            .build();
        
        return listRepository.save(list);
    }

    private String generateAccessCode() {
        // 6-stelliger alphanumerischer Code
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
```

---

## 6. Frontend - HomeView Komponente

```vue
<!-- src/views/HomeView.vue -->

<template>
  <!-- FAB zum Öffnen -->
  <v-btn
    v-if="lists.length > 0"
    color="primary"
    icon="mdi-plus"
    position="fixed"
    location="bottom end"
    class="ma-6"
    elevation="8"
    @click="showCreate = true"
  />

  <!-- Create Dialog -->
  <v-dialog v-model="showCreate" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-playlist-plus" />
        Neue Liste
      </v-card-title>
      
      <v-card-text>
        <v-text-field
          v-model="newListName"
          label="Listenname"
          :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
          autofocus
          @keyup.enter="onCreateList"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showCreate = false">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :disabled="!newListName.trim()"
          @click="onCreateList"
        >
          Erstellen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const showCreate = ref(false)
const newListName = ref('')

const { createList } = useShoppingLists()

async function onCreateList() {
  const name = newListName.value.trim()
  if (!name) return
  
  await createList(name)
  showCreate.value = false
  newListName.value = ''
}
</script>
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|----------|-----------|--------------|
| POST | `/api/lists` | `{ name }` | `ShoppingList` | Neue Liste erstellen |
| GET | `/api/lists` | - | `ShoppingList[]` | Alle Listen abrufen |
| GET | `/api/lists/{id}` | - | `ShoppingList` | Einzelne Liste |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/createList.test.ts

describe('createList', () => {
  it('should create a list with UUID', async () => {
    const name = 'Test Liste'
    const result = await createList(name)
    
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)  // UUID Format
    expect(result.name).toBe(name)
    expect(result.synced).toBe(false)
  })

  it('should save locally first', async () => {
    const name = 'Offline Test'
    await createList(name)
    
    const local = await db.shoppingLists.toArray()
    expect(local.length).toBeGreaterThan(0)
  })

  it('should validate empty name', async () => {
    const name = '   '
    // Validierung sollte Fehler werfen
    expect(() => validateName(name)).toThrow()
  })
})
```

### 8.2 Integration Tests (Backend)

```java
// src/test/java/ListControllerTest.java

@WebMvcTest(ListController.class)
class ListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createList_shouldReturn201() throws Exception {
        mockMvc.perform(post("/api/lists")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Test Liste\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Test Liste"))
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.accessCode").exists());
    }
}
```

---

## 9. Abhängigkeiten

| Story | Abhängigkeit | Beschreibung |
|-------|--------------|--------------|
| US-02 | Benötigt US-01 | Listen bearbeiten |
| US-03 | Benötigt US-01 | Beitreten |
| US-04 | Benötigt US-01 | Produkte hinzufügen |

---

## 10. Definition of Done

- [ ] Vuetify-Dialog zum Erstellen implementiert und validiert
- [ ] Lokales Speichern in Dexie.js funktioniert (inkl. Offline-Modus getestet)
- [ ] REST-Endpunkt POST /api/lists im Spring Boot Backend implementiert
- [ ] Synchronisation nach Offline-Phase via Batch-Request verifiziert
- [ ] Unit-Test (Vitest) für lokale Speicher-Logik vorhanden
- [ ] Unit-Test (JUnit 5) für Controller/Service vorhanden
- [ ] Code Review bestanden und in dev gemergt

---

## 11. Nächste Story

**US-02:** Listennamen bearbeiten - Ermöglicht das Umbenennen bestehender Listen.
