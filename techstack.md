# Techstack - SirBuysALot

*Dies ist die technische Spezifikation des SirBuysALot-Projekts. Die Dokumentation wird kontinuierlich aktualisiert.*

---

## Inhaltsverzeichnis

1. [Architektur](#1-architektur-big-picture--systemlandschaft)
2. [Datenmodelle](#2-datenmodelle)
3. [Systemkommunikation](#3-systemkommunikation)
4. [Synchronisationsdesign](#4-synchronisationsdesign)
5. [Konfliktlösung](#5-konfliktlösung)
6. [Frontend](#6-frontend)
7. [Backend](#7-backend)
8. [Datenbank](#8-datenbank)
9. [Programmierumgebung](#9-programmierumgebung)
10. [CI/CD & Testing](#10-cicd--testing)

---

## 1. Architektur Big-Picture & Systemlandschaft

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (PWA)                                    │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────────────────┐    │
│  │   Vue 3 UI   │───▶│ Composables     │───▶│   IndexedDB (Dexie)   │    │
│  │  Components   │    │ (CRUD + Sync)  │    │   Lokaler Cache       │    │
│  └──────────────┘    └─────────────────┘    └────────────────────────┘    │
│                              │                          │                    │
│                              ▼                          ▼                    │
│                    ┌─────────────────┐    ┌────────────────────────┐    │
│                    │ useOnlineStatus │    │    SyncQueue           │    │
│                    │ Composable       │    │ (Pending Operations)   │    │
│                    └─────────────────┘    └────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
              │                                           │
              │ Online                                   │ Offline
              ▼                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Server)                                  │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────────────────┐    │
│  │  REST API    │───▶│ Spring Boot     │───▶│     PostgreSQL 16     │    │
│  │   (Axios)    │    │ Controllers     │    │   (Source of Truth)   │    │
│  └──────────────┘    └─────────────────┘    └────────────────────────┘    │
│                              │                          │                    │
│                              ▼                          │                    │
│                    ┌─────────────────┐                │                    │
│                    │ WebSocket/STOMP  │◀───────────────┘                    │
│                    │ (Push Updates)   │                                     │
│                    └─────────────────┘                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Datenmodelle

### 2.1 ShoppingList

| Attribut | Typ | Speicherort | Beschreibung |
|----------|-----|-------------|--------------|
| `id` | UUID | Lokal & Server | Eindeutiger Identifikator (Client-generiert für Offline) |
| `name` | String | Lokal & Server | Name der Einkaufsliste |
| `accessCode` | String | Lokal & Server | Freigabecode für Teilnehmer (nullable) |
| `createdAt` | Timestamp | Lokal & Server | Erstellungszeitpunkt |
| `updatedAt` | Timestamp | Lokal & Server | Letztes Update |
| `lastModified` | Timestamp | Lokal & Server | Für Sync-Reihenfolge |
| `deletedAt` | Timestamp | Lokal & Server | Soft-Delete (nullable) |
| `version` | Integer | **Server (Master)** | Für Konflikterkennung |
| `synced` | Boolean | **Nur Lokal** | `true` = mit Server identisch |

### 2.2 Product (Einkaufslisten-Item)

| Attribut | Typ | Speicherort | Beschreibung |
|----------|-----|-------------|--------------|
| `id` | UUID | Lokal & Server | Eindeutiger Identifikator |
| `listId` | UUID | Lokal & Server | Fremdschlüssel zur Liste |
| `name` | String | Lokal & Server | Produktname (z.B. "Milch") |
| `price` | Decimal | Lokal & Server | Preis (nullable) |
| `purchased` | Boolean | Lokal & Server | Gekauft-Status |
| `purchasedBy` | String | Lokal & Server | Wer hat es gekauft? (nullable) |
| `purchasedAt` | Timestamp | Lokal & Server | Wann gekauft (nullable) |
| `position` | Integer | Lokal & Server | Sortierreihenfolge |
| `createdAt` | Timestamp | Lokal & Server | Erstellungszeitpunkt |
| `updatedAt` | Timestamp | Lokal & Server | Letztes Update |
| `lastModified` | Timestamp | Lokal & Server | Für Sync-Reihenfolge |
| `deletedAt` | Timestamp | Lokal & Server | Soft-Delete (nullable) |
| `version` | Integer | **Server (Master)** | Für Konflikterkennung |
| `synced` | Boolean | **Nur Lokal** | `true` = mit Server identisch |

### 2.3 Tag

| Attribut | Typ | Speicherort | Beschreibung |
|----------|-----|-------------|--------------|
| `id` | UUID | Lokal & Server | Eindeutiger Identifikator |
| `name` | String | Lokal & Server | Tag-Name (z.B. "Milchprodukt") |
| `listId` | UUID | Lokal & Server | Zugehörige Liste |

### 2.4 ProductTag (M2M Beziehung)

| Attribut | Typ | Speicherort | Beschreibung |
|----------|-----|-------------|--------------|
| `productId` | UUID | Lokal & Server | UUID des Produkts |
| `tagId` | UUID | Lokal & Server | UUID des Tags |

### 2.5 SyncOperation (Lokale Queue)

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `id` | Integer | Auto-Inkrement (Primärschlüssel) |
| `type` | Enum | `'create'` \| `'update'` \| `'delete'` |
| `entity` | Enum | `'list'` \| `'product'` |
| `entityId` | UUID | Lokale UUID des Elements |
| `payload` | JSON | Änderungsdaten |
| `timestamp` | Timestamp | Wann die Änderung stattfand |
| `synced` | Boolean | `false` = muss noch synchronisiert werden |

---

## 3. Systemkommunikation

### 3.1 Kommunikationskanäle

| Kanal | Verwendung | Bibliothek |
|-------|------------|------------|
| **REST API** | Schreibende Operationen | Axios |
| **WebSockets** | Echtzeit-Updates (Push) | STOMP over WebSocket |

### 3.2 REST-API Endpunkte

#### Listen
| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/lists` | Alle Listen abrufen |
| GET | `/api/lists/{id}` | Einzelne Liste |
| POST | `/api/lists` | Neue Liste erstellen |
| PUT | `/api/lists/{id}` | Liste aktualisieren |
| DELETE | `/api/lists/{id}` | Liste löschen |

#### Produkte
| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/lists/{id}/products` | Alle Produkte einer Liste |
| POST | `/api/lists/{id}/products` | Produkt erstellen |
| PUT | `/api/lists/{listId}/products/{productId}` | Produkt aktualisieren |
| PATCH | `/api/lists/{listId}/products/{productId}/purchase` | Kauf-Status toggle |
| DELETE | `/api/lists/{listId}/products/{productId}` | Produkt löschen |

### 3.3 WebSocket Topics

| Topic | Verwendung |
|-------|------------|
| `/topic/lists/{listId}` | Updates für eine Liste |
| `/topic/lists/{listId}/products` | Produkt-Updates |

---

## 4. Synchronisationsdesign

### 4.1 Datenhaltung

Die App nutzt **2 Speicher**:

| Speicher | Technologie | Rolle |
|----------|-------------|-------|
| **Server** | PostgreSQL | Source of Truth |
| **Client** | IndexedDB (Dexie.js) | Lokaler Cache für Offline |

### 4.2 Sync-Prinzip: Offline-First

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRUD-Operation (Create)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  1. Lokal       │
                    │  speichern      │
                    │  (Dexie.js)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  2. UI          │
                    │  aktualisieren  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  3. Online?     │
                    └─────────────────┘
                      │           │
                    Ja           Nein
                      │           │
                      ▼           ▼
            ┌─────────────┐   ┌─────────────┐
            │ API-Call    │   │ Queue       │
            │ (Axios)     │   │ hinzufügen  │
            └─────────────┘   └─────────────┘
                      │           │
                      ▼           │
            ┌─────────────┐      │
            │ Erfolg?     │      │
            └─────────────┘      │
              │        │        │
            Ja       Nein       │
              │        │        │
              ▼        ▼        │
        ┌─────────┐ ┌────────┐   │
        │ Markiere│ │ Queue  │◀──┘
        │ synced  │ │ add    │
        └─────────┘ └────────┘
```

### 4.3 Online/Offline-Erkennung

```typescript
// Event-Listener
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)

// navigator.onLine als Fallback
if (!navigator.onLine) {
  // Offline-Modus aktivieren
}
```

### 4.4 Sync-Queue-Verarbeitung

```typescript
async function processQueue() {
  // 1. Prüfe Online-Status
  if (!navigator.onLine) return

  // 2. Hole ausstehende Operationen
  const operations = await syncService.getPendingOperations()

  // 3. Verarbeite sequenziell
  for (const op of operations) {
    try {
      await syncService.processOperation(op)
      await syncService.markAsSynced(op.id)
    } catch (error) {
      // Fehler - bleibt in Queue für Retry
      console.error('Sync failed:', error)
    }
  }
}

// Automatischer Start bei Online-Gehen
watch(isOnline, async (online) => {
  if (online) {
    await processQueue()
  }
})
```

### 4.5 UI-Indikatoren

| Indikator | Beschreibung |
|-----------|--------------|
| **Offline-Banner** | Zeigt "Offline-Modus" mit Pending-Count |
| **Snackbar** | "Synchronisation abgeschlossen" nach Sync |
| **Loading-States** | Während langer Operationen |

---

## 5. Konfliktlösung

### 5.1 Strategie: Server Wins

> **Grundsatz:** Bei Konflikten wird die Server-Version bevorzugt.

### 5.2 Konfliktarten

| Art | Beschreibung | Behandlung |
|-----|--------------|------------|
| **Version-Konflikt** | Client sendet veraltete Version | Server-State gewinnt |
| **Gleichzeitige Edits** | Zwei Clients ändern dasselbe | Server-State gewinnt |
| **Gelöschtes Item** | Client aktualisiert gelöschtes Item | Server ignoriert |
| **Netzwerk-Fehler** | Timeout/Serverfehler | Retry mit Exponential Backoff |

### 5.3 Ablauf bei Version-Konflikt

```
┌─────────────────────────────────────────────────────────────────┐
│                      Version-Konflikt                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Client sendet: { id, version: 3, changes }                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server prüft: current.version = 5                           │
│  Request.version = 3                                          │
│  → VERSION MISMATCH!                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server antwortet: HTTP 409 Conflict                          │
│  Body: { currentState, version: 5 }                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Client überschreibt lokale Daten mit Server-State             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Backend-Implementierung (Spring Boot)

```java
@PutMapping("/{id}")
public ResponseEntity<?> update(@PathVariable UUID id, 
                               @RequestBody UpdateRequest request) {
    Entity current = repository.findById(id)
        .orElseThrow(() -> new NotFoundException());
    
    // Version prüfen
    if (!current.getVersion().equals(request.getVersion())) {
        // Konflikt - Server gewinnt
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(new ConflictResponse(current, current.getVersion()));
    }
    
    // Update durchführen
    current.setVersion(current.getVersion() + 1);
    Entity updated = repository.save(current);
    
    // Push an alle Clients via WebSocket
    messagingTemplate.convertAndSend("/topic/lists/" + id, updated);
    
    return ResponseEntity.ok(updated);
}
```

### 5.5 Frontend-Konfliktbehandlung

```typescript
async function handleApiError(error, localItem) {
  if (error.response?.status === 409) {
    // Server gewinnt - lokale Daten überschreiben
    const serverState = error.response.data.currentState
    await db.items.put(serverState)
    
    // UI aktualisieren
    items.value = items.value.map(item => 
      item.id === serverState.id ? serverState : item
    )
    
    // Feedback an Benutzer
    showSnackbar('Änderung eines anderen Geräts übernommen', 'info')
  }
}
```

---

## 6. Frontend

### 6.1 Stack

| Technologie | Version | Verwendung |
|------------|---------|------------|
| Vue 3 | 3.4.0 | Framework |
| Vuetify 3 | 3.7.4 | UI-Komponenten |
| Vite | 5.4.0 | Build Tool |
| Vite PWA Plugin | 0.20.5 | PWA-Funktionalität |
| Axios | 1.7.9 | HTTP-Client |
| Dexie.js | 4.0.11 | IndexedDB Wrapper |

### 6.2 Projektstruktur

```
frontend/src/
├── App.vue                    # Root-Komponente
├── main.ts                    # App-Initialisierung
├── composables/
│   ├── useShoppingLists.ts   # Listen-CRUD + Offline
│   ├── useProducts.ts        # Produkt-CRUD + Offline
│   ├── useOnlineStatus.ts    # Online/Offline-Erkennung
│   └── useUser.ts            # Benutzerverwaltung
├── services/
│   ├── api.ts               # Axios-Instanz
│   ├── listService.ts       # REST-Aufrufe Listen
│   ├── productService.ts    # REST-Aufrufe Produkte
│   └── syncService.ts      # Queue-Management
├── db/
│   └── index.ts             # Dexie.js Datenbank
├── views/
│   ├── HomeView.vue         # Listenübersicht
│   ├── ListView.vue         # Produkte einer Liste
│   └── JoinView.vue         # Liste beitreten
├── plugins/
│   └── vuetify.ts          # Vuetify-Konfiguration
├── router/
│   └── index.ts             # Vue Router
├── types/
│   └── index.ts             # TypeScript-Typen
└── tests/
    ├── setup.ts            # Test-Setup
    ├── offline.test.ts      # Offline-Tests
    └── useOnlineStatus.test.ts
```

### 6.3 Wichtige Composables

#### useShoppingLists
```typescript
// Verwendet: db.shoppingLists, syncService, listService
// Funktionen: fetchLists, createList, updateList, removeList
```

#### useProducts
```typescript
// Verwendet: db.products, syncService, productService
// Funktionen: fetchProducts, addProduct, updateProduct, togglePurchase, removeProduct
```

#### useOnlineStatus
```typescript
// Refs: isOnline (boolean), pendingSyncCount (number)
// Funktionen: updatePendingCount(), triggerSync()
```

---

## 7. Backend

### 7.1 Stack

| Technologie | Version | Verwendung |
|------------|---------|------------|
| Java | 21 LTS | Sprache |
| Spring Boot | 3.2.12 | Framework |
| Spring Data JPA | - | Datenbank-Zugriff |
| Spring WebSocket | - | Echtzeit-Updates |
| PostgreSQL | 16.8 | Datenbank |
| H2 | - | Entwicklung (In-Memory) |

### 7.2 Projektstruktur

```
backend/src/main/java/at/tgm/sirbuysalot/
├── SirBuysALotApplication.java
├── controller/
│   ├── ListController.java
│   └── ProductController.java
├── service/
│   ├── ListService.java
│   └── ProductService.java
├── repository/
│   ├── ListRepository.java
│   └── ProductRepository.java
├── model/
│   ├── ShoppingList.java
│   ├── Product.java
│   └── dto/
│       ├── CreateListRequest.java
│       └── UpdateListRequest.java
├── config/
│   └── WebSocketConfig.java
└── exception/
    ├── NotFoundException.java
    └── ConflictException.java
```

---

## 8. Datenbank

### 8.1 PostgreSQL Schema

```sql
-- ShoppingLists
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    access_code VARCHAR(50),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    purchased BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_by VARCHAR(255),
    purchased_at TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    list_id UUID NOT NULL REFERENCES shopping_lists(id)
);

-- ProductTags (M2M)
CREATE TABLE product_tags (
    product_id UUID NOT NULL REFERENCES products(id),
    tag_id UUID NOT NULL REFERENCES tags(id),
    PRIMARY KEY (product_id, tag_id)
);
```

### 8.2 IndexedDB Schema (Dexie.js)

```typescript
// Database: 'sirbuysalot'
{
  shoppingLists: {
    keyPath: 'id',
    indexes: ['name', 'accessCode', 'lastModified']
  },
  products: {
    keyPath: 'id',
    indexes: ['listId', 'name', 'purchased', 'lastModified']
  },
  tags: {
    keyPath: 'id',
    indexes: ['name', 'listId']
  },
  productTags: {
    keyPath: ['productId', 'tagId'],
    indexes: ['productId', 'tagId']
  },
  syncQueue: {
    keyPath: 'id',
    indexes: ['entity', 'entityId', 'timestamp']
  }
}
```

---

## 9. Programmierumgebung

| Tool | Version | Verwendung |
|------|---------|------------|
| IntelliJ IDEA | 2024.3 | IDE |
| Docker Compose | 2.32.0 | Container |
| Node.js | 22.0.0 LTS | Frontend-Build |

### 9.1 Starten der Entwicklung

```bash
# Backend (mit H2 für Entwicklung)
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
.\mvnw.cmd spring-boot:run

# Frontend
cd frontend
npm install
npm run dev

# Docker (PostgreSQL + Backend)
docker compose up -d
```

---

## 10. CI/CD & Testing

### 10.1 GitHub Actions Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push/PR | Build, Unit Tests, Typecheck |
| `e2e.yml` | PR | Playwright E2E Tests |
| `deploy.yml` | Push auf main | Build & Deploy |

### 10.2 Test-Stack

| Ebene | Framework | Dateien |
|-------|-----------|---------|
| Unit | Vitest | `src/tests/*.test.ts` |
| Component | Vue Test Utils | `src/tests/*.test.ts` |
| E2E | Playwright | `tests/e2e/*.spec.ts` |
| Backend | JUnit 5 | `backend/src/test/` |

### 10.3 Testbefehle

```bash
# Frontend
npm test              # Unit Tests
npm run test:watch    # Watch Mode
npm run typecheck     # TypeScript Check
npm run build         # Production Build

# Backend
cd backend
.\mvnw.cmd test      # Unit Tests
.\mvnw.cmd verify     # Integration Tests
```

---

## Glossar

| Begriff | Bedeutung |
|--------|----------|
| **PWA** | Progressive Web App - installierbare Webanwendung |
| **Source of Truth** | Autoritative Datenquelle (PostgreSQL) |
| **Offline-First** | Lokale Speicherung VOR Server-Kommunikation |
| **Soft-Delete** | Logisches Löschen via `deletedAt`-Timestamp |
| **Server Wins** | Konfliktlösungsstrategie bei Versionskonflikten |
| **Dexie.js** | IndexedDB Wrapper für einfachere Datenbank-Operationen |
| **STOMP** | Simple Text Oriented Messaging Protocol (WebSocket) |

---

## Literatur & Links

| Thema | Link |
|-------|------|
| Vue 3 Docs | https://vuejs.org |
| Vuetify | https://vuetifyjs.com |
| Dexie.js | https://dexie.org |
| Spring Boot | https://spring.io/projects/spring-boot |
| PostgreSQL | https://www.postgresql.org |
| Vitest | https://vitest.dev |
| Playwright | https://playwright.dev |
