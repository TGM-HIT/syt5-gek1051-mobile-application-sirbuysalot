# Offline-Speicherung Technische Dokumentation

**Story ID:** 12  
**Priorität:** Must Have (MH)  
**Aufwand:** 8 Story Points  
**Abhängigkeit:** Grundvoraussetzung für Story ID 13 (Auto-Sync)

---

## 1. Überblick

Diese Dokumentation beschreibt die Offline-Speicherungsarchitektur der SirBuysALot PWA. Alle CRUD-Operationen können ohne aktive Netzwerkverbindung durchgeführt werden, wobei Änderungen lokal mit Zeitstempel gespeichert werden.

---

## 2. Architektur

### 2.1 Datenfluss

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (PWA)                            │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐  │
│  │ Vue 3 UI    │────▶│ Composable   │────▶│ IndexedDB       │  │
│  │ Components  │     │ (CRUD)      │     │ (Dexie.js)      │  │
│  └─────────────┘     └──────────────┘     └─────────────────┘  │
│                              │                      │           │
│                              ▼                      ▼           │
│                      ┌──────────────┐     ┌─────────────────┐  │
│                      │ OnlineStatus │     │ SyncQueue       │  │
│                      │ Composable   │     │ (Pending Ops)   │  │
│                      └──────────────┘     └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                                        │
            │ Online                                │ Offline
            ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Server)                          │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐  │
│  │ REST API    │────▶│ Spring Boot  │────▶│ PostgreSQL 16   │  │
│  │ (Axios)     │     │ Controllers   │     │ (Source of Truth)│  │
│  └─────────────┘     └──────────────┘     └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Schlüsselkomponenten

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| Datenbank | `src/db/index.ts` | Dexie.js IndexedDB-Instanz |
| Sync-Service | `src/services/syncService.ts` | Queue-Management für Offline-Operationen |
| Online-Status | `src/composables/useOnlineStatus.ts` | Online/Offline-Erkennung |
| Shopping Lists | `src/composables/useShoppingLists.ts` | CRUD für Einkaufslisten |
| Products | `src/composables/useProducts.ts` | CRUD für Produkte |

---

## 3. Datenbank-Schema

### 3.1 IndexedDB-Tabellen (Dexie.js)

```typescript
// Version 2 Schema
{
  shoppingLists: {
    keyPath: 'id',
    indexes: ['id', 'name', 'accessCode', 'lastModified']
  },
  products: {
    keyPath: 'id',
    indexes: ['id', 'listId', 'name', 'purchased', 'lastModified']
  },
  tags: {
    keyPath: 'id',
    indexes: ['id', 'name', 'listId']
  },
  productTags: {
    keyPath: ['productId', 'tagId'],
    indexes: ['productId', 'tagId']
  },
  syncQueue: {
    keyPath: 'id',
    indexes: ['id', 'entity', 'entityId', 'timestamp']
  }
}
```

### 3.2 Datenmodelle

#### ShoppingList
```typescript
interface ShoppingList {
  id?: string          // UUID (Client-generiert)
  name: string
  accessCode?: string
  createdAt: string    // ISO 8601 Timestamp
  updatedAt: string    // ISO 8601 Timestamp
  lastModified: string // ISO 8601 Timestamp (für Sync)
  deletedAt?: string
  version: number      // Für Konflikterkennung
  synced: boolean      // true = mit Server identisch
}
```

#### Product
```typescript
interface Product {
  id?: string          // UUID (Client-generiert)
  listId: string
  name: string
  price?: number
  purchased: boolean
  purchasedBy?: string
  purchasedAt?: string
  position: number
  createdAt: string
  updatedAt: string
  lastModified: string
  deletedAt?: string
  version: number
  synced: boolean
}
```

#### SyncOperation
```typescript
interface SyncOperation {
  id?: number          // Auto-Inkrement
  type: 'create' | 'update' | 'delete'
  entity: 'list' | 'product'
  entityId: string
  payload: any         // Änderungsdaten
  timestamp: string    // ISO 8601
  synced: boolean      // false = muss noch synchronisiert werden
}
```

---

## 4. Funktionsweise

