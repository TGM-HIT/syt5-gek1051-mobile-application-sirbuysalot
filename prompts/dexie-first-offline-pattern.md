# Prompt: Dexie.js First - Offline Data Strategy

## When
Mid March 2026, during US-12 offline storage implementation

## Context
We had to decide: should our composables fetch from the REST API and save to IndexedDB as a cache, or should IndexedDB be the primary source and the API be secondary? The Dexie-first approach was chosen.

## Prompt (paraphrased)
"We're building an offline-first PWA with Vue 3 and Dexie.js for IndexedDB. Our composables currently fetch from the API. How do we change them so that IndexedDB is the primary data source and API calls are only for syncing? Should we use Dexie-live queries?"

## Ergebnis
Dexie-First Pattern in Composable:
```typescript
export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const loading = ref(false)
  
  // Load from Dexie immediately
  async function init() {
    loading.value = true
    // First: show cached data
    const cached = await db.products.where('listId').equals(listId).toArray()
    products.value = cached.filter(p => !p.deletedAt)
    
    // Then: fetch fresh from API and update Dexie
    try {
      const fresh = await productService.getAll(listId)
      products.value = fresh.filter(p => !p.deletedAt)
      await syncToDexie(fresh) // updates local cache
    } catch {
      // API failed, but we still have cached data
    } finally {
      loading.value = false
    }
  }
  
  // Mutations go to API, update Dexie optimistically
  async function addProduct(data: CreateProductDto) {
    const apiProduct = await productService.create(listId, data)
    await db.products.add({ ...apiProduct, synced: true })
    products.value.push(apiProduct)
    return apiProduct
  }
  
  return { products, loading, init, addProduct, ... }
}
```

Pending Changes Queue fuer Offline-Mutationen:
```typescript
async function addPendingChange(change: Omit<PendingChange, 'id'>) {
  await db.pendingChanges.add({ ...change, timestamp: new Date().toISOString() })
}

async function syncPendingChanges() {
  const pending = await db.pendingChanges.toArray()
  if (pending.length === 0) return
  
  await syncService.sync(listId, pending)
  await db.pendingChanges.clear()
}
```

## Was wir daraus mitgenommen haben
Dexie-First bedeutet: UI zeigt sofort was in IndexedDB ist, API-Call laeuft im Hintergrund und updated Dexie. Das macht die App instantaneous - kein Warten auf Netzwerk fuer die erste Anzeige.

Die pendingChanges-Tabelle ist der Schlüssel: Alle Offline-Mutationen werden dorthin geschrieben, und wenn `online`-Event feuert, werden sie in einem Batch an den Server geschickt.

Wichtig: Das `synced` Flag auf jedem Entity zeigt ob es mit dem Server uebereinstimmt. Das ist nuetzlich fuer die Sync-Status-UI.

## Key Takeaways
- Dexie-first: zuerst lokale Daten laden, dann API im Hintergrund
- pendingChanges Tabelle fuer alle Offline-Mutationen
- Batch-Sync Endpoint verarbeitet alle pending changes auf einmal
- `synced` Flag auf jedem Entity fuer Sync-Status-Tracking
- Optimistic UI updates: lokale Aenderung sofort anzeigen, API im Hintergrund
