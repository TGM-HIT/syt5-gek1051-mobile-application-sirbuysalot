# Tech-Doc: US-13 - Automatische Synchronisation bei Reconnect

**Story:** #22 - Auto-Sync bei Wiederherstellung der Verbindung  
**Story Points:** 8  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-12 (Offline-Speicherung)  
**Folgt auf:** US-14 (Konfliktbehandlung)

---

## 1. Überblick

Diese Story automatisiert die Synchronisation lokaler Änderungen mit dem Server, sobald die Internetverbindung wiederhergestellt wird. Der Benutzer muss keine Aktionen manuell ausführen - die App erkennt automatisch die Verbindung und pusht alle ausstehenden Änderungen.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Auto-Erkennung | navigator.onLine erkennt Wiederherstellung |
| 2 | Batch-Request | Alle pending-Änderungen werden zusammen gesendet |
| 3 | Server-Abgleich | Server-Änderungen werden abgerufen |
| 4 | UI-Status | Sync-Status wird angezeigt |
| 5 | Last-Write-Wins | Zeitstempel-Vergleich als Basis |
| 6 | HTTP 409 | Konflikte werden erkannt (→ US-14) |
| 7 | Alle CRUD | Funktioniert für alle Operationstypen |

---

## 3. Architektur

### 3.1 Sync-Ablauf

```
┌──────────────────────────────────────────────────────────────────┐
│                    OFFLINE → ONLINE                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. Online-Event erkannt                                         │
│     window.addEventListener('online', handleOnline)             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. UI: Sync-Status "Syncing..." anzeigen                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Batch-Request vorbereiten                                   │
│     Alle Operationen mit synced: false aus Queue holen        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. POST /api/sync mit Batch                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌─────────────┐     ┌─────────────┐
            │   Erfolg    │     │   Fehler    │
            │   200 OK    │     │   4xx/5xx   │
            └─────────────┘     └─────────────┘
                    │                   │
                    ▼                   ▼
            ┌─────────────┐     ┌─────────────┐
            │ Queue leer   │     │ Retry later │
            │ synced: true │     │ oder skip    │
            └─────────────┘     └─────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. UI: Sync-Status "Synced" / "Fehler"                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. UI-Indikatoren

### 4.1 Sync-Status-Zustände

| Status | Icon | Farbe | Beschreibung |
|--------|------|-------|--------------|
| `synced` | `mdi-cloud-check` | success | Alle Änderungen synchronisiert |
| `syncing` | `mdi-cloud-sync` | primary | Synchronisation läuft |
| `pending` | `mdi-cloud-upload` | warning | X Änderungen warten |
| `error` | `mdi-cloud-alert` | error | Sync fehlgeschlagen |

### 4.2 Implementierung

```vue
<!-- App.vue -->

<v-chip
  :color="syncStatusColor"
  variant="tonal"
  size="small"
>
  <v-icon start :icon="syncStatusIcon" />
  {{ syncStatusText }}
</v-chip>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { syncService } from '@/services/syncService'

const syncStatus = ref<'synced' | 'syncing' | 'pending' | 'error'>('synced')
const pendingCount = ref(0)

const syncStatusColor = computed(() => {
  switch (syncStatus.value) {
    case 'synced': return 'success'
    case 'syncing': return 'primary'
    case 'pending': return 'warning'
    case 'error': return 'error'
  }
})

const syncStatusIcon = computed(() => {
  switch (syncStatus.value) {
    case 'synced': return 'mdi-cloud-check'
    case 'syncing': return 'mdi-cloud-sync'
    case 'pending': return 'mdi-cloud-upload'
    case 'error': return 'mdi-cloud-alert'
  }
})

const syncStatusText = computed(() => {
  switch (syncStatus.value) {
    case 'synced': return 'Synchronisiert'
    case 'syncing': return 'Synchronisiere...'
    case 'pending': return `${pendingCount.value} ausstehend`
    case 'error': return 'Sync fehlgeschlagen'
  }
})
</script>
```

---

## 5. Batch-Sync API

### 5.1 Request

```typescript
// POST /api/sync
interface SyncBatchRequest {
  operations: SyncOperation[]
}

