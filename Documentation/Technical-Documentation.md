# Technical Documentation

## Architekturuebersicht

SirBuysALot ist eine Progressive Web App (PWA) mit Offline-First-Architektur. Die Anwendung besteht aus einem Vue 3 Frontend und einem Spring Boot Backend, verbunden ueber REST-API und WebSockets.

```
┌─────────────────────────────────────────────────────┐
│                    Browser (PWA)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Vue 3 +  │  │ Dexie.js │  │ WebSocket Client  │  │
│  │ Vuetify  │  │ IndexedDB│  │ (Echtzeit)        │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│  ┌────┴──────────────┴─────────────────┴──────────┐  │
│  │          Service Layer (Composables)            │  │
│  │  useShoppingLists / useProducts / useTags       │  │
│  │  useDarkMode / useOnlineStatus / useUser        │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │ HTTP / WS
┌───────────────────────┼──────────────────────────────┐
│              Spring Boot Backend                      │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              REST Controller                    │  │
│  │  ShoppingList / Product / Tag / AppUser / Sync  │  │
│  └────────────────────┬───────────────────────────┘  │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              Service Layer                      │  │
│  │  Business Logic + WebSocket Broadcasting        │  │
│  └────────────────────┬───────────────────────────┘  │
│  ┌────────────────────┴───────────────────────────┐  │
│  │         JPA Repositories + Hibernate            │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
               ┌────────┴────────┐
               │  PostgreSQL 16  │
               └─────────────────┘
```

---

## Umgesetzte Funktionen

### Einkaufslisten-Verwaltung (US-01, US-02, US-15, US-16, US-24)

**Backend:** `ShoppingListService` verwaltet CRUD-Operationen mit Soft-Delete-Pattern. Jede Liste erhaelt bei Erstellung einen 8-stelligen `accessCode` (alphanumerisch, zufaellig generiert). Die `version`-Spalte dient dem Optimistic Locking. `duplicate()` erzeugt eine Kopie mit "(Kopie)"-Suffix, neuem accessCode und klont alle Produkte.

**Frontend:** `useShoppingLists` Composable stellt reaktive Listen bereit. Aenderungen werden zuerst in IndexedDB (Dexie.js) gespeichert, dann per API synchronisiert. `HomeView.vue` zeigt die Listenuebersicht mit Erstellen-Dialog, Bearbeiten und Loeschen.

### Produkt-Verwaltung (US-04, US-06, US-07, US-08, US-10, US-11)

**Backend:** `ProductService` handhabt Erstellen, Aktualisieren, Kaufmarkierung (Toggle mit `purchasedBy`/`purchasedAt`), Soft-Delete und Restore. Bei jedem Schreibvorgang wird die Version inkrementiert und ein WebSocket-Event an `/topic/lists/{listId}` gesendet.

**Frontend:** `useProducts` Composable mit `sortedProducts` Computed: gekaufte Produkte rutschen automatisch ans Ende. Visuelle Markierung durch Durchstreichen + Grau. `purchasedBy` und relative Zeitangabe werden angezeigt.

### Tag-System (US-05, US-20, US-21)

**Backend:** `TagService` fuer CRUD. Tags sind pro Liste scoped (`shopping_list_id`). `ProductService.setTags()` weist Tags ueber die `product_tags` Join-Table zu.

**Frontend:** `useTags` Composable. `ListView.vue` zeigt Tag-Chips zur Filterung. Multi-Tag-Filter arbeitet mit AND-Logik: ein Produkt muss ALLE ausgewaehlten Tags haben.

### Suche (US-09)

**Frontend:** `useProducts` bietet `searchQuery` Ref. `filteredProducts` Computed filtert case-insensitive auf `product.name`. Kombinierbar mit Tag-Filter.

### Kostenberechnung (US-22)

**Frontend:** `useProducts` berechnet `totalCost` (Summe aller Preise) und `purchasedCost` (Summe gekaufter Produkte). Null-Preise werden uebersprungen. Anzeige als Kosten-Summary-Card in der Listenansicht.

### Drag & Drop Sortierung (US-23)

**Backend:** `ProductService.reorder()` aktualisiert `position`-Felder basierend auf einer uebergebenen ID/Position-Liste. WebSocket-Broadcast nach Neuordnung.

**Frontend:** `vuedraggable` Komponente mit Touch-Support. Position wird persistiert und bei Aenderung ans Backend gesendet.

### Zugangscode / Beitreten (US-03)

