# Offline-Speicherung Technische Dokumentation

**Story ID:** 12  
**Priorität:** Must Have (MH)  
**Aufwand:** 8 Story Points  
**Abhängigkeit:** Grundvoraussetzung für Story ID 13 (Auto-Sync)  
**Letzte Aktualisierung:** 2026-03-19

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
| API-Service | `src/services/api.ts` | Axios HTTP-Client |
| List-Service | `src/services/listService.ts` | REST-Aufrufe für Listen |
| Product-Service | `src/services/productService.ts` | REST-Aufrufe für Produkte |

---

## 3. Datenbank-Schema

### 3.1 IndexedDB-Tabellen (Dexie.js)

```typescript
// Version 2 Schema - Database Name: 'sirbuysalot'
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

**Hinweis:** Das `synced`-Flag wird NICHT als Index verwendet (boolean ist kein gültiger IndexableType in IndexedDB).

### 3.2 Datenmodelle

#### ShoppingList
```typescript
interface ShoppingList {
  id?: string          // UUID (Client-generiert für Offline)
  name: string
  accessCode?: string
  createdAt: string    // ISO 8601 Timestamp
  updatedAt: string    // ISO 8601 Timestamp
  lastModified: string // ISO 8601 Timestamp (für Sync-Reihenfolge)
  deletedAt?: string   // Soft-Delete
  version: number      // Für Konflikterkennung (Server-seitig)
  synced: boolean      // true = mit Server identisch
}
```

#### Product
```typescript
interface Product {
  id?: string          // UUID (Client-generiert für Offline)
  listId: string       // Fremdschlüssel zur Liste
  name: string
  price?: number
  purchased: boolean
  purchasedBy?: string
  purchasedAt?: string
  position: number     // Sortierreihenfolge
  createdAt: string
  updatedAt: string
  lastModified: string
  deletedAt?: string   // Soft-Delete
  version: number
  synced: boolean
}
```

#### SyncOperation
```typescript
interface SyncOperation {
  id?: number                    // Auto-Inkrement
  type: 'create' | 'update' | 'delete'
  entity: 'list' | 'product'
  entityId: string               // Lokale UUID
  payload: any                   // Änderungsdaten
  timestamp: string               // ISO 8601
  synced: boolean                // false = muss noch synchronisiert werden
}
```

#### Tag (zusätzlich)
```typescript
interface Tag {
  id?: string
  name: string
  listId: string
}
```

#### ProductTag (M2M Beziehung)
```typescript
interface ProductTag {
  productId: string
  tagId: string
}
```

---

## 4. API-Endpunkte

### 4.1 Backend REST-API

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/lists` | Alle Listen des Benutzers |
| GET | `/api/lists/{id}` | Einzelne Liste abrufen |
| POST | `/api/lists` | Neue Liste erstellen |
| PUT | `/api/lists/{id}` | Liste aktualisieren |
| DELETE | `/api/lists/{id}` | Liste löschen |
| GET | `/api/lists/{id}/products` | Alle Produkte einer Liste |
| POST | `/api/lists/{id}/products` | Produkt erstellen |
| PUT | `/api/lists/{listId}/products/{productId}` | Produkt aktualisieren |
| PATCH | `/api/lists/{listId}/products/{productId}/purchase` | Kauf-Status toggle |
| DELETE | `/api/lists/{listId}/products/{productId}` | Produkt löschen |

### 4.2 Frontend API-Konfiguration

```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:8080/api',  // Für Produktion: Relative URL
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000  // 10 Sekunden Timeout
})
```

---

## 5. Funktionsweise

### 5.1 CRUD-Operationen (Offline-First)

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
  
  // 2. UI aktualisieren (Vue reactivity)
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

### 5.2 Sync-Queue

Die Sync-Queue speichert alle Änderungen, die noch nicht mit dem Server synchronisiert wurden:

```typescript
// Queue hinzufügen
await syncService.addToQueue('create', 'list', tempId, { name })

// Queue verarbeiten (bei Online-Gehen)
await syncService.processQueue()

// Queue-Größe prüfen
const pendingCount = await syncService.getPendingCount()

// Queue bereinigen (nach erfolgreicher Sync)
await syncService.clearSyncedOperations()
```

### 5.3 Queue-Verarbeitungslogik

