# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unreleased]

### Added – US-1: Einkaufsliste erstellen

**Frontend:**
- `useShoppingLists.ts`: Offline-First `createList` – speichert zuerst lokal in Dexie.js mit `synced: false`, fügt die Liste sofort reaktiv ein und sendet bei bestehender Verbindung per `POST /api/lists` ans Backend
- `useShoppingLists.ts`: `syncPendingLists` – sendet alle lokalen Einträge mit `synced: false` per Batch beim nächsten Online-Gang
- `useShoppingLists.ts`: `fetchLists` nutzt Dexie als Offline-Fallback
- `App.vue`: `window.addEventListener('online', syncPendingLists)` für automatische Synchronisation bei Reconnect
- `types/index.ts`: Optionales `id`-Feld in `CreateListPayload` für client-seitig generierte UUID
- `vitest.config.ts`: Vitest-Konfiguration mit jsdom-Umgebung
- `src/__tests__/useShoppingLists.test.ts`: Unit-Tests für die lokale Speicher-Logik (5 Testfälle)

**Backend:**
- `ShoppingList.java`: `@NotBlank`-Validierung auf dem `name`-Feld
- `ShoppingListController.java`: `@Valid` bei `POST /api/lists`
- `ShoppingListServiceTest.java`: JUnit-5-Tests für `create`, `findAll`, `findById`, `update`
- `ShoppingListControllerTest.java`: JUnit-5-Tests für alle Controller-Endpunkte (MockMvc, kein Spring-Kontext)
## [Unreleased]

### Added

- **Produkt als „gekauft" markieren** (User Story GEK1051)
  - Klick/Tap auf ein Produkt togglet den `purchased`-Status (optimistisches Update)
  - Markierte Produkte werden durchgestrichen und ausgegraut dargestellt (bereits vorhanden)
  - Status wird mit Zeitstempel (`purchasedAt`) lokal in Dexie.js gespeichert (`synced: false`)
  - Bei bestehender Verbindung wird die Statusänderung über WebSocket (`/topic/lists/{listId}/products`) an alle verbundenen Clients der Liste gesendet
  - **Offline-Modus**: Statusänderung wird sofort lokal gespeichert; beim nächsten Online-Gang (`window.online`-Event) werden alle ausstehenden Änderungen (`synced: false`) automatisch mit dem Server synchronisiert
  - Fallback auf Dexie.js-Cache beim Laden der Produkte ohne Netzwerkverbindung

### Changed

- `ProductService.markPurchased()` nimmt jetzt zusätzlich `listId` entgegen und sendet nach dem Speichern eine WebSocket-Nachricht via `SimpMessagingTemplate`
- `ProductController.togglePurchase()` extrahiert `listId` aus dem Pfad und gibt es an den Service weiter
- `useProducts.ts` überarbeitet: Dexie.js-Integration für lokales Caching, optimistisches Toggle, Offline-Sync beim Reconnect
- `vite.config.ts`: Vitest-Konfiguration hinzugefügt (`environment: jsdom`)

### Tests

- **Frontend** (`useProducts.test.ts` – Vitest): Tests für optimistisches Update, Dexie-Persistenz mit `synced: false`, Sync nach erfolgreicher API-Antwort, Offline-Verhalten und Offline-Fallback beim Laden
- **Backend** (`ProductServiceTest.java` – JUnit 5 + Mockito): Tests für Toggle-Logik (markieren/entmarkieren), Versions-Increment und WebSocket-Broadcast nach `markPurchased()`