interface SyncOperation {
  id: string                    // Lokale UUID
  type: 'create' | 'update' | 'delete'
  entity: 'list' | 'product'
  entityId: string
  payload: any
  timestamp: string             // ISO 8601
  localVersion?: number         // Lokale Version für Prüfung
}
```

### 5.2 Response

```typescript
interface SyncBatchResponse {
  results: SyncResult[]
  serverChanges: ServerChange[]
}

interface SyncResult {
  localId: string
  serverId?: string            // Neue Server-ID bei create
  status: 'success' | 'conflict' | 'error'
  version?: number
  error?: string
}

interface ServerChange {
  entity: 'list' | 'product'
  entityId: string
  data: any
  version: number
}
```

---

## 6. Implementierung

### 6.1 Frontend - useOnlineStatus Composable

```typescript
// src/composables/useOnlineStatus.ts

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { syncService } from '@/services/syncService'

const isOnline = ref(navigator.onLine)
const pendingCount = ref(0)
const syncStatus = ref<'synced' | 'syncing' | 'pending' | 'error'>('synced')

let updateInterval: ReturnType<typeof setInterval> | null = null

function handleOnline() {
  isOnline.value = true
  triggerSync()
}

function handleOffline() {
  isOnline.value = false
}

export function useOnlineStatus() {
  async function updatePendingCount() {
    pendingCount.value = await syncService.getPendingCount()
    syncStatus.value = pendingCount.value > 0 ? 'pending' : 'synced'
  }

  async function triggerSync() {
    if (!isOnline.value) return
    
    syncStatus.value = 'syncing'
    
    try {
      await syncService.processQueue()
      await updatePendingCount()
      syncStatus.value = 'synced'
    } catch (error) {
      console.error('Sync failed:', error)
      syncStatus.value = 'error'
    }
  }

  // Auto-Sync bei Online-Gehen
  watch(isOnline, async (online) => {
    if (online) {
      await triggerSync()
    }
  })

  // Periodische Prüfung (alle 30 Sekunden)
  onMounted(() => {
    updateInterval = setInterval(async () => {
      if (isOnline.value) {
        await updatePendingCount()
        if (pendingCount.value > 0) {
          await triggerSync()
        }
      }
    }, 30000)
  })

  onUnmounted(() => {
    if (updateInterval) clearInterval(updateInterval)
  })

  return {
    isOnline,
    pendingCount,
    syncStatus,
    updatePendingCount,
    triggerSync,
  }
}
```

### 6.2 Frontend - syncService Erweiterung

```typescript
// src/services/syncService.ts

export const syncService = {
  async processQueue() {
    if (!navigator.onLine) return

    const operations = await this.getPendingOperations()
    if (operations.length === 0) return

    try {
      // Batch-Request an Server
      const response = await api.post('/sync', {
        operations: operations.map(op => ({
          id: op.id,
          type: op.type,
          entity: op.entity,
          entityId: op.entityId,
          payload: op.payload,
          timestamp: op.timestamp,
        }))
      })

      // Ergebnisse verarbeiten
      for (const result of response.data.results) {
        if (result.status === 'success') {
          // Als synced markieren
          await this.markAsSynced(result.localId)
          
          // Bei Create: Server-ID updaten
          if (result.serverId) {
            await this.updateEntityId(result.localId, result.serverId)
          }
        } else if (result.status === 'conflict') {
          // Konflikt -> an Konflikt-Handler (US-14)
          await handleConflict(result)
        }
      }

      // Server-Änderungen abrufen
      await this.fetchServerChanges(response.data.serverChanges)

    } catch (error) {
      console.error('Batch sync failed:', error)
      throw error
    }
  },

  async getPendingOperations(): Promise<SyncOperation[]> {
    const allOps = await db.syncQueue.toArray()
    return allOps.filter(op => !op.synced)
  },

  async markAsSynced(localId: string) {
    await db.syncQueue
      .where('entityId')
      .equals(localId)
      .modify({ synced: true })
  },
}
```

### 6.3 Backend - SyncController

```java
// src/main/java/at/tgm/sirbuysalot/controller/SyncController.java

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<SyncBatchResponse> syncBatch(@RequestBody SyncBatchRequest request) {
        SyncBatchResponse response = syncService.processBatch(request);
        return ResponseEntity.ok(response);
    }
}
```

### 6.4 Backend - SyncService

```java
// src/main/java/at/tgm/sirbuysalot/service/SyncService.java

