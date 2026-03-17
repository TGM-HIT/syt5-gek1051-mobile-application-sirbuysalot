# US-07: Produkt als gekauft markieren

## Beschreibung

Als Benutzer moechte ich ein Produkt als "gekauft" markieren oder diese Markierung wieder aufheben koennen (durchgestrichen + ausgegraut), damit der aktuelle Status sichtbar ist.

## Akzeptanzkriterien

- [x] Klick auf Produkt markiert es als "gekauft"
- [x] Markiertes Produkt ist durchgestrichen und ausgegraut
- [x] Erneuter Klick hebt die Markierung auf
- [x] Status wird mit Zeitstempel gespeichert

## Technische Umsetzung

### Backend

- `ProductService.markPurchased()`: Toggled den `purchased`-Boolean. Bei Aktivierung werden `purchasedBy` und `purchasedAt` gesetzt, bei Deaktivierung auf `null` zurueckgesetzt. Die Version wird hochgezaehlt.
- `ProductController`: PATCH `/api/lists/{listId}/products/{id}/purchase` mit `purchasedBy` im Body.

### Frontend

- `ListView.vue`: Klick auf eine Produktkarte ruft `onTogglePurchase()` auf. Die Checkbox-Darstellung spiegelt den Status. Gekaufte Produkte werden automatisch nach unten sortiert (via `sortedProducts` Computed).
- Visuelle Darstellung: Durchgestrichen (`text-decoration-line-through`), ausgegraut (`text-medium-emphasis`), reduzierte Deckkraft (`opacity: 0.7`).
- Animations-Transition beim Verschieben nach unten/oben.

### Ablauf

1. Benutzer klickt auf ein Produkt
2. Toggle-Request wird ans Backend gesendet
3. Backend setzt `purchased`, `purchasedBy`, `purchasedAt`
4. UI aktualisiert sich: Produkt wird durchgestrichen und rutscht nach unten
5. Erneuter Klick macht die Markierung rueckgaengig
