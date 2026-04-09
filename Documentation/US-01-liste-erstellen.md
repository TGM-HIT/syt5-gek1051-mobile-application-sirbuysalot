# US-01: Einkaufsliste erstellen

## Beschreibung

Als Benutzer moechte ich eine neue Einkaufsliste mit einem Namen erstellen koennen, damit ich meine Einkaeufe organisieren kann.

## Akzeptanzkriterien

- [x] Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen)
- [x] Liste wird lokal gespeichert
- [x] Liste erscheint in der Uebersicht aller Listen
- [x] Leere Namen werden abgelehnt mit Fehlermeldung

## Technische Umsetzung

### Backend

- `ShoppingList.java`: `@NotBlank`-Annotation auf dem `name`-Feld hinzugefuegt, damit leere oder nur aus Leerzeichen bestehende Namen direkt vom Server abgelehnt werden.
- `ShoppingListController.java`: `@Valid` auf den `@RequestBody`-Parameter bei POST und PUT ergaenzt, damit die Bean-Validierung greift.
- `GlobalExceptionHandler.java` (neu): Faengt `MethodArgumentNotValidException` ab und liefert ein JSON-Objekt mit Feldname und Fehlermeldung zurueck (HTTP 400). Damit bekommt das Frontend strukturierte Fehlermeldungen.

### Frontend

- `HomeView.vue`: Zeigt bereits einen Dialog zum Erstellen an. Die Validierung im Frontend (leerer Name deaktiviert den Button) war schon vorhanden. Zusaetzlich wird jetzt bei einem Server-Fehler eine Snackbar mit dem Validierungsfehler gezeigt.

### Tests

- Bestehende `ShoppingListControllerTest` und `ShoppingListServiceTest` decken die Erstellung ab.
- Manuell getestet: leerer Name wird mit HTTP 400 abgelehnt.

## Ablauf

1. Benutzer klickt auf "Neue Liste" (FAB oder Button in der leeren Ansicht)
2. Dialog oeffnet sich mit Textfeld fuer den Listennamen
3. Eingabe wird validiert - Button ist deaktiviert bei leerem Feld
4. Nach Eingabe und Klick auf "Erstellen" wird die Liste am Server angelegt
5. Benutzer wird zur neuen Liste weitergeleitet

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen) | ShoppingListServiceTest.java | create_setsAccessCodeAndSaves |
| Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen) | ShoppingListControllerTest.java | create_returnsList |
| Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen) | ShoppingListControllerTest.java | create_withValidName_returns200 |
| Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen) | listService.test.ts | createList |
| Benutzer kann einen Namen fuer die Liste eingeben (mind. 1 Zeichen) | useShoppingLists.test.ts | creates list |
| Liste wird lokal gespeichert | listService.test.ts | createList |
| Liste wird lokal gespeichert | useShoppingLists.test.ts | creates list |
| Liste erscheint in der Uebersicht aller Listen | ShoppingListServiceTest.java | findAll_returnsNonDeletedLists |
| Liste erscheint in der Uebersicht aller Listen | ShoppingListControllerTest.java | getAll_returnsLists |
| Liste erscheint in der Uebersicht aller Listen | listService.test.ts | fetchLists |
| Liste erscheint in der Uebersicht aller Listen | useShoppingLists.test.ts | loads lists |
| Leere Namen werden abgelehnt mit Fehlermeldung | ShoppingListServiceTest.java | create_throwsWhenNameBlank |
| Leere Namen werden abgelehnt mit Fehlermeldung | ShoppingListControllerTest.java | create_withBlankName_returns400 |
| Leere Namen werden abgelehnt mit Fehlermeldung | ShoppingListControllerTest.java | create_withWhitespace_returns400 |
