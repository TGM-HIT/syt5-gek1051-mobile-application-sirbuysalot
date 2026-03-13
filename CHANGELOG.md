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
