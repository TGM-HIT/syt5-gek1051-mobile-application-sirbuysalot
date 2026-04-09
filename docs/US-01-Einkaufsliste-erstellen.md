# US-01: Einkaufsliste erstellen

**Issue:** [#10](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/10) | **Branch:** `feature/US-01-Einkaufsliste-erstellen`

---

## Was wurde implementiert

- FAB + Vuetify-Dialog zum Erstellen einer Liste mit Namensvalidierung
- **Offline-First**: Liste wird zuerst lokal in Dexie.js gespeichert (`synced: false`), dann bei Verbindung per `POST /api/lists` synchronisiert (`synced: true`)
- Client-seitige UUID via `crypto.randomUUID()`
- Automatischer Batch-Sync aller unsynced Einträge beim Reconnect (`window 'online'` Event)
- Backend-Validierung: `@NotBlank` auf `name`, `@Valid` im Controller

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `frontend/src/composables/useShoppingLists.ts` | Offline-First `createList`, `syncPendingLists`, Dexie-Fallback in `fetchLists` |
| `frontend/src/App.vue` | Online-Event-Listener für Batch-Sync |
| `frontend/src/types/index.ts` | Optionales `id`-Feld in `CreateListPayload` |
| `backend/.../model/ShoppingList.java` | `@NotBlank` auf `name` |
| `backend/.../controller/ShoppingListController.java` | `@Valid` bei POST |

---

## Tests

| Datei | Tests |
|---|---|
| `frontend/src/__tests__/useShoppingLists.test.ts` | 5 Vitest-Tests (Dexie-Save, reaktive Liste, UUID, Online/Offline-Verhalten) |
| `backend/.../service/ShoppingListServiceTest.java` | 5 JUnit-5-Tests (create, findAll, findById, update) |
| `backend/.../controller/ShoppingListControllerTest.java` | 4 JUnit-5-Tests (POST, GET, 404) |
