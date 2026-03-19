# US-21: Nach Tags filtern

## Beschreibung

Als Benutzer moechte ich Produkte nach Tags filtern koennen, damit ich nur bestimmte Kategorien sehe.

## Akzeptanzkriterien

- [x] Filterleiste zeigt alle verfuegbaren Tags
- [x] Ein oder mehrere Tags koennen ausgewaehlt werden
- [x] Nur Produkte mit ausgewaehlten Tags werden angezeigt
- [x] Filter kann zurueckgesetzt werden

## Technische Umsetzung

### Frontend

- `ListView.vue`: Unterhalb des Suchfeldes werden alle verfuegbaren Tags als filterbare Chips angezeigt. Klick auf einen Chip aktiviert/deaktiviert den Filter. Es koennen mehrere Tags gleichzeitig ausgewaehlt werden. Nur Produkte, die mindestens einen der ausgewaehlten Tags haben, werden angezeigt.
- Die Filterung wird mit der Suche kombiniert: Ein Produkt muss sowohl dem Suchbegriff als auch den ausgewaehlten Tags entsprechen.

### Ablauf

1. Tags werden als klickbare Chips angezeigt
2. Klick auf einen Tag aktiviert den Filter (farbig hervorgehoben)
3. Produktliste zeigt nur noch passende Produkte
4. Erneuter Klick auf den Tag deaktiviert den Filter
5. Klick auf "Alle" setzt den Filter zurueck
