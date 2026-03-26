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
