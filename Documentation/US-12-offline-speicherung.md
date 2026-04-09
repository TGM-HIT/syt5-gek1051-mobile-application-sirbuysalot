# US-12: Offline-Speicherung

## Beschreibung

Als Benutzer moechte ich alle Aenderungen offline vornehmen koennen, wobei diese lokal mit Zeitstempel gespeichert werden, damit ich auch ohne Internet arbeiten kann.

## Akzeptanzkriterien

- [x] Alle Aenderungen werden in IndexedDB gespeichert
- [x] Aenderungen erhalten einen Zeitstempel
- [x] UI zeigt Offline-Status an (Banner)
- [x] Alle CRUD-Operationen funktionieren ohne Netzwerk
- [x] Lokale Aenderungen sind als "pending sync" markiert

## Technische Umsetzung

### Frontend

- `db/index.ts`: Neues Schema (Version 2) mit `pendingChanges`-Tabelle. Jede Offline-Aenderung wird mit Typ, Entity, Payload und Zeitstempel gespeichert.
- `useOnlineStatus.ts` (neu): Composable, das den Online/Offline-Status des Browsers ueberwacht (via `navigator.onLine` und Event-Listener).
- `OfflineBanner.vue` (neu): Sticky-Banner am oberen Rand, das bei fehlendem Netzwerk erscheint und den Benutzer informiert.
- `App.vue`: OfflineBanner eingebunden, erscheint zwischen AppBar und Content.

### Architektur (Dexie-First Pattern)

1. Alle Schreiboperationen gehen zuerst an IndexedDB (Dexie.js)
2. Parallel wird versucht, die Aenderung an die REST API zu senden
3. Bei Erfolg: `synced: true` in Dexie setzen
4. Bei Fehler (offline): Aenderung als `pendingChange` speichern
5. Beim Wechsel zu Online: Automatische Synchronisation der ausstehenden Aenderungen

### Datenmodell

- `PendingChange`: id (auto-increment), type, entity, entityId, listId, payload, timestamp
- Alle lokalen Entities haben ein `synced`-Flag

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Alle Aenderungen werden in IndexedDB gespeichert | syncService.test.ts | storePendingChange |
| Aenderungen erhalten einen Zeitstempel | syncService.test.ts | storePendingChange |
| Alle CRUD-Operationen funktionieren ohne Netzwerk | syncService.test.ts | getPendingChanges |
| Alle CRUD-Operationen funktionieren ohne Netzwerk | syncService.test.ts | clearPendingChanges |
| Lokale Aenderungen sind als "pending sync" markiert | syncService.test.ts | getPendingCount |
| Lokale Aenderungen sind als "pending sync" markiert | syncService.test.ts | getPendingChanges |