**Backend:** `ShoppingListService.findByAccessCode()` sucht Listen anhand des 8-stelligen Codes. `AppUserService.joinList()` erstellt einen `AppUser` mit `displayName` fuer die Liste.

**Frontend:** `JoinView.vue` nimmt den Code entgegen und ruft den Beitritts-Endpunkt auf.

### Dark Mode (US-18)

**Frontend:** `useDarkMode` Composable erkennt die System-Praeferenz via `matchMedia('prefers-color-scheme: dark')`. Manueller Toggle ueberschreibt die System-Einstellung. Persistenz via `localStorage`. Vuetify-Theme wird dynamisch umgeschaltet.

---

## Offline-First Architektur (US-12, US-13, US-14)

### Lokale Speicherung

Alle Daten werden primaer in **IndexedDB** via Dexie.js gespeichert. Die Composables (`useShoppingLists`, `useProducts`, `useTags`) lesen zuerst aus der lokalen DB und synchronisieren im Hintergrund.

### Batch-Synchronisation

Offline gesammelte Aenderungen werden als Batch an `POST /api/lists/{listId}/sync` gesendet. Der `SyncService` verarbeitet jeden Change einzeln und zaehlt Erfolge/Fehler:

```json
{
  "changes": [
    { "type": "create_product", "payload": { "name": "Milch", "price": 1.49 } },
    { "type": "toggle_product", "payload": { "id": "uuid", "purchasedBy": "Anna" } }
  ]
}
```

Unterstuetzte Typen: `create_product`, `update_product`, `toggle_product`, `delete_product`, `update_list`, `delete_list`.

### Versionskonflikte (Optimistic Locking)

Jede Entity hat ein `version`-Feld. Bei Updates wird geprueft:

```java
if (updated.getVersion() != 0 && !existing.getVersion().equals(updated.getVersion())) {
    throw new ConflictException(existing.getVersion(), updated.getVersion());
}
```

HTTP 409 Response mit `serverVersion` und `clientVersion`. Das Frontend zeigt einen Konflikt-Dialog.

### WebSocket Echtzeit-Updates

Spring STOMP WebSocket auf `ws://localhost:8080/ws`. Jeder Schreibvorgang im Service broadcasted an `/topic/lists/{listId}`:

```java
messagingTemplate.convertAndSend("/topic/lists/" + listId, Map.of("type", eventType, "data", entity));
```

Event-Typen: `product_created`, `product_updated`, `product_toggled`, `product_deleted`, `products_reordered`, `tags_updated`, `sync`.

### P2P-Synchronisation (US-19)

PeerJS-basierte Peer-to-Peer-Verbindung als Fallback. `p2pService.ts` verwaltet Verbindungen, `useP2P` Composable integriert P2P-Messages in den regulaeren Datenfluss.

---

## Testabdeckung

| Bereich | Testdateien | Tests |
|---------|------------|-------|
| Backend Services | ProductServiceTest, ShoppingListServiceTest, SyncServiceTest, TagServiceTest, AppUserServiceTest | 62 |
| Backend Controller | ProductControllerTest, ShoppingListControllerTest, SyncControllerTest, TagControllerTest, AppUserControllerTest | 37 |
| Backend Integration | SirBuysALotApplicationTests | 1 |
| Frontend Services | listService, productService, tagService, syncService, websocketService (+ extended) | 46 |
| Frontend Composables | useShoppingLists, useProducts, useTags, useDarkMode, useUser (+ extended) | 53 |
| Frontend App | app.test.ts | 1 |
| **Gesamt** | **25 Testdateien** | **200** |

Alle Tests pruefen Normalfaelle, Grenzfaelle (leere Eingaben, null-Werte, lange Strings) und Fehlerfaelle (nicht gefunden, Validierung, Versionskonflikte).

---

## CI/CD Pipeline

GitHub Actions Workflow (`.github/workflows/ci.yml`):

1. **Frontend Lint** - ESLint mit TypeScript-Plugin
2. **Frontend Typecheck** - vue-tsc Typenpruefung
3. **Frontend Build** - Vite Production Build mit PWA Service Worker
4. **Frontend Test** - Vitest mit JUnit-Report (Artifact Upload)
5. **Backend Build & Test** - Maven verify mit Surefire-Reports (Artifact Upload)
6. **CI Gate** - Prueft ob alle Jobs erfolgreich sind

Testreports werden als GitHub Artifacts gespeichert und sind 30 Tage abrufbar.
