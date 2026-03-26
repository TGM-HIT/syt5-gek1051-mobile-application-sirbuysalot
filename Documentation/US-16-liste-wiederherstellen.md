# US-16: Liste wiederherstellen

## Beschreibung

Als Benutzer moechte ich eine geloeschte Liste wiederherstellen koennen, falls ich sie versehentlich geloescht habe.

## Akzeptanzkriterien

- [x] Toggle im HomeView zum Anzeigen geloeschter Listen
- [x] Geloeschte Listen sind visuell als geloescht erkennbar (durchgestrichen, grau)
- [x] Wiederherstellen-Button pro geloeschter Liste
- [x] Backend-Endpoint zum Restore (PATCH /{id}/restore)
- [x] Wiederhergestellte Liste erscheint wieder in der aktiven Ansicht

## Technische Umsetzung

### Backend

- `ShoppingListService.java` (geaendert): Neue Methoden `findDeleted()` (alle Listen mit `deletedAt != null`) und `restore()` (setzt `deletedAt` auf null, inkrementiert Version).
- `ShoppingListRepository.java` (geaendert): Neue Query-Methode `findByDeletedAtIsNotNull()` fuer geloeschte Listen.
- `ShoppingListController.java` (geaendert): Neuer `GET /deleted` Endpoint und `PATCH /{id}/restore` Endpoint.

### Frontend

- `listService.ts` (geaendert): Neue Methoden `getDeleted()` und `restore()`.
- `useShoppingLists.ts` (geaendert): Neue Refs `deletedLists`, Funktionen `fetchDeletedLists()` und `restoreList()`. Bei Restore wird die Liste aus `deletedLists` entfernt und in `lists` eingefuegt.
- `HomeView.vue` (geaendert): Toggle-Switch zum Anzeigen geloeschter Listen. Geloeschte Listen werden mit durchgestrichenem Namen, grauem Hintergrund und Papierkorb-Icon angezeigt. "Wiederherstellen"-Button pro Liste. Leere-Zustand wenn keine geloeschten Listen vorhanden.
