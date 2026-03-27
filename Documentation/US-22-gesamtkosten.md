# US-22: Gesamtkosten

## Beschreibung

Als Benutzer moechte ich die Gesamtkosten meiner Einkaufsliste sehen, damit ich mein Budget im Blick behalten kann.

## Akzeptanzkriterien

- [x] Kostenuebersicht als Card im ListView sichtbar
- [x] Anzeige: Gekauft, Offen, Gesamt
- [x] Nur sichtbar wenn mindestens ein Produkt einen Preis hat
- [x] Formatierung in Euro (de-AT Locale)
- [x] Berechnung aktualisiert sich automatisch bei Aenderungen

## Technische Umsetzung

### Frontend

- `ListView.vue` (geaendert): Neue Cost-Summary-Card zwischen Fortschritts-Card und Suchleiste. Drei Computed Properties:
  - `totalCost`: Summe aller Preise (nur Produkte mit Preis)
  - `purchasedCost`: Summe der Preise gekaufter Produkte
  - `remainingCost`: Differenz aus totalCost und purchasedCost
- Card zeigt drei Werte in Spalten: "Gekauft" (gruen), "Offen" (orange), "Gesamt" (primaer)
- Verwendet bestehende `formatPrice()` Funktion (Intl.NumberFormat, de-AT, EUR)
- Card wird nur angezeigt, wenn `totalCost > 0`