@Service
@RequiredArgsConstructor
public class SyncService {

    private final ListRepository listRepository;
    private final ProductRepository productRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public SyncBatchResponse processBatch(SyncBatchRequest request) {
        List<SyncResult> results = new ArrayList<>();
        List<ServerChange> serverChanges = new ArrayList<>();

        for (SyncOperation op : request.getOperations()) {
            try {
                SyncResult result = processOperation(op);
                results.add(result);
                
                // Bei Erfolg: Server-Änderungen sammeln
                if (result.getStatus() == SyncStatus.SUCCESS) {
                    serverChanges.addAll(getServerChanges(op.getEntity(), op.getEntityId()));
                }
            } catch (ConflictException e) {
                results.add(SyncResult.conflict(op.getEntityId(), e.getCurrentState()));
            } catch (Exception e) {
                results.add(SyncResult.error(op.getEntityId(), e.getMessage()));
            }
        }

        return new SyncBatchResponse(results, serverChanges);
    }

    private SyncResult processOperation(SyncOperation op) {
        return switch (op.getType()) {
            case CREATE -> processCreate(op);
            case UPDATE -> processUpdate(op);
            case DELETE -> processDelete(op);
        };
    }

    private SyncResult processCreate(SyncOperation op) {
        if (op.getEntity() == Entity.LIST) {
            ShoppingList list = listRepository.save(ShoppingList.builder()
                .name(op.getPayload().get("name"))
                .accessCode(generateAccessCode())
                .version(1)
                .build());
            
            return SyncResult.success(op.getEntityId(), list.getId(), list.getVersion());
        }
        // ... product handling
    }

    private SyncResult processUpdate(SyncOperation op) {
        if (op.getEntity() == Entity.LIST) {
            ShoppingList current = listRepository.findById(UUID.fromString(op.getEntityId()))
                .orElseThrow(() -> new NotFoundException());
            
            // Version-Prüfung
            if (!current.getVersion().equals(op.getLocalVersion())) {
                throw new ConflictException(current);
            }
            
            current.setVersion(current.getVersion() + 1);
            ShoppingList updated = listRepository.save(current);
            
            // WebSocket-Broadcast
            messagingTemplate.convertAndSend("/topic/lists/" + updated.getId(), updated);
            
            return SyncResult.success(op.getEntityId(), updated.getVersion());
        }
        // ... product handling
    }
}
```

---

## 7. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|----------|-----------|--------------|
| POST | `/api/sync` | `SyncBatchRequest` | `SyncBatchResponse` | Batch-Sync |
| GET | `/api/lists/{id}/changes?since={timestamp}` | - | `ServerChange[]` | Server-Änderungen abrufen |

---

## 8. Definition of Done

- [ ] Automatische Erkennung der Verbindungswiederherstellung
- [ ] Batch-Sync aller ausstehenden Änderungen
- [ ] Sync-Status in der UI angezeigt
- [ ] Versionsprüfung serverseitig implementiert
- [ ] Echtzeit-Verteilung via WebSocket
- [ ] Unit-Tests (Vitest) vorhanden
- [ ] Unit-Tests (JUnit 5) vorhanden

---

## 9. Nächste Story

**US-14:** Konfliktbehandlung - Behandelt Version-Konflikte bei gleichzeitigen Änderungen.
