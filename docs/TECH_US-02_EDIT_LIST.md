# Tech-Doc: US-02 - Listennamen bearbeiten

**Story:** #9 - Listennamen bearbeiten  
**Story Points:** 3  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-01 (Einkaufsliste erstellen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, den Namen einer bestehenden Einkaufsliste zu bearbeiten. Die Änderung erfolgt nach dem **Offline-First** Prinzip - der Name wird zuerst lokal gespeichert und dann mit dem Server synchronisiert.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Bearbeitung öffnen | Langes Drücken oder Kontextmenü öffnet Bearbeitungsmodus |
| 2 | Dialog öffnen | Bearbeitungs-Dialog erscheint mit aktuellem Namen |
| 3 | Validierung | Neuer Name darf nicht leer sein |
| 4 | Lokale Speicherung | Sofort in Dexie.js (synced: false) |
| 5 | Server-Sync | PUT /api/lists/{id} bei bestehender Verbindung |
| 6 | Reaktivität | Name ändert sich sofort in der Übersicht |
| 7 | Offline-Modus | Funktioniert auch ohne Internet |

---

## 3. UI/UX Anforderungen

### 3.1 Komponenten

| Komponente | Vuetify | Beschreibung |
|------------|---------|--------------|
| List Item | `v-card` | Zeigt Listennamen |
| Long Press / Context | - | Öffnet Bearbeitungsoptionen |
| Bearbeiten-Button | `v-btn` | Icon mdi-pencil |
| Dialog | `v-dialog` | Modal für Namensänderung |
| Textfeld | `v-text-field` | Name-Eingabe mit Validierung |
| Buttons | `v-btn` | Abbrechen / Speichern |

### 3.2 Trigger-Optionen

**Option A: Long Press**
```vue
<v-card @click="openList" @contextmenu.prevent="showEditMenu">
```

**Option B: Inline-Bearbeitung**
```vue
<div class="list-header" @dblclick="startEditing">
  <v-text-field
    v-if="editing"
    v-model="editName"
    @blur="saveEdit"
    @keyup.enter="saveEdit"
  />
  <span v-else>{{ list.name }}</span>
  <v-btn icon="mdi-pencil" size="small" @click="startEditing" />
</div>
```

### 3.3 Dialog-Layout

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ ✏️ Liste umbenennen       │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Aktueller Name...        │ │
│  └───────────────────────────┘ │
│                                 │
│         [Abbrechen] [Speichern] │
└─────────────────────────────────┘
```

---

## 4. Datenmodell

### 4.1 ShoppingList Update

```typescript
interface UpdateListRequest {
  name: string                  // Neuer Name
}
```

### 4.2 API-Request

```typescript
// PUT /api/lists/{id}
interface UpdateListPayload {
  name: string
}
```

### 4.3 API-Response

```typescript
interface UpdateListResponse {
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

### 5.1 Frontend - useShoppingLists Composable (bestehend erweitern)

```typescript
// src/composables/useShoppingLists.ts

export function useShoppingLists() {
  // ... existing code ...

  async function updateList(id: string, payload: Partial<ShoppingList>) {
    const now = new Date().toISOString()
    const localList = await db.shoppingLists.get(id)

    if (localList) {
      const updateData: Partial<DbShoppingList> = {
        lastModified: now,
        synced: false,
      }
      if (payload.name !== undefined) {
        updateData.name = payload.name
      }
      await db.shoppingLists.update(id, updateData)
    }

    const idx = lists.value.findIndex(l => l.id === id)
    if (idx !== -1) {
      lists.value[idx] = { ...lists.value[idx], ...payload, updatedAt: now }
    }

    if (navigator.onLine) {
      try {
        const updated = await listService.update(id, payload)
        await db.shoppingLists.update(id, { version: updated.version, synced: true })
        const idx2 = lists.value.findIndex(l => l.id === id)
        if (idx2 !== -1) {
          lists.value[idx2] = { ...lists.value[idx2], version: updated.version }
        }
        return updated
      } catch (e) {
        await syncService.addToQueue('update', 'list', id, payload)
      }
    } else {
      await syncService.addToQueue('update', 'list', id, payload)
    }

    return lists.value.find(l => l.id === id)
  }

  return { lists, loading, error, fetchLists, createList, updateList, removeList }
}
```

### 5.2 Backend - ListController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ListController.java

@PutMapping("/{id}")
public ResponseEntity<ShoppingList> update(
        @PathVariable UUID id,
        @RequestBody @Valid UpdateListRequest request) {
    
    ShoppingList updated = listService.update(id, request.getName());
    return ResponseEntity.ok(updated);
}
```

### 5.3 Backend - ListService

```java
// src/main/java/at/tgm/sirbuysalot/service/ListService.java

@Transactional
public ShoppingList update(UUID id, String name) {
    ShoppingList list = listRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("List not found"));
    
    list.setName(name);
    list.setVersion(list.getVersion() + 1);
    
    return listRepository.save(list);
}
```

---

## 6. Frontend - HomeView Komponente (Erweiterung)

```vue
<!-- src/views/HomeView.vue -->

<template>
  <!-- List cards with edit option -->
  <v-card
    v-for="list in lists"
    :key="list.id"
    :to="`/list/${list.id}`"
    class="mb-3 list-card"
    border
    hover
    @contextmenu.prevent="openEditMenu(list)"
  >
    <div class="d-flex align-center pa-4">
      <!-- ... existing content ... -->
      
      <!-- Edit button -->
      <v-btn
        icon="mdi-pencil"
        variant="text"
        size="small"
        @click.prevent="openEditDialog(list)"
      />
    </div>
  </v-card>

  <!-- Edit dialog -->
  <v-dialog v-model="showEdit" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-pencil" class="mr-2" />
        Liste umbenennen
      </v-card-title>
      
      <v-card-text>
        <v-text-field
          v-model="editName"
          label="Neuer Name"
          :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
          autofocus
          @keyup.enter="onSaveEdit"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showEdit = false">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :disabled="!editName.trim()"
          @click="onSaveEdit"
        >
          Speichern
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
// ... existing setup ...

const showEdit = ref(false)
const editName = ref('')
const editingList = ref<ShoppingList | null>(null)

function openEditDialog(list: ShoppingList) {
  editingList.value = list
  editName.value = list.name
  showEdit.value = true
}

async function onSaveEdit() {
  if (!editingList.value || !editName.value.trim()) return
  
  await updateList(editingList.value.id, { name: editName.value.trim() })
  showEdit.value = false
  editingList.value = null
  editName.value = ''
}
</script>
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| PUT | `/api/lists/{id}` | `{ name }` | `ShoppingList` | Liste aktualisieren |
| GET | `/api/lists/{id}` | - | `ShoppingList` | Einzelne Liste abrufen |

---

## 8. Tests

### 8.1 Unit Tests (Vitest)

```typescript
// src/tests/updateList.test.ts

describe('updateList', () => {
  it('should update list name locally', async () => {
    const list = await createList('Original Name')
    
    await updateList(list.id, { name: 'New Name' })
    
    const updated = lists.value.find(l => l.id === list.id)
    expect(updated?.name).toBe('New Name')
  })

  it('should mark as unsynced', async () => {
    const list = await createList('Test')
    await updateList(list.id, { name: 'Updated' })
    
    const local = await db.shoppingLists.get(list.id)
    expect(local?.synced).toBe(false)
  })

  it('should validate empty name', async () => {
    const list = await createList('Test')
    // Empty name should be rejected
    expect(() => validateName('')).toThrow()
  })
})
```

### 8.2 Integration Tests (Backend)

```java
// src/test/java/ListControllerTest.java

@Test
void updateList_shouldReturn200() throws Exception {
    UUID listId = UUID.randomUUID();
    
    mockMvc.perform(put("/api/lists/{id}", listId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\": \"Neuer Name\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Neuer Name"));
}
```

---

## 9. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-01 | Benötigt | Liste muss existieren |
| US-03 | Baut auf | Zugangscode generieren |
| US-15 | Baut auf | Liste ausblenden |

---

## 10. Definition of Done

- [ ] Bearbeitungs-Trigger implementiert (Button/Kontextmenü)
- [ ] Vuetify-Dialog zum Umbenennen implementiert und validiert
- [ ] Lokale Speicherung in Dexie.js (synced: false)
- [ ] REST-Endpunkt PUT /api/lists/{id} im Backend implementiert
- [ ] Offline-Modus funktioniert
- [ ] Unit-Tests vorhanden

---

## 11. Nächste Story

**US-03:** Zugangscode generieren & beitreten - Ermöglicht das Teilen von Listen mit anderen Benutzern.
