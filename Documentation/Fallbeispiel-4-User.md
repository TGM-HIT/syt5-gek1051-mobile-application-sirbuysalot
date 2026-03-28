# Fallbeispiel: 4 Benutzer (2 online / 2 offline)

## Ausgangssituation

Vier Mitbewohner teilen eine Einkaufsliste "WG-Einkauf" mit dem Zugangscode `A1B2C3D4`. Alle haben die PWA installiert und der Liste beigetreten.

| Benutzer | Geraet | Status | Rolle |
|----------|--------|--------|-------|
| Anna | Smartphone | **Online** | Zu Hause, plant Einkauf |
| Ben | Laptop | **Online** | Im Buero, fuegt Wuensche hinzu |
| Clara | Smartphone | **Offline** | In der U-Bahn, kein Netz |
| David | Tablet | **Offline** | Im Keller, kein WLAN |

---

## Szenario-Ablauf

### Phase 1: Paralleles Arbeiten (t=0 bis t=5min)

**Anna (online)** erstellt drei Produkte:
```
POST /api/lists/{id}/products
→ { "name": "Milch", "price": 1.49 }
→ { "name": "Brot", "price": 2.30 }
→ { "name": "Butter", "price": 1.99 }
```
- Alle drei Produkte werden sofort in der PostgreSQL-DB gespeichert
- WebSocket broadcastet `product_created` Events an `/topic/lists/{listId}`

**Ben (online)** sieht Annas Produkte sofort via WebSocket:
- Sein Browser empfaengt die `product_created` Events
- Die Produkte erscheinen in Echtzeit in seiner Listenansicht
- Ben fuegt hinzu: `{ "name": "Kaese", "price": 3.49 }`
- Anna sieht Bens Kaese sofort via WebSocket

**Clara (offline)** fuegt ebenfalls Produkte hinzu:
- Die Eingaben werden lokal in IndexedDB (Dexie.js) gespeichert
- `syncService.storePendingChange()` speichert die Aenderungen in der Pending-Queue:
  ```
  Pending Changes:
  1. { type: "create_product", payload: { name: "Eier", price: 2.99 } }
  2. { type: "create_product", payload: { name: "Tomaten", price: 1.79 } }
  ```
- Die Offline-Banner-Anzeige ist sichtbar ("Offline - Aenderungen werden bei Verbindung synchronisiert")
- Clara kann die Liste trotzdem voll nutzen (lesen, hinzufuegen, abhaken)

**David (offline)** hakt "Milch" als gekauft ab:
- Er sieht die Liste aus seiner letzten Synchronisation (Milch, Brot, Butter sind vorhanden)
- Toggle wird lokal gespeichert:
  ```
  Pending Changes:
  1. { type: "toggle_product", payload: { id: "milch-uuid", purchasedBy: "David" } }
  ```
- Milch erscheint bei David sofort als durchgestrichen mit "David" als Kaeufer

### Phase 2: Versionskonflikt (t=5min)

**Anna (online)** aendert den Preis der Milch:
```
PUT /api/lists/{id}/products/{milch-id}
→ { "name": "Milch", "price": 1.69, "version": 1 }
→ Response: version=2
```

Das erzeugt einen potenziellen Konflikt mit Davids offline Toggle, da die Milch jetzt `version=2` hat. Davids Aenderung basiert noch auf `version=1`.

### Phase 3: Clara kommt online (t=10min)

Clara bekommt wieder Netz. Die App erkennt die Verbindung (`useOnlineStatus`):

1. **Batch-Sync wird ausgeloest:**
   ```
   POST /api/lists/{id}/sync
   {
     "changes": [
       { "type": "create_product", "payload": { "name": "Eier", "price": 2.99 } },
       { "type": "create_product", "payload": { "name": "Tomaten", "price": 1.79 } }
     ]
   }
   ```

2. **Server verarbeitet den Batch:**
   ```json
   {
     "results": [
       { "status": "success", "type": "create_product", "data": { "id": "eier-uuid", "name": "Eier" } },
       { "status": "success", "type": "create_product", "data": { "id": "tomaten-uuid", "name": "Tomaten" } }
     ],
     "synced": 2,
     "failed": 0
   }
   ```

