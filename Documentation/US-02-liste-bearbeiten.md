# US-02: Listennamen bearbeiten

## Beschreibung

Als Benutzer moechte ich den Namen einer Einkaufsliste bearbeiten koennen, damit ich sie bei Bedarf umbenennen kann.

## Akzeptanzkriterien

- [x] Benutzer kann den Namen einer bestehenden Liste aendern
- [x] Aenderung wird sofort gespeichert
- [x] Andere Teilnehmer sehen den neuen Namen nach Sync

## Technische Umsetzung

### Frontend

- `HomeView.vue`: Neuen Edit-Button (Stift-Icon) auf jeder Listenkarte eingefuegt. Beim Klick oeffnet sich ein Dialog mit dem aktuellen Namen vorausgefuellt. Nach dem Speichern wird die Liste sofort in der Uebersicht aktualisiert.
- Verwendet die bestehende `updateList()`-Funktion aus dem `useShoppingLists`-Composable.

### Backend

- Bereits vorhanden: `ShoppingListController.update()` nimmt den neuen Namen entgegen und aktualisiert die Liste. Die Version wird automatisch hochgezaehlt.
- `@Valid` wurde in US-01 ergaenzt, sodass auch hier leere Namen abgelehnt werden.

### Tests

- Bestehende Tests decken die Update-Funktionalitaet ab.
- Manuell getestet: Name aendern, Seite neu laden, neuer Name wird angezeigt.
