# Tech-Doc: US-14 - Konfliktbehandlung bei Synchronisation

**Story:** #18 - Konfliktbehandlung  
**Story Points:** 5  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-13 (Auto-Sync)

---

## 1. Überblick

Diese Story behandelt Synchronisationskonflikte, die entstehen wenn mehrere Benutzer gleichzeitig dieselben Daten ändern. Die Strategie ist **Server Wins** - bei Konflikten wird der aktuelle Server-Zustand bevorzugt und an den Client übertragen.

---

## 2. Konfliktarten

| Art | Beschreibung | Behandlung |
|-----|--------------|------------|
| **Version-Konflikt** | Client sendet veraltete Version | Server-State gewinnt |
| **Gleichzeitige Edits** | Zwei Clients ändern dasselbe | Server-State gewinnt |
| **Gelöschtes Item** | Client aktualisiert gelöschtes Item | Server ignoriert |
| **Netzwerk-Fehler** | Timeout/Serverfehler | Retry mit Backoff |

---

## 3. Konflikterkennung

### 3.1 Server-seitig (Version-Vergleich)

```java
// SyncService.java

private SyncResult processUpdate(SyncOperation op) {
    ShoppingList current = listRepository.findById(id)
        .orElseThrow(() -> new NotFoundException());
    
    // Version prüfen
    if (!current.getVersion().equals(op.getLocalVersion())) {
        // KONFLIKT!
        throw new ConflictException(current);
    }
    
    // Update durchführen
    current.setVersion(current.getVersion() + 1);
    return SyncResult.success(current);
}
```

### 3.2 HTTP-Status-Codes

| Status | Bedeutung | Body |
|--------|----------|------|
| 200 | Erfolg | Aktualisierte Entity |
| 409 | Konflikt | Aktueller Server-State |
| 404 | Nicht gefunden | - |
| 400 | Bad Request | Fehlermeldung |

---

## 4. Server-Wins Strategie

### 4.1 Ablaufdiagramm

```
┌──────────────────────────────────────────────────────────────────┐
│                    KONFLIKT-ABLAUF                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Client: { version: 3, data: {...}                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Server: current.version = 5                                    │
│  Request.version = 3                                          │
│  → VERSION MISMATCH!                                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Server: HTTP 409 Conflict                                      │
│  {                                                              │
│    "status": "conflict",                                       │
│    "currentState": { version: 5, ... },                        │
│    "serverTimestamp": "2026-03-19T..."                         │
│  }                                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Client: Lokale Daten überschreiben                             │
│  db.items.put(serverState)                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Client: UI aktualisieren + Snackbar                            │
│  "Änderung von anderem Gerät übernommen"                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. API-Spezifikation

### 5.1 Konflikt-Response

```typescript
// HTTP 409 Conflict
interface ConflictResponse {
  status: 'conflict'
  entity: 'list' | 'product'
  entityId: string
  currentState: ShoppingList | Product
  serverVersion: number
  serverTimestamp: string
  conflictReason: 'version_mismatch' | 'deleted' | 'permission_denied'
}
```

### 5.2 Batch-Konflikt-Response

```typescript
// HTTP 200 (mit Konflikten in body)
interface SyncBatchResponse {
  results: SyncResult[]
  conflicts: ConflictInfo[]
}

interface SyncResult {
  localId: string
  status: 'success' | 'conflict' | 'error'
  serverId?: string
  version?: number
}

interface ConflictInfo {
  localId: string
  entityId: string
  currentState: any
  serverVersion: number
}
```

---

## 6. Implementierung

### 6.1 Backend - ConflictException

```java
// src/main/java/at/tgm/sirbuysalot/exception/ConflictException.java

public class ConflictException extends RuntimeException {
    private final Object currentState;
    private final int serverVersion;

    public ConflictException(Object currentState, int serverVersion) {
        super("Version mismatch detected");
        this.currentState = currentState;
        this.serverVersion = serverVersion;
    }

    public Object getCurrentState() {
        return currentState;
    }

    public int getServerVersion() {
        return serverVersion;
    }
}
```

### 6.2 Backend - GlobalExceptionHandler

```java
// src/main/java/at/tgm/sirbuysalot/exception/GlobalExceptionHandler.java

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ConflictResponse> handleConflict(ConflictException ex) {
        ConflictResponse response = ConflictResponse.builder()
            .status("conflict")
            .currentState(ex.getCurrentState())
            .serverVersion(ex.getServerVersion())
            .build();
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Void> handleNotFound(NotFoundException ex) {
        return ResponseEntity.notFound().build();
    }
}
```

### 6.3 Backend - SyncService mit Konfliktbehandlung

```java
// src/main/java/at/tgm/sirbuysalot/service/SyncService.java

