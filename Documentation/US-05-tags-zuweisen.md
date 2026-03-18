# US-05: Tags zuweisen

## Beschreibung

Als Benutzer moechte ich einem Produkt Tags (Kategorien/Gruppen) zuweisen koennen, damit ich meine Einkaeufe strukturiert organisieren kann.

## Akzeptanzkriterien

- [x] Produkt kann mehrere Tags haben
- [x] Tags sind frei waehlbare Textfelder (z.B. "Obst", "Kuehlregal")
- [x] Vorhandene Tags werden als Vorschlaege angezeigt
- [x] Tags werden visuell am Produkt angezeigt (farbige Chips)

## Technische Umsetzung

### Backend

- `TagController.java` (neu): REST-Controller unter `/api/lists/{listId}/tags`. Unterstuetzt GET (alle Tags einer Liste), POST (neuen Tag erstellen), PUT (umbenennen), DELETE (loeschen).
- `TagService.java` (neu): Business-Logik fuer Tag-CRUD. Tags sind an eine ShoppingList gebunden.
- `ProductController.java`: Neuer Endpunkt `PATCH /{id}/tags` - nimmt eine Liste von Tag-IDs entgegen und setzt sie auf dem Produkt.
- `ProductService.setTags()`: Laedt die Tags anhand ihrer IDs und setzt sie als ManyToMany-Relation auf dem Produkt.

### Frontend

- `tagService.ts` (neu): API-Client fuer Tag-Endpunkte.
- `useTags.ts` (neu): Composable mit reaktiven Tags, CRUD-Funktionen und Tag-Zuweisung.
- `ListView.vue`: Tags werden als farbige Chips unter dem Produktnamen angezeigt. Im Edit-Dialog koennen Tags per Autocomplete zugewiesen werden.

### Datenmodell

- `Tag`: id (UUID), name (String), shoppingList (ManyToOne)
- `Product.tags`: ManyToMany-Relation ueber die Join-Tabelle `product_tags`
