# US-10: Produkt ausblenden (Soft Delete)

## Beschreibung

Als Benutzer moechte ich ein Produkt aus der Liste ausblenden koennen (soft delete), damit die Liste uebersichtlich bleibt.

## Akzeptanzkriterien

- [x] Produkt kann ausgeblendet werden (soft delete)
- [x] Ausgeblendetes Produkt ist nicht mehr in der Liste sichtbar
- [x] Daten bleiben in der Datenbank erhalten (deletedAt Timestamp)

## Technische Umsetzung

### Backend

- `ProductService.softDelete()`: Setzt `deletedAt` auf den aktuellen Zeitstempel. Das Produkt wird nicht physisch geloescht.
- `ProductRepository.findByShoppingListIdAndDeletedAtIsNull()`: Filtert geloeschte Produkte automatisch heraus.

### Frontend

- `ListView.vue`: Jede Produktkarte hat einen Muelleimer-Button (rot). Klick oeffnet einen Bestaetigungsdialog. Nach Bestaetigung wird das Produkt per DELETE-Request ausgeblendet und aus der lokalen Liste entfernt.
- Der Bestaetigungsdialog erklaert, dass das Produkt wiederhergestellt werden kann.

### Ablauf

1. Benutzer klickt auf das Muelleimer-Icon bei einem Produkt
2. Bestaetigungsdialog erscheint
3. Nach Klick auf "Ausblenden" wird der DELETE-Request gesendet
4. Produkt verschwindet mit Animation aus der Liste
5. Snackbar bestaetigt die Aktion
