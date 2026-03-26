# US-23: Drag & Drop Sortierung

## Beschreibung

Als Benutzer moechte ich Produkte in meiner Einkaufsliste per Drag & Drop sortieren koennen, damit ich die Reihenfolge meiner Einkaeufe frei bestimmen kann.

## Akzeptanzkriterien

- [x] Drag-Handle (Griff-Icon) an jedem Produkt sichtbar
- [x] Produkte per Drag & Drop verschiebbar
- [x] Neue Reihenfolge wird an den Server gesendet (PATCH /reorder)
- [x] Touch-Support fuer mobile Geraete
- [x] Ghost-Element waehrend des Ziehens als visuelles Feedback

## Technische Umsetzung

### Abhaengigkeiten

- `vuedraggable` (^4.1.0): Vue 3-Wrapper fuer SortableJS
- `sortablejs` (^1.15.3): Basis-Bibliothek fuer Drag & Drop

### Backend

- `ProductController.java` (geaendert): Neuer `PATCH /reorder` Endpoint. Empfaengt eine Liste von `{id, position}` Paaren.
- `ProductService.java` (geaendert): `reorder()` Methode setzt die Position fuer jedes Produkt und broadcastet die Aenderung.
- `Product.java` (bestehend): `position` Feld existierte bereits im Modell.

### Frontend

- `ListView.vue` (geaendert): Die `<transition-group>` wurde durch `<draggable>` ersetzt. Das Draggable nutzt ein `handle`-Attribut (`.drag-handle`), sodass nur das Griff-Icon zum Verschieben genutzt werden kann. Bei `@end` wird `onDragEnd()` aufgerufen, das die neuen Positionen an den Server sendet.
- `productService.ts` (geaendert): Neue `reorder()` Methode, die `PATCH /reorder` mit der neuen Reihenfolge aufruft.
- Sortierung: Die `sortedProducts` Computed Property beruecksichtigt jetzt die `position` als sekundaeres Kriterium (nach dem purchased-Status).
- `draggableProducts` ist ein Computed mit Getter/Setter: Der Setter aktualisiert die Positionen direkt im reaktiven Array.

### Touch-Support

Durch SortableJS ist Touch-Support nativ integriert. Das `touch-action: none` CSS auf dem Handle verhindert Scroll-Konflikte auf mobilen Geraeten.