3. **WebSocket verbreitet die neuen Produkte:**
   - Anna und Ben sehen sofort "Eier" und "Tomaten" in ihrer Liste
   - Clara bekommt auch Bens "Kaese" und Annas Preisaenderung via Sync-Response

4. **Zustand nach Claras Sync:**
   | Produkt | Preis | Status | Sichtbar fuer |
   |---------|-------|--------|---------------|
   | Milch | 1.69 | aktiv (v2) | Alle (Anna, Ben, Clara) |
   | Brot | 2.30 | aktiv | Alle |
   | Butter | 1.99 | aktiv | Alle |
   | Kaese | 3.49 | aktiv | Alle |
   | Eier | 2.99 | aktiv | Alle |
   | Tomaten | 1.79 | aktiv | Alle |

### Phase 4: David kommt online (t=15min)

David verbindet sich wieder. Sein Pending-Change wird gesendet:

1. **Batch-Sync:**
   ```
   POST /api/lists/{id}/sync
   {
     "changes": [
       { "type": "toggle_product", "payload": { "id": "milch-uuid", "purchasedBy": "David" } }
     ]
   }
   ```

2. **Server verarbeitet den Toggle:**
   - Der Toggle-Endpunkt prueft NICHT die Version (Toggles sind immer safe)
   - Milch wird als gekauft markiert: `purchased=true, purchasedBy="David", purchasedAt=2026-03-28T12:15:00`
   - Version wird auf 3 hochgezaehlt

3. **WebSocket-Broadcast:**
   - Alle vier Benutzer sehen jetzt: Milch ist durchgestrichen, "David - vor 5 Min."

4. **David empfaengt fehlende Aenderungen:**
   - Eier, Tomaten, Kaese erscheinen in seiner Liste
   - Milch-Preis aktualisiert sich von 1.49 auf 1.69

### Endzustand (t=15min)

Alle 4 Benutzer sehen dieselbe konsistente Liste:

| Produkt | Preis | Status | Gekauft von |
|---------|-------|--------|-------------|
| ~~Milch~~ | ~~1.69~~ | ~~gekauft~~ | ~~David, 12:15~~ |
| Brot | 2.30 | offen | - |
| Butter | 1.99 | offen | - |
| Kaese | 3.49 | offen | - |
| Eier | 2.99 | offen | - |
| Tomaten | 1.79 | offen | - |

**Gesamtkosten:** 14.25 | **Bereits gekauft:** 1.69

---

## Technische Erklaerung der Synchronisation

### Online-Pfad (Anna, Ben)
```
User Action → API Call → DB Update → WebSocket Broadcast → Alle Online-Clients
```

### Offline-Pfad (Clara, David)
```
User Action → IndexedDB (lokal) → Pending Queue
                                      ↓ (bei Verbindung)
                              POST /sync (Batch)
                                      ↓
                              Server verarbeitet einzeln
                                      ↓
                              WebSocket Broadcast an alle
```

### Konfliktbehandlung
- **Optimistic Locking:** Updates pruefen `version`-Feld. Bei Mismatch: HTTP 409 mit `serverVersion` und `clientVersion`
- **Toggles sind idempotent:** Kauf-Markierung ist ein Toggle, daher kein Versionskonflikt
- **Create ist immer safe:** Neue Produkte haben keine Version, daher kein Konflikt
- **version=0 ueberspringt Check:** Offline-Syncs senden `version=0`, damit der Server die Aenderung immer akzeptiert

### Datenkonsistenz-Garantie
1. Server ist **Single Source of Truth** fuer die finale Version
2. Lokale IndexedDB dient als **Cache und Offline-Puffer**
3. Nach erfolgreicher Sync wird die lokale DB mit der Server-Response aktualisiert
4. WebSockets stellen sicher, dass Online-Clients innerhalb von Millisekunden aktualisiert werden