@Service
@RequiredArgsConstructor
public class SyncService {

    @Transactional
    public SyncResult processUpdate(SyncOperation op) {
        if (op.getEntity() == Entity.LIST) {
            return processListUpdate(op);
        }
        return processProductUpdate(op);
    }

    private SyncResult processListUpdate(SyncOperation op) {
        UUID id = UUID.fromString(op.getEntityId());
        Optional<ShoppingList> opt = listRepository.findById(id);
        
        // Item wurde gelöscht
        if (opt.isEmpty()) {
            return SyncResult.builder()
                .localId(op.getEntityId())
                .status(SyncStatus.CONFLICT)
                .conflictReason("deleted")
                .build();
        }
        
        ShoppingList current = opt.get();
        
        // Version-Konflikt
        if (!current.getVersion().equals(op.getLocalVersion())) {
            return SyncResult.builder()
                .localId(op.getEntityId())
                .status(SyncStatus.CONFLICT)
                .currentState(current)
                .serverVersion(current.getVersion())
                .conflictReason("version_mismatch")
                .build();
        }
        
        // Update durchführen
        updateListFromPayload(current, op.getPayload());
        current.setVersion(current.getVersion() + 1);
        ShoppingList saved = listRepository.save(current);
        
        // WebSocket-Broadcast
        messagingTemplate.convertAndSend("/topic/lists/" + saved.getId(), saved);
        
        return SyncResult.success(op.getEntityId(), saved.getVersion());
    }
}
```

### 6.4 Frontend - Konfliktbehandlung

```typescript
// src/services/syncService.ts

export const syncService = {
  async processQueue() {
    const operations = await this.getPendingOperations()
    
    for (const op of operations) {
      try {
        await this.processOperation(op)
        await this.markAsSynced(op.id)
      } catch (error) {
        if (error.response?.status === 409) {
          // KONFLIKT: Server gewinnt
          await this.handleConflict(error.response.data, op)
        } else {
          // Anderer Fehler: Log und Retry später
          console.error('Sync error:', error)
        }
      }
    }
  },

  async handleConflict(conflictData: ConflictResponse, operation: SyncOperation) {
    const { currentState, serverVersion, conflictReason } = conflictData
    
    if (conflictReason === 'deleted') {
      // Item wurde gelöscht: Lokal auch löschen
      await this.deleteLocalEntity(operation.entity, operation.entityId)
    } else {
      // Version-Konflikt: Server-State übernehmen
      await this.applyServerState(operation.entity, currentState)
      
      // Info an Benutzer
      showSnackbar('Änderung von anderem Gerät übernommen', 'info', 'mdi-information')
    }
    
    // Operation als "behandelt" markieren
    await this.markAsSynced(operation.id)
  },

  async applyServerState(entity: 'list' | 'product', serverState: any) {
    if (entity === 'list') {
      await db.shoppingLists.put({
        ...serverState,
        synced: true,
        lastModified: new Date().toISOString()
      })
      
      // Vue State aktualisieren
      const idx = lists.value.findIndex(l => l.id === serverState.id)
      if (idx !== -1) {
        lists.value[idx] = { ...lists.value[idx], ...serverState }
      }
    } else {
      await db.products.put({
        ...serverState,
        synced: true,
        lastModified: new Date().toISOString()
      })
      
      // Vue State aktualisieren
      const idx = products.value.findIndex(p => p.id === serverState.id)
      if (idx !== -1) {
        products.value[idx] = { ...products.value[idx], ...serverState }
      }
    }
  },
}
```

---

## 7. UI-Feedback

### 7.1 Snackbar bei Konflikt

```vue
<v-snackbar v-model="conflictSnackbar" color="info" timeout="5000">
  <v-icon start icon="mdi-information" />
  {{ conflictMessage }}
  <template #actions>
    <v-btn variant="text" @click="conflictSnackbar = false">
      Schließen
    </v-btn>
  </template>
</v-snackbar>

<script setup lang="ts">
const conflictSnackbar = ref(false)
const conflictMessage = ref('')

