# US-03: Zugangscode generieren und beitreten

## Beschreibung

Als Benutzer moechte ich einen Zugangscode (URL) fuer meine Einkaufsliste generieren und teilen koennen, damit andere Personen der Liste beitreten und einen Anzeigenamen waehlen koennen.

## Akzeptanzkriterien

- [x] Eindeutiger Zugangscode/URL wird generiert
- [x] Code kann geteilt werden (Copy-Button)
- [x] Andere Benutzer koennen per Code/URL beitreten
- [x] Bei Beitritt muss ein Anzeigename eingegeben werden
- [x] Anzeigename ist fuer alle Teilnehmer sichtbar

## Technische Umsetzung

### Backend

- `ShoppingListController.java`: Neuer Endpunkt `GET /api/lists/join/{accessCode}` - sucht eine Liste anhand des Zugangscodes. Gibt 404 zurueck, wenn kein Treffer.
- `ShoppingListService.java`: `findByAccessCode()` nutzt das bestehende Repository-Method `findByAccessCode()` und filtert geloeschte Listen heraus.
- `AppUserController.java` (neu): REST-Controller unter `/api/lists/{listId}/users`. GET liefert alle Benutzer einer Liste, POST registriert einen neuen Benutzer mit `displayName`.
- `AppUserService.java` (neu): Business-Logik fuer Benutzer-Erstellung und -Abfrage.
- `AppUserRepository.java`: Methode `findByShoppingListId()` ergaenzt.

### Frontend

- `JoinView.vue`: Komplett ueberarbeitet. Zeigt den Listennamen an, sobald der Code gueltig ist. Benutzer gibt seinen Anzeigenamen ein und tritt per Klick bei. Erfolgsansicht mit Link zur Liste.
- `userService.ts` (neu): API-Client fuer Benutzer-Endpunkte (`getUsers`, `joinList`).
- `listService.ts`: Neue Methode `joinByCode()`.
- `ListView.vue`: Share-Button im Header. Klick oeffnet einen Dialog mit dem teilbaren Link und Zugangscode. Ein-Klick-Kopieren in die Zwischenablage.

### Ablauf

1. Benutzer erstellt eine Liste -> Zugangscode wird automatisch generiert (8-Zeichen UUID-Prefix)
2. In der Listenansicht klickt er auf den Share-Button
3. Dialog zeigt den Link `{origin}/join/{code}` mit Copy-Button
4. Eingeladener oeffnet den Link -> JoinView zeigt Listenname + Textfeld fuer Anzeigenamen
5. Nach Eingabe des Namens und Klick auf "Beitreten" wird der Benutzer registriert
6. Weiterleitung zur Einkaufsliste
