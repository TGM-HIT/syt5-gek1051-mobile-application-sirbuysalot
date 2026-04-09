# US-13: Automatische Synchronisation

## Beschreibung

Als Benutzer moechte ich, dass meine Offline-Aenderungen automatisch synchronisiert werden, sobald ich wieder online bin, damit keine manuelle Aktion noetig ist.

## Akzeptanzkriterien

- [x] Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal
- [x] Frontend erkennt Online-Wechsel und startet automatisch Sync
- [x] WebSocket-Verbindung fuer Echtzeit-Updates zwischen Clients
- [x] SyncStatusIndicator zeigt ausstehende Aenderungen und Verbindungsstatus
- [x] Backend broadcastet Aenderungen an verbundene Clients

## Technische Umsetzung

### Backend

- `SyncController.java` (neu): REST-Endpoint `POST /api/lists/{listId}/sync` fuer Batch-Synchronisation. Nimmt eine Liste von Offline-Aenderungen entgegen und verarbeitet diese sequenziell. Gibt Ergebnis pro Aenderung zurueck (synced/failed).
- `SyncService.java` (neu): Verarbeitet Batch-Sync mit `processBatch()`. Unterstuetzt create, update, toggle und delete fuer Produkte und Listen. Broadcastet Aenderungen via `SimpMessagingTemplate` an verbundene WebSocket-Clients.
- `ProductService.java` (geaendert): Alle Schreibmethoden (create, update, markPurchased, softDelete, setTags) senden jetzt nach erfolgreicher DB-Speicherung eine Nachricht an `/topic/lists/{listId}`. So werden verbundene Clients sofort ueber Aenderungen informiert.
- `WebSocketConfig.java` (bestehend): STOMP-Konfiguration war bereits vorhanden mit Simple Broker auf `/topic` und SockJS-Fallback auf `/ws`.

### Frontend

- `syncService.ts` (neu): Service fuer die Synchronisation von Offline-Aenderungen. Liest `pendingChanges` aus IndexedDB, sendet sie als Batch an den Server, entfernt erfolgreich synchronisierte Eintraege aus der lokalen DB und markiert die zugehoerigen Entities als `synced: true`.
- `websocketService.ts` (neu): WebSocket-Client mit automatischer Reconnect-Logik. Verbindet sich per Raw-WebSocket (SockJS-Fallback ist vorbereitet). Unterstuetzt Topic-basierte Subscriptions und Wildcard-Listener. Exponentielles Backoff bei Verbindungsverlust (max 10 Versuche).
- `SyncStatusIndicator.vue` (neu): Kompakte UI-Komponente, die im ListView angezeigt wird. Zeigt die Anzahl ausstehender Aenderungen als Chip an. Icon fuer Verbindungsstatus (Offline/REST/WebSocket). Startet automatisch Sync bei Online-Wechsel.

### Architektur

1. Online-Betrieb: Alle Aenderungen gehen direkt an die REST API, Backend broadcastet via WebSocket an andere Clients
2. Offline-Betrieb: Aenderungen werden in `pendingChanges`-Tabelle (IndexedDB) zwischengespeichert
3. Reconnect: Bei Online-Wechsel werden alle ausstehenden Aenderungen als Batch an `/api/lists/{listId}/sync` gesendet
4. Echtzeit: Verbundene Clients erhalten Push-Updates via WebSocket, sodass Aenderungen sofort sichtbar sind

### Datenfluss Batch-Sync

```
Client geht online
  -> syncService.syncPendingChanges(listId)
    -> POST /api/lists/{listId}/sync { changes: [...] }
      -> SyncService.processBatch() verarbeitet jede Aenderung
      -> Broadcastet /topic/lists/{listId} an andere Clients
    <- { results: [{id, status}], synced: N, failed: M }
  -> Erfolgreich: pendingChanges aus IndexedDB entfernen
  -> Fehlgeschlagen: bleiben fuer naechsten Versuch gespeichert
```

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_createProduct |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_updateProduct |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_toggleProduct |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_deleteProduct |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_updateList |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_deleteList |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncServiceTest.java | processBatch_returnsCorrectCounts |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncControllerTest.java | syncBatch_returnsResults |
| Batch-Sync-Endpoint im Backend verarbeitet mehrere Aenderungen auf einmal | SyncControllerTest.java | syncBatch_mixedResults |
| Frontend erkennt Online-Wechsel und startet automatisch Sync | syncService.test.ts | syncChanges |
| Frontend erkennt Online-Wechsel und startet automatisch Sync | syncService.test.ts | retrySync |
| Frontend erkennt Online-Wechsel und startet automatisch Sync | syncService.test.ts | syncChanges returns counts |
| WebSocket-Verbindung fuer Echtzeit-Updates zwischen Clients | SyncServiceTest.java | processBatch_broadcastsWebSocket |
| SyncStatusIndicator zeigt ausstehende Aenderungen und Verbindungsstatus | syncService.test.ts | getPendingCount |
| SyncStatusIndicator zeigt ausstehende Aenderungen und Verbindungsstatus | syncService.test.ts | getPendingChanges |
| Backend broadcastet Aenderungen an verbundene Clients | SyncServiceTest.java | processBatch_broadcastsWebSocket |
| Backend broadcastet Aenderungen an verbundene Clients | SyncControllerTest.java | syncBatch_returnsResults |
| Batch-Sync mit leeren Aenderungen | SyncServiceTest.java | processBatch_emptyChanges |
| Batch-Sync mit leeren Aenderungen | SyncControllerTest.java | syncBatch_emptyChanges |
| Batch-Sync mit leeren Aenderungen | SyncControllerTest.java | syncBatch_nullChanges |
| Batch-Sync mit unbekanntem Typ | SyncServiceTest.java | processBatch_unknownType_fails |
| Batch-Sync mit ungueltigem Produkt | SyncServiceTest.java | processBatch_invalidProduct_countsFailed |
| Batch-Sync mit ungueltiger Listen-ID | SyncControllerTest.java | syncBatch_invalidListId |
| Frontend Sync-Fehlerbehandlung | syncService.test.ts | syncChanges error |
| Frontend Sync-Fehlerbehandlung | syncService.test.ts | syncChanges mixed |
| Frontend Sync-Fehlerbehandlung | syncService.test.ts | syncChanges empty |
