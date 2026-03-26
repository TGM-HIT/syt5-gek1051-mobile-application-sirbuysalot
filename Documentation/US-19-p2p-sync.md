# US-19: P2P-Synchronisation

## Beschreibung

Als Benutzer moechte ich Aenderungen direkt mit anderen Benutzern im selben Netzwerk synchronisieren koennen, ohne den Umweg ueber den Server.

## Akzeptanzkriterien

- [x] PeerJS/WebRTC-basierte P2P-Verbindung zwischen Clients
- [x] Automatische Peer-ID-Generierung pro Liste
- [x] Dialog zum manuellen Verbinden mit einem anderen Peer
- [x] Peer-ID kopierbar fuer einfaches Teilen
- [x] Statusanzeige: P2P verbunden, Anzahl Peers
- [x] Broadcast-Funktion fuer Aenderungen an alle verbundenen Peers

## Technische Umsetzung

### Abhaengigkeiten

- `peerjs` (^1.5.4): WebRTC-Wrapper fuer einfache P2P-Kommunikation

### Frontend

- `p2pService.ts` (neu): Singleton-Service, der die PeerJS-Instanz verwaltet. Erzeugt pro Liste eine eindeutige Peer-ID (Prefix `sirbuysalot-` + listId + Random). Verwaltet eingehende und ausgehende Connections. Bietet `send()` zum Broadcast an alle Peers und `onMessage()` fuer eingehende Nachrichten. Automatische Reconnect-Logik bei Verbindungsabbruch.

- `useP2P.ts` (neu): Composable, das `p2pService` initialisiert und Lifecycle verwaltet. Bei Mount wird die P2P-Verbindung aufgebaut, bei Unmount zerstoert. Bietet `broadcast()` zum Senden von typisierten Nachrichten und `connectToPeer()` zum manuellen Verbinden. Gibt reaktive Refs zurueck: `peerId`, `connected`, `peerCount`.

- `P2PStatus.vue` (neu): UI-Komponente mit:
  - Chip-Anzeige: P2P-Status und Anzahl verbundener Peers
  - Dialog zum Verbinden: Zeigt eigene Peer-ID (kopierbar) und Eingabefeld fuer Remote Peer-ID
  - Link-Plus Button oeffnet den Verbindungs-Dialog

### Architektur

```
Client A                          Client B
   |                                 |
   |-- PeerJS connect(remotePeerId) ->|
   |<- DataConnection established ----|
   |                                 |
   |-- broadcast({type, payload}) -->|
   |<- onMessage(handler) ------------|
```

### Datenfluesse

1. P2P eignet sich fuer Echtzeit-Updates wenn beide Clients online sind
2. Der Server bleibt die "Source of Truth" fuer persistente Daten
3. P2P-Nachrichten sind ergaenzend zum Server-Sync, nicht als Ersatz
4. Bei Netzwerkwechsel (z.B. WLAN -> Mobil) wird automatisch reconnected