function showConflict(message: string) {
  conflictMessage.value = message
  conflictSnackbar.value = true
}

// Verwendung
showConflict('Änderung von anderem Gerät übernommen')
</script>
```

### 7.2 Offline-Banner Erweiterung

```vue
<v-banner
  v-if="!isOnline"
  color="warning"
  icon="mdi-wifi-off"
>
  <v-banner-text>
    Offline-Modus
    <span v-if="pendingCount > 0">
      ({{ pendingCount }} Änderungen warten)
    </span>
  </v-banner-text>
</v-banner>

<v-banner
  v-if="syncStatus === 'error'"
  color="error"
  icon="mdi-cloud-alert"
>
  <v-banner-text>
    Synchronisation fehlgeschlagen
  </v-banner-text>
  <v-banner-actions>
    <v-btn @click="retrySync">
      Erneut versuchen
    </v-btn>
  </v-banner-actions>
</v-banner>
```

---

## 8. Zeitstempel-Synchronisation

### 8.1 Problem

Bei Last-Write-Wins mit Zeitstempeln können Uhren unterschiedlich sein.

### 8.2 Lösung

```
1. Client: Sendet lokale Zeit + lokale Version
2. Server: Vergleicht Version (führend)
3. Bei Gleichstand: Server-Zeit als Referenz
```

```typescript
// Bei Konflikt: Server-Zeit verwenden
const serverTimestamp = new Date(conflictData.serverTimestamp)
const localTimestamp = new Date(operation.timestamp)

// Server-Zeit ist maßgeblich
console.log('Conflict resolved:', serverTimestamp > localTimestamp 
  ? 'Server wins (later timestamp)' 
  : 'Server still wins (version-based)')
```

---

## 9. Tests

### 9.1 Konflikt-Szenarien

```typescript
// src/tests/conflictResolution.test.ts

describe('Conflict Resolution', () => {
  it('should apply server state on version conflict', async () => {
    // Setup: Lokal geänderte Liste (version: 3)
    const localList = await createList({ name: 'Lokal', version: 3 })
    
    // Setup: Server hat neuere Version (version: 5)
    const serverState = { id: localList.id, name: 'Server', version: 5 }
    
    // Simuliere 409 Conflict
    vi.spyOn(api, 'post').mockRejectedValue({
      response: {
        status: 409,
        data: {
          status: 'conflict',
          currentState: serverState,
          serverVersion: 5,
          conflictReason: 'version_mismatch'
        }
      }
    })
    
    // Verarbeite Konflikt
    await syncService.handleConflict(conflictData, operation)
    
    // Prüfe: Lokale Daten = Server-Daten
    const updated = await db.shoppingLists.get(localList.id)
    expect(updated.name).toBe('Server')
    expect(updated.version).toBe(5)
  })

  it('should delete local item if server state is deleted', async () => {
    const conflictData = {
      status: 'conflict',
      conflictReason: 'deleted'
    }
    
    await syncService.handleConflict(conflictData, operation)
    
    const item = await db.shoppingLists.get(operation.entityId)
    expect(item).toBeUndefined()
  })
})
```

### 9.2 Backend-Tests

```java
// src/test/java/SyncServiceTest.java

@Test
void update_withVersionMismatch_shouldReturnConflict() {
    // Server-Version = 5
    ShoppingList serverList = createList("Test", 5);
    
    // Client-Version = 3
    SyncOperation clientOp = SyncOperation.builder()
        .entityId(serverList.getId().toString())
        .localVersion(3)
        .build();
    
    // Process
    SyncResult result = syncService.processUpdate(clientOp);
    
    // Assert
    assertEquals(SyncStatus.CONFLICT, result.getStatus());
    assertEquals(5, result.getServerVersion());
    assertEquals(serverList, result.getCurrentState());
}
```

---

## 10. Definition of Done

- [ ] Konflikt-Erkennung bei Version-Mismatch
- [ ] Server-State wird bei Konflikt angewendet
- [ ] Benutzer wird informiert (Snackbar)
- [ ] Gelöschte Items werden lokal auch gelöscht
- [ ] Sync-Status zeigt Fehler bei Konflikten
- [ ] Unit-Tests für Konfliktlogik
- [ ] Integration-Tests

---

## 11. Nächste Story

**US-19:** P2P-Synchronisation - Dezentrale Sync-Option über BitChat/WebRTC.
