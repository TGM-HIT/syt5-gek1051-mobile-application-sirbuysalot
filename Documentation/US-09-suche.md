# US-09: Produkte durchsuchen

## Beschreibung

Als Benutzer moechte ich Produkte in der Einkaufsliste durchsuchen koennen (auch mit einzelnen Buchstaben), damit ich schnell finde, was ich suche.

## Akzeptanzkriterien

- [x] Suchfeld ist immer sichtbar
- [x] Suche startet bereits ab dem ersten Buchstaben
- [x] Suche filtert Produkte in Echtzeit
- [x] Gross-/Kleinschreibung wird ignoriert
- [x] Suche durchsucht Produktnamen und Tags

## Technische Umsetzung

### Frontend

- `ListView.vue`: Ein `v-text-field` mit Lupen-Icon wird ueber der Produktliste angezeigt. Die Filterung erfolgt client-seitig in einer `computed`-Property. Die Suche ist case-insensitive und durchsucht sowohl den Produktnamen als auch die Tag-Namen.
- Kein Backend noetig: Alle Produkte sind bereits geladen, die Filterung geschieht im Browser.

### Ablauf

1. Benutzer tippt in das Suchfeld
2. Ab dem ersten Zeichen werden Produkte gefiltert
3. Nur Produkte, deren Name oder Tags den Suchbegriff enthalten, werden angezeigt
4. Loeschen des Suchfeldes zeigt wieder alle Produkte