```typescript
async function processQueue() {
  // 1. Prüfe Online-Status
  if (!navigator.onLine) return

  // 2. Hole alle ausstehenden Operationen
  const operations = await this.getPendingOperations()

  // 3. Verarbeite jede Operation sequenziell
  for (const op of operations) {
    try {
      await this.processOperation(op)
      await this.markAsSynced(op.id)
    } catch (error) {
      // Bei Fehler: Operation bleibt in Queue für Retry
      console.error('Sync operation failed:', error)
    }
  }
}
```

### 5.4 Online/Offline-Erkennung

```typescript
// Event-Listener werden beim App-Start registriert
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)

// Automatischer Sync bei Online-Gehen
watch(isOnline, async (online) => {
  if (online) {
    await syncService.processQueue()
  }
})

// Periodische Prüfung (alle 5 Sekunden)
setInterval(async () => {
  if (isOnline.value) {
    const count = await syncService.getPendingCount()
    if (count > 0) {
      await syncService.processQueue()
    }
  }
  pendingSyncCount.value = await syncService.getPendingCount()
}, 5000)
```

---

## 6. UI-Indikator

### 6.1 Offline-Banner

In `App.vue` wird ein Banner angezeigt, wenn der Benutzer offline ist:

```vue
<v-banner v-if="!isOnline" color="warning" class="offline-banner">
  <template #icon>
    <v-icon icon="mdi-wifi-off" />
  </template>
  <v-banner-text>
    Offline-Modus ({{ pendingSyncCount }} Änderungen warten auf Sync)
  </v-banner-text>
</v-banner>
```

### 6.2 Banner-Verhalten

- **Sichtbar:** Wenn `!isOnline` (offline)
- **Position:** sticky (oben, unter App-Bar)
- **Farbe:** warning (Orange/Gelb)
- **Icon:** mdi-wifi-off
- **Inhalt:** Zeigt Anzahl der ausstehenden Änderungen

### 6.3 Weitere UI-Feedbacks

- **Snackbar:** "Synchronisation abgeschlossen" nach erfolgreichem Sync
- **Loading-States:** Bei längeren Operationen
- **Error-Toasts:** Bei Sync-Fehlern

---

## 7. Edge Cases & Fehlerbehandlung

### 7.1 Netzwerk-Fehler

| Szenario | Verhalten |
|----------|-----------|
| API-Timeout | Operation bleibt in Queue, Retry bei nächster Gelegenheit |
| Server-Fehler (5xx) | Operation bleibt in Queue, Retry nach 5s |
| Client-Fehler (4xx) | Operation wird verworfen, Fehler geloggt |
| Netzwerk-Unterbrechung | Automatischer Retry bei Wiederherstellung |

### 7.2 Daten-Konsistenz

| Szenario | Verhalten |
|----------|-----------|
| Duplicate UUID | Server akzeptiert oder vergibt neue UUID |
| Version-Konflikt | **Server-Wins**: Lokaler State wird überschrieben |
| Deleted Item aktualisieren | Server ignoriert, lokale Queue bereinigen |

### 7.3 Speicher-Limits

- **IndexedDB:** Browser-abhängig (typisch 50MB+)
- **Empfehlung:** Queue nach 1000 Operationen warnen
- **Bereinigung:** Sync-Queue nach erfolgreicher Verarbeitung leeren

### 7.4 Tab-Schließung

- **beforeunload:** Warnung bei ungesyncten Änderungen (optional)
- **Visibility API:** Sync bei `document.visibilityState === 'visible'`

---

## 8. Akzeptanzkriterien-Erfüllung

| Kriterium | Status | Implementierung |
|-----------|--------|-----------------|
| Volle CRUD-Offline-Funktionalität | ✅ | `useShoppingLists`, `useProducts` |
| IndexedDB-Integration | ✅ | `db/index.ts` mit Dexie.js |
| Zeitstempel für Änderungen | ✅ | `lastModified`, `timestamp` in SyncOperation |
| UI-Indikator | ✅ | Offline-Banner in `App.vue` |
| Sync-Markierung | ✅ | `synced: false` für lokale Änderungen |

---

## 9. Konfliktlösung (Server-Wins)

### 9.1 Strategie

Bei Konflikten wird die **Server-Version bevorzugt** (Server Wins):

1. Client sendet Änderung mit `version`-Nummer
2. Server prüft Version
3. Bei **Match**: Änderung akzeptiert, Version erhöht
4. Bei **Mismatch**: HTTP 409 Conflict, Server-State zurückgesendet
5. Client überschreibt lokalen State mit Server-State

