import { ref } from 'vue'
import { productService } from '@/services/productService'
import { syncService } from '@/services/syncService'
import { db } from '@/db'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const deletedProducts = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const listGone = ref(false)

  function toProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name,
      price: p.price ?? null,
      purchased: p.purchased ?? false,
      purchasedBy: p.purchasedBy ?? null,
      purchasedAt: p.purchasedAt ?? null,
      position: p.position ?? 0,
      createdAt: p.createdAt ?? '',
      updatedAt: p.updatedAt ?? '',
      deletedAt: p.deletedAt ?? null,
      version: p.version ?? 1,
      tags: p.tags ?? [],
    }
  }

  async function cacheProducts(items: Product[]) {
    try {
      await db.products.where('listId').equals(listId).delete()
      const dbProducts = items.map((p) => ({
        id: p.id,
        listId,
        name: p.name,
        price: p.price ?? undefined,
        purchased: p.purchased,
        purchasedBy: p.purchasedBy ?? undefined,
        purchasedAt: p.purchasedAt ?? undefined,
        position: p.position ?? 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt ?? undefined,
        version: p.version,
        synced: true,
      }))
      if (dbProducts.length > 0) {
        await db.products.bulkPut(dbProducts)
      }
    } catch {
      // IndexedDB error - non-critical
    }
  }

  async function loadFromCache(): Promise<Product[]> {
    try {
      const cached = await db.products.where('listId').equals(listId).toArray()
      return cached.filter((p) => !p.deletedAt).map(toProduct)
    } catch {
      return []
    }
  }

  async function fetchProducts() {
    if (products.value.length === 0) {
      loading.value = true
    }
    error.value = null
    try {
      const fetched = await productService.getAll(listId)
      products.value = fetched
      await cacheProducts(fetched)
    } catch (e: any) {
      // Only set listGone on confirmed 404 from server
      if (e.response?.status === 404) {
        listGone.value = true
        return
      }
      // Any other error (network, timeout, etc): load from cache
      const cached = await loadFromCache()
      if (cached.length > 0 || products.value.length === 0) {
        products.value = cached
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchDeletedProducts() {
    try {
      deletedProducts.value = await productService.getDeleted(listId)
    } catch {
      // silent - not critical
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const localProduct: Product = {
      id: tempId,
      name: payload.name,
      price: payload.price ?? null,
      purchased: false,
      purchasedBy: null,
      purchasedAt: null,
      position: products.value.length,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      tags: [],
    }

    // 1. Always update UI immediately
    products.value.push(localProduct)

    // 2. Always save to IndexedDB
    await db.products.put({
      id: tempId,
      listId,
      name: payload.name,
      price: payload.price ?? undefined,
      purchased: false,
      position: products.value.length - 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
      synced: false,
    })

    // 3. Try to sync to server
    try {
      const created = await productService.create(listId, payload)
      // Replace temp product with server version
      const idx = products.value.findIndex((p) => p.id === tempId)
      if (idx !== -1) products.value[idx] = created
      await db.products.delete(tempId)
      await db.products.put({
        id: created.id,
        listId,
        name: created.name,
        price: created.price ?? undefined,
        purchased: created.purchased,
        position: created.position ?? 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        version: created.version,
        synced: true,
      })
      return created
    } catch {
      // Server unreachable: queue for batch sync
      await syncService.addPendingChange({
        type: 'create',
        entity: 'product',
        entityId: tempId,
        listId,
        payload: { name: payload.name, price: payload.price ?? null },
        timestamp: now,
      })
      return localProduct
    }
  }

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const idx = products.value.findIndex((p) => p.id === productId)

    // 1. Always update UI immediately
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...payload }
    }

    // 2. Always save to IndexedDB
    await db.products.update(productId, {
      ...payload,
      synced: false,
      updatedAt: new Date().toISOString(),
    })

    // 3. Try to sync to server
    try {
      await productService.update(listId, productId, payload)
      await db.products.update(productId, { synced: true })
    } catch (e: any) {
      if (e.response?.status === 409) {
        // Conflict: server wins - refetch
        await fetchProducts()
        return products.value.find((p) => p.id === productId) ?? null
      }
      // Queue for batch sync
      await syncService.addPendingChange({
        type: 'update',
        entity: 'product',
        entityId: productId,
        listId,
        payload,
        timestamp: new Date().toISOString(),
      })
    }

    return products.value[idx] ?? null
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    error.value = null
    const idx = products.value.findIndex((p) => p.id === productId)
    if (idx === -1) return

    const p = products.value[idx]
    const newPurchased = !p.purchased

    // 1. Always update UI immediately
    products.value[idx] = {
      ...p,
      purchased: newPurchased,
      purchasedBy: newPurchased ? purchasedBy : null,
      purchasedAt: newPurchased ? new Date().toISOString() : null,
    }

    // 2. Always save to IndexedDB
    await db.products.update(productId, {
      purchased: newPurchased,
      purchasedBy: newPurchased ? purchasedBy : undefined,
      purchasedAt: newPurchased ? new Date().toISOString() : undefined,
      synced: false,
    })

    // 3. Try to sync to server
    try {
      await productService.togglePurchase(listId, productId, purchasedBy)
      await db.products.update(productId, { synced: true })
    } catch (e: any) {
      if (e.response?.status === 409) {
        // Conflict: server wins - refetch
        await fetchProducts()
        return
      }
      // Queue for batch sync — send desired state, not a relative toggle
      await syncService.addPendingChange({
        type: 'toggle',
        entity: 'product',
        entityId: productId,
        listId,
        payload: { purchased: newPurchased, purchasedBy: newPurchased ? purchasedBy : null },
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function removeProduct(productId: string) {
    // 1. Always update UI immediately
    products.value = products.value.filter((p) => p.id !== productId)

    // 2. Always save to IndexedDB
    await db.products.update(productId, {
      deletedAt: new Date().toISOString(),
      synced: false,
    })

    // 3. Try to sync to server
    try {
      await productService.remove(listId, productId)
      await db.products.update(productId, { synced: true })
    } catch {
      // Queue for batch sync
      await syncService.addPendingChange({
        type: 'delete',
        entity: 'product',
        entityId: productId,
        listId,
        payload: {},
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function reorderProducts(order: { id: string; position: number }[]) {
    // 1. Always update UI immediately
    for (const item of order) {
      const p = products.value.find((p) => p.id === item.id)
      if (p) p.position = item.position
    }

    // 2. Always save to IndexedDB
    for (const item of order) {
      try {
        await db.products.update(item.id, { position: item.position, synced: false })
      } catch {
        // non-critical
      }
    }

    // 3. Try to sync to server
    try {
      await productService.reorder(listId, order)
      for (const item of order) {
        try {
          await db.products.update(item.id, { synced: true })
        } catch {
          // non-critical
        }
      }
    } catch {
      // Queue for batch sync
      await syncService.addPendingChange({
        type: 'reorder',
        entity: 'product',
        entityId: `reorder-${listId}`,
        listId,
        payload: { order },
        timestamp: new Date().toISOString(),
      })
    }
  }

  async function restoreProduct(productId: string) {
    const restored = await productService.restore(listId, productId)
    await fetchProducts()
    deletedProducts.value = deletedProducts.value.filter((p) => p.id !== productId)
    return restored
  }

  async function syncPending() {
    try {
      const result = await syncService.syncPendingChanges(listId)
      if (result && (result.synced > 0 || result.failed > 0)) {
        // After sync, get authoritative state from server
        await fetchProducts()
      }
      return result
    } catch {
      return null
    }
  }

  return {
    products,
    deletedProducts,
    loading,
    error,
    listGone,
    fetchProducts,
    fetchDeletedProducts,
    addProduct,
    updateProduct,
    togglePurchase,
    removeProduct,
    reorderProducts,
    restoreProduct,
    syncPending,
  }
}
