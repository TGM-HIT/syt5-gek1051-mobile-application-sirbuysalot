# US-15: Liste ausblenden (Soft Delete)

## Beschreibung

Als Benutzer moechte ich eine Liste loeschen koennen, damit ich nicht mehr benoetigte Listen ausblenden kann.

## Akzeptanzkriterien

- [x] Loeschen-Button auf jeder Listenkarte im HomeView
- [x] Bestaetigung-Dialog vor dem Loeschen
- [x] Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht)
- [x] Geloeschte Liste verschwindet sofort aus der Anzeige
- [x] Erfolgs-Snackbar nach dem Loeschen

## Technische Umsetzung

### Frontend

- `HomeView.vue` (geaendert): Neuer Delete-Button (Papierkorb-Icon) neben dem Edit-Button auf jeder Listenkarte. Klick oeffnet einen Bestaetigung-Dialog. Nach Bestaetigung wird `removeList()` vom Composable aufgerufen. Die Liste verschwindet durch die reaktive `lists`-Ref sofort aus der Anzeige. Snackbar bestaetigt die Aktion.

### Bestehendes Backend

Das Backend unterstuetzt Soft Delete bereits ueber den DELETE-Endpoint, der `deletedAt` setzt. Der `getAll()`-Endpoint filtert geloeschte Listen automatisch heraus.

### UX-Details

- Button ist rot (`color="error"`) um die destruktive Aktion deutlich zu machen
- Dialog nennt den Listennamen zur Sicherheit
- Hinweis im Dialog, dass die Liste wiederhergestellt werden kann (US-16)
- `@click.prevent` auf dem Button verhindert, dass die Router-Navigation ausgeloest wird

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | ShoppingListServiceTest.java | softDelete_setsDeletedAt |
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | ShoppingListServiceTest.java | softDelete_throwsWhenNotFound |
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | ShoppingListControllerTest.java | delete_returns204 |
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | ShoppingListControllerTest.java | delete_callsServiceAndReturns204 |
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | listService.test.ts | deleteList |
| Soft Delete (deletedAt wird gesetzt, Liste wird nicht physisch geloescht) | useShoppingLists.test.ts | deletes list |
| Geloeschte Liste verschwindet sofort aus der Anzeige | ShoppingListServiceTest.java | findAll_returnsNonDeletedLists |
| Geloeschte Liste verschwindet sofort aus der Anzeige | ShoppingListControllerTest.java | getAll_returnsLists |
| Geloeschte Liste verschwindet sofort aus der Anzeige | listService.test.ts | fetchLists |