### 9.2 Implementierung (Backend - zukünftig)

```java
@PutMapping("/{id}")
public ResponseEntity<ShoppingList> update(@PathVariable UUID id, 
                                         @RequestBody UpdateRequest request) {
    ShoppingList current = repo.findById(id)
        .orElseThrow(() -> new NotFoundException());
    
    if (!current.getVersion().equals(request.getVersion())) {
        // Konflikt erkannt
        return ResponseEntity.status(409).body(current); // Server-State
    }
    
    current.setVersion(current.getVersion() + 1);
    // ... update logic
    return ResponseEntity.ok(repo.save(current));
}
```

### 9.3 Frontend-Konfliktbehandlung (zukünftig)

```typescript
async function handleConflict(serverState, localState) {
  // Server-Wins: Überschreibe lokale Daten
  await db.items.put(serverState)
  // UI aktualisieren
  items.value = items.value.map(item => 
    item.id === serverState.id ? serverState : item
  )
  // Warnung an Benutzer (optional)
  showSnackbar('Änderung eines anderen Geräts übernommen', 'info')
}
```

---

## 10. Tests

Tests befinden sich in `src/tests/`:

| Datei | Tests | Beschreibung |
|-------|-------|--------------|
| `offline.test.ts` | 16 | Offline-Logik, CRUD, Zeitstempel |
| `useOnlineStatus.test.ts` | 8 | Online/Offline-Erkennung |

### 10.1 Testausführung

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage
npx vitest run --coverage
```

### 10.2 Testergebnisse

```
Test Files  2 passed (2)
Tests      24 passed (24)
Duration    2.59s
```

---

## 11. Abhängigkeiten

| Paket | Version | Verwendung |
|-------|---------|------------|
| dexie | ^4.0.11 | IndexedDB Wrapper |
| vue | ^3.4.0 | Framework |
| vuetify | ^3.7.4 | UI-Komponenten |
| axios | ^1.7.9 | HTTP-Client |
| vitest | ^2.1.0 | Testing |

---

## 12. Konfiguration

### 12.1 Vite PWA (Offline-Caching)

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'SirBuysALot',
    short_name: 'SBA',
    theme_color: '#1976D2',
    display: 'standalone',
    // App ist offline-fähig durch Service Worker
  },
  workbox: {
    // Welche Ressourcen gecacht werden
    runtimeCaching: [
      {
        urlPattern: /^http:\/\/localhost:8080\/api/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})
```

### 12.2 Frontend API-URL

```typescript
// Für Produktion: Relative URL verwenden
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:8080/api',
})
```

---

## 13. Glossar

| Begriff | Beschreibung |
|--------|--------------|
| **IndexedDB** | Browser-interne NoSQL-Datenbank für Offline-Speicherung |
| **Dexie.js** | Bibliothek zur Vereinfachung von IndexedDB-Operationen |
| **Sync-Queue** | Warteschlange für Offline-Änderungen |
| **Server-Wins** | Konfliktlösungsstrategie bei Version-Konflikten |
| **PWA** | Progressive Web App - installierbare Web-Anwendung |
| **Soft-Delete** | Löschen durch `deletedAt`-Timestamp statt tatsächlichem Löschen |

---

## 14. Fehlerbehebungen (Implementierung)

1. **Sync-Button-Logik**: Button war im Offline-Banner mit `v-if="isOnline"` → nie sichtbar
2. **pendingSyncCount**: Nicht mit App.vue synchronisiert → Composable-Integration
3. **useOnlineStatus**: Watcher für Online-Events hinzugefügt
4. **TypeScript-Typen**: Dexie-Update-Specs mit `null`-Kompatibilität
5. **IndexedDB-Indizes**: `synced` als boolean ist kein gültiger Index → Filter statt Index

---

## 15. Nächste Schritte

- **Story 13**: Auto-Sync implementieren (automatische Synchronisation im Hintergrund)
- **Story 14**: Konfliktlösung UI (dem Benutzer bei Konflikten Auswahlmöglichkeiten geben)
- **E2E-Tests**: Playwright-Tests für echte Offline-Szenarien
- **Performance**: Queue-Limitierung und Batch-Sync
- **Monitoring**: Sync-Statistiken und Fehler-Reporting

---

## 16. Literatur & Links

- [Dexie.js Dokumentation](https://dexie.org/docs/Tutorial/Getting-started)
- [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vitest Testing](https://vitest.dev/)
