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
