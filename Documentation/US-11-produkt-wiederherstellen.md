# US-11: Produkt wiederherstellen

## Beschreibung

Als Benutzer moechte ich ausgeblendete Produkte wiederherstellen koennen, damit versehentlich entfernte Eintraege nicht verloren gehen.

## Akzeptanzkriterien

- [x] Benutzer kann ausgeblendete Produkte anzeigen lassen
- [x] Ausgeblendete Produkte koennen wiederhergestellt werden
- [x] Wiederhergestellte Produkte erscheinen wieder in der Liste

## Technische Umsetzung

### Backend

- `ProductService.findDeletedByListId()`: Liefert alle Produkte mit gesetztem `deletedAt` fuer eine Liste.
- `ProductService.restore()`: Setzt `deletedAt` auf `null` und erhoeht die Version.
- `ProductController`: Neue Endpunkte `GET /api/lists/{listId}/products/deleted` und `PATCH /api/lists/{listId}/products/{id}/restore`.

### Frontend

- `productService.ts`: Neue Methoden `getDeleted()` und `restore()`.
- `useProducts.ts`: Neues Ref `deletedProducts`, Funktionen `fetchDeletedProducts()` und `restoreProduct()`.
- `ListView.vue`: Ein Toggle-Switch "Ausgeblendete anzeigen" zeigt geloeschte Produkte in einem separaten Bereich. Jedes geloeschte Produkt hat einen "Wiederherstellen"-Button, der es zurueck in die aktive Liste verschiebt.

### Ablauf

1. Benutzer aktiviert den Switch "Ausgeblendete anzeigen"
2. Geloeschte Produkte werden vom Server geladen und angezeigt
3. Klick auf "Wiederherstellen" bei einem Produkt
4. Produkt erscheint wieder in der aktiven Liste
5. Snackbar bestaetigt die Wiederherstellung
