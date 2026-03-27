# US-06: Preis bearbeiten

## Beschreibung

Als Benutzer moechte ich den Preis eines Produkts nachtraeglich eintragen oder aendern koennen, damit die tatsaechlichen Kosten erfasst werden.

## Akzeptanzkriterien

- [x] Preis kann jederzeit eingetragen werden
- [x] Preis kann geaendert werden
- [x] Nur numerische Werte (mit Dezimalstellen) erlaubt
- [x] Waehrungssymbol wird angezeigt

## Technische Umsetzung

### Frontend

- `ProductEditDialog.vue` (neu): Wiederverwendbare Dialog-Komponente zum Bearbeiten von Produkten. Enthaelt Textfelder fuer Name und Preis. Der Preis wird mit `type="number"` und `step="0.01"` eingeschraenkt. Verwendet `v-model` mit dem Eltern-Component.
- `ListView.vue`: Jede Produktkarte hat jetzt einen Stift-Button. Klick oeffnet den Edit-Dialog mit den aktuellen Werten. Nach dem Speichern wird das Produkt in der Liste aktualisiert.
- Preisanzeige erfolgt als EUR-Badge rechts am Produkt, formatiert mit `Intl.NumberFormat('de-AT')`.

### Backend

- Bereits vorhanden: `ProductController.update()` akzeptiert Name und Preis.
- `ProductService.update()` setzt den neuen Namen und Preis und erhoeht die Version.

### Tests

- Bestehende Tests decken das Produkt-Update ab.
- Manuell getestet: Preis setzen, aendern, entfernen.