### 4.1 CRUD-Operationen (Offline-First)

Alle Operationen folgen dem gleichen Muster:

```typescript
async function createItem(data) {
  // 1. Lokal speichern
  const localItem = {
    ...data,
    id: crypto.randomUUID(),  // Client-generierte UUID
    version: 0,
    synced: false,
    lastModified: new Date().toISOString()
  }
  await db.items.add(localItem)
  
  // 2. UI aktualisieren
  items.value.push(localItem)
  
  // 3. Online? -> API-Call
  if (navigator.onLine) {
    try {
      await api.create(data)
      await db.items.update(localItem.id, { synced: true })
    } catch (e) {
      // 4. API-Fehler -> Queue
      await syncService.addToQueue('create', 'item', localItem.id, data)
    }
  } else {
    // 4. Offline -> Queue
    await syncService.addToQueue('create', 'item', localItem.id, data)
  }
}
```

### 4.2 Sync-Queue

Die Sync-Queue speichert alle Änderungen, die noch nicht mit dem Server synchronisiert wurden:

```typescript
// Queue hinzufügen
await syncService.addToQueue('create', 'list', tempId, { name })

// Queue verarbeiten (bei Online-Gehen)
await syncService.processQueue()

// Queue-Größe prüfen
const pendingCount = await syncService.getPendingCount()
```

### 4.3 Online/Offline-Erkennung

```typescript
// Event-Listener
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)

// Automatischer Sync bei Online-Gehen
watch(isOnline, async (online) => {
  if (online) {
    await syncService.processQueue()
  }
})
```

---

## 5. UI-Indikator

### 5.1 Offline-Banner

In `App.vue` wird ein Banner angezeigt, wenn der Benutzer offline ist:

```vue
<v-banner v-if="!isOnline" color="warning" class="offline-banner">
  <v-banner-text>
    Offline-Modus ({{ pendingCount }} Änderungen warten auf Sync)
  </v-banner-text>
</v-banner>
```

### 5.2 Styling

Das Offline-Banner:
- Position: sticky (oben)
- Farbe: warning (Orange/Gelb)
- Icon: mdi-wifi-off
- Zeigt Anzahl der ausstehenden Änderungen

---

## 6. Akzeptanzkriterien-Erfüllung

| Kriterium | Status | Implementierung |
|-----------|--------|-----------------|
| Volle CRUD-Offline-Funktionalität | ✅ | `useShoppingLists`, `useProducts` |
| IndexedDB-Integration | ✅ | `db/index.ts` mit Dexie.js |
| Zeitstempel für Änderungen | ✅ | `lastModified`, `timestamp` in SyncOperation |
| UI-Indikator | ✅ | Offline-Banner in `App.vue` |
| Sync-Markierung | ✅ | `synced: false` für lokale Änderungen |

---

## 7. Fehlerbehebungen (in dieser Implementierung)

1. **Sync-Button-Logik**: Button war im Offline-Banner mit `v-if="isOnline"` -> nie sichtbar
2. **pendingSyncCount**: Nicht mit App.vue synchronisiert
3. **useOnlineStatus**: Watcher für Online-Events hinzugefügt
4. **TypeScript-Typen**: Dexie-Update-Specs mit `null`-Kompatibilität

---

## 8. Tests

Tests befinden sich in `src/tests/`:
- `offline.test.ts` - 16 Tests für Offline-Logik
- `useOnlineStatus.test.ts` - 8 Tests für Online-Status

Ausführung:
```bash
npm test
```

---

## 9. Abhängigkeiten

| Paket | Version | Verwendung |
|-------|---------|------------|
| dexie | ^4.0.11 | IndexedDB Wrapper |
| vue | ^3.4.0 | Framework |
| vuetify | ^3.7.4 | UI-Komponenten |
| vitest | ^2.1.0 | Testing |

---

## 10. Nächste Schritte

- **Story 13**: Auto-Sync implementieren (automatische Synchronisation im Hintergrund)
- **Konfliktlösung**: Server-Wins-Strategie bei Version-Konflikten
- **E2E-Tests**: Playwright-Tests für echte Offline-Szenarien
