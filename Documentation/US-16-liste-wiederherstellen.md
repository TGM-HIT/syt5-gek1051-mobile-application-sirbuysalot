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

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Toggle im HomeView zum Anzeigen geloeschter Listen | ShoppingListServiceTest.java | findDeleted_returnsOnlyDeletedLists |
| Toggle im HomeView zum Anzeigen geloeschter Listen | ShoppingListControllerTest.java | getDeleted_returnsLists |
| Toggle im HomeView zum Anzeigen geloeschter Listen | listService.extended.test.ts | fetchDeletedLists |
| Toggle im HomeView zum Anzeigen geloeschter Listen | listService.extended.test.ts | fetchDeletedLists empty |
| Toggle im HomeView zum Anzeigen geloeschter Listen | useShoppingLists.extended.test.ts | loads deleted lists |
| Toggle im HomeView zum Anzeigen geloeschter Listen | useShoppingLists.extended.test.ts | loads deleted empty |
| Wiederherstellen-Button pro geloeschter Liste | ShoppingListServiceTest.java | restore_setsDeletedAtNullAndIncrementsVersion |
| Wiederherstellen-Button pro geloeschter Liste | ShoppingListServiceTest.java | restore_throwsWhenNotFound |
| Wiederherstellen-Button pro geloeschter Liste | ShoppingListControllerTest.java | restore_returnsList |
| Wiederherstellen-Button pro geloeschter Liste | listService.extended.test.ts | restoreList |
| Wiederherstellen-Button pro geloeschter Liste | listService.extended.test.ts | restoreList error |
| Wiederherstellen-Button pro geloeschter Liste | useShoppingLists.extended.test.ts | restores list |
| Wiederherstellen-Button pro geloeschter Liste | useShoppingLists.extended.test.ts | restores error |
| Backend-Endpoint zum Restore (PATCH /{id}/restore) | ShoppingListServiceTest.java | restore_setsDeletedAtNullAndIncrementsVersion |
| Backend-Endpoint zum Restore (PATCH /{id}/restore) | ShoppingListControllerTest.java | restore_returnsList |
| Wiederhergestellte Liste erscheint wieder in der aktiven Ansicht | ShoppingListServiceTest.java | restore_setsDeletedAtNullAndIncrementsVersion |
| Wiederhergestellte Liste erscheint wieder in der aktiven Ansicht | useShoppingLists.extended.test.ts | restores list |
