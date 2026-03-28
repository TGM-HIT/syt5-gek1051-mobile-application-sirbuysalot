# API-Schnittstellen Dokumentation

## Übersicht

Die SirBuysALot API besteht aus einer RESTful HTTP-Schnittstelle und einer WebSocket-Schnittstelle für Echtzeit-Updates. Die interaktive Swagger-UI ist unter `/swagger-ui.html` erreichbar, die OpenAPI-Spezifikation unter `/api-docs`.

**Base-URL:** `http://localhost:8080`

---

## REST-Endpunkte

### Einkaufslisten

| Methode | Pfad | Beschreibung | Request Body | Response |
|---------|------|-------------|--------------|----------|
| `GET` | `/api/lists` | Alle aktiven Listen abrufen | - | `ShoppingList[]` |
| `GET` | `/api/lists/{id}` | Liste per UUID abrufen | - | `ShoppingList` / 404 |
| `POST` | `/api/lists` | Neue Liste erstellen | `{ "name": "Wocheneinkauf" }` | `ShoppingList` (mit generiertem `accessCode`) |
| `PUT` | `/api/lists/{id}` | Liste aktualisieren | `{ "name": "Neuer Name" }` | `ShoppingList` |
| `DELETE` | `/api/lists/{id}` | Liste soft-löschen | - | 204 No Content |
| `GET` | `/api/lists/join/{code}` | Per Zugangscode beitreten | - | `ShoppingList` / 404 |
| `GET` | `/api/lists/deleted` | Gelöschte Listen abrufen | - | `ShoppingList[]` |
| `PATCH` | `/api/lists/{id}/restore` | Gelöschte Liste wiederherstellen | - | `ShoppingList` |
| `POST` | `/api/lists/{id}/duplicate` | Liste inkl. Produkte duplizieren | - | `ShoppingList` (Kopie) |

### Produkte

| Methode | Pfad | Beschreibung | Request Body | Response |
|---------|------|-------------|--------------|----------|
| `GET` | `/api/lists/{listId}/products` | Alle aktiven Produkte | - | `Product[]` |
| `POST` | `/api/lists/{listId}/products` | Produkt hinzufügen | `{ "name": "Milch", "price": 1.49 }` | `Product` |
| `PUT` | `/api/lists/{listId}/products/{id}` | Produkt aktualisieren | `{ "name": "...", "price": ... }` | `Product` |
| `PATCH` | `/api/lists/{listId}/products/{id}/purchase` | Gekauft-Status umschalten | `{ "purchasedBy": "Anna" }` | `Product` |
| `DELETE` | `/api/lists/{listId}/products/{id}` | Produkt soft-löschen | - | 204 |
| `GET` | `/api/lists/{listId}/products/deleted` | Gelöschte Produkte | - | `Product[]` |
| `PATCH` | `/api/lists/{listId}/products/{id}/restore` | Produkt wiederherstellen | - | `Product` |
| `PATCH` | `/api/lists/{listId}/products/{id}/tags` | Tags zuweisen | `{ "tagIds": ["uuid1", "uuid2"] }` | `Product` |
| `PATCH` | `/api/lists/{listId}/products/reorder` | Sortierung ändern (Drag & Drop) | `[{ "id": "uuid", "position": 0 }]` | 200 OK |

### Tags

| Methode | Pfad | Beschreibung | Request Body | Response |
|---------|------|-------------|--------------|----------|
| `GET` | `/api/lists/{listId}/tags` | Alle Tags einer Liste | - | `Tag[]` |
| `POST` | `/api/lists/{listId}/tags` | Tag erstellen | `{ "name": "Obst" }` | `Tag` |
| `PUT` | `/api/lists/{listId}/tags/{id}` | Tag umbenennen | `{ "name": "Gemüse" }` | `Tag` |
| `DELETE` | `/api/lists/{listId}/tags/{id}` | Tag löschen | - | 204 |

### Benutzer

| Methode | Pfad | Beschreibung | Request Body | Response |
|---------|------|-------------|--------------|----------|
| `GET` | `/api/lists/{listId}/users` | Alle Benutzer einer Liste | - | `AppUser[]` |
| `POST` | `/api/lists/{listId}/users` | Liste beitreten | `{ "displayName": "Anna" }` | `AppUser` |

### Synchronisation

| Methode | Pfad | Beschreibung | Request Body | Response |
|---------|------|-------------|--------------|----------|
| `POST` | `/api/lists/{listId}/sync` | Offline-Batch synchronisieren | `{ "changes": [...] }` | `{ "results": [...], "synced": 3, "failed": 0 }` |

**Batch-Change Format:**
```json
{
  "changes": [
    {
      "type": "create_product",
      "payload": { "name": "Brot", "price": 2.50 }
    },
    {
      "type": "toggle_product",
      "payload": { "id": "uuid", "purchasedBy": "Anna" }
    }
  ]
}
```

Unterstützte Typen: `create_product`, `update_product`, `toggle_product`, `delete_product`, `update_list`, `delete_list`

---

## Datenmodelle

### ShoppingList
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Wocheneinkauf",
  "accessCode": "A1B2C3D4",
  "version": 1,
  "deletedAt": null,
  "createdAt": "2026-03-14T10:00:00"
}
```

### Product
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Milch",
  "price": 1.49,
  "purchased": false,
  "purchasedBy": null,
  "purchasedAt": null,
  "position": 0,
  "version": 1,
  "deletedAt": null,
  "tags": [{ "id": "...", "name": "Milchprodukte" }]
}
```

### Tag
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Obst"
}
```

### AppUser
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "displayName": "Anna",
  "joinedAt": "2026-03-14T10:30:00"
}
```

---

## WebSocket-Schnittstelle

**Endpoint:** `ws://localhost:8080/ws` (SockJS + STOMP)

### Topics

| Topic | Beschreibung | Payload |
|-------|-------------|---------|
| `/topic/lists/{listId}` | Echtzeit-Updates für eine Liste | `{ "type": "product_created", "data": {...} }` |

### Event-Typen

| Typ | Auslöser |
|-----|----------|
| `product_created` | Neues Produkt erstellt |
| `product_updated` | Produkt aktualisiert (Name, Preis) |
| `product_toggled` | Gekauft-Status geändert |
| `product_deleted` | Produkt gelöscht |
| `products_reordered` | Sortierung geändert |
| `tags_updated` | Tags eines Produkts geändert |
| `sync` | Batch-Sync abgeschlossen |

---

## Fehler-Responses

| HTTP Status | Bedeutung | Body |
|-------------|-----------|------|
| 400 Bad Request | Validierungsfehler (z.B. leerer Name) | `{ "field": "name", "message": "darf nicht leer sein" }` |
| 404 Not Found | Entity nicht gefunden | - |
| 409 Conflict | Versionskonflikt bei Update | `{ "message": "...", "serverVersion": 3, "clientVersion": 1 }` |
| 500 Internal Server Error | Serverfehler | `{ "message": "..." }` |

---

## Authentifizierung

Die API verwendet keine Authentifizierung. Der Zugang zu Listen erfolgt über den 8-stelligen Zugangscode (`accessCode`), der bei der Erstellung automatisch generiert wird.

## CORS

Cross-Origin-Anfragen sind für folgende Origins erlaubt:
- `http://localhost:5173` (Vite Dev Server)
- `http://localhost:3000`

Erlaubte Methoden: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
