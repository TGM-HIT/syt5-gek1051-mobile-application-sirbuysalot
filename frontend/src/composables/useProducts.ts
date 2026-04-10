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
    // Keep unsynced local products, replace everything else
    const unsynced = await db.products
      .where('listId').equals(listId)
      .filter((p) => !p.synced)
      .toArray()
    const unsyncedIds = new Set(unsynced.map((p) => p.id))

    await db.products
      .where('listId').equals(listId)
      .filter((p) => p.synced)
      .delete()

    const dbProducts = items
      .filter((p) => !unsyncedIds.has(p.id))
      .map((p) => ({
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
  }

  async function loadFromCache(): Promise<Product[]> {
    const cached = await db.products.where('listId').equals(listId).toArray()
    return cached.filter((p) => !p.deletedAt).map(toProduct)
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
      if (e.response?.status === 404) {
        listGone.value = true
        return
      }
      if (!navigator.onLine) {
        const cached = await loadFromCache()
        if (cached.length > 0 || products.value.length === 0) {
          products.value = cached
        }
      } else {
        error.value = e.message ?? 'Fehler beim Laden der Produkte'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchDeletedProducts() {
    try {
      deletedProducts.value = await productService.getDeleted(listId)
    } catch {
      // silent when offline
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    if (navigator.onLine) {
      try {
        const created = await productService.create(listId, payload)
        await fetchProducts()
        return created
      } catch {
        if (navigator.onLine) throw new Error('Fehler beim Hinzufügen')
      }
    }

    // Offline: create locally with temp ID
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

    products.value.push(localProduct)

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

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const idx = products.value.findIndex((p) => p.id === productId)
    const original = idx !== -1 ? { ...products.value[idx] } : null

    // Optimistic update
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...payload }
    }

    if (navigator.onLine) {
      try {
        const updated = await productService.update(listId, productId, payload)
        await fetchProducts()
        return updated
      } catch (e: any) {
        if (navigator.onLine) {
          if (original && idx !== -1) products.value[idx] = original
          throw e
        }
      }
    }

    // Offline: queue for sync
    await db.products.update(productId, {
      ...payload,
      synced: false,
      updatedAt: new Date().toISOString(),
    })

    await syncService.addPendingChange({
      type: 'update',
      entity: 'product',
      entityId: productId,
      listId,
      payload,
      timestamp: new Date().toISOString(),
    })

    return products.value[idx]
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    error.value = null
    const idx = products.value.findIndex((p) => p.id === productId)
    const original = idx !== -1 ? { ...products.value[idx] } : null

    // Optimistic toggle
    if (idx !== -1) {
      const p = products.value[idx]
      const newPurchased = !p.purchased
      products.value[idx] = {
        ...p,
        purchased: newPurchased,
        purchasedBy: newPurchased ? purchasedBy : null,
        purchasedAt: newPurchased ? new Date().toISOString() : null,
      }
    }

    if (navigator.onLine) {
      try {
        const updated = await productService.togglePurchase(listId, productId, purchasedBy)
        await fetchProducts()
        return updated
      } catch (e: any) {
        if (navigator.onLine) {
          if (original && idx !== -1) products.value[idx] = original
          error.value = e.message ?? 'Fehler beim Umschalten des Kaufstatus'
          throw e
        }
      }
    }

    // Offline: queue for sync
    const product = products.value[idx]
    await db.products.update(productId, {
      purchased: product.purchased,
      purchasedBy: product.purchasedBy ?? undefined,
      purchasedAt: product.purchasedAt ?? undefined,
      synced: false,
    })

    await syncService.addPendingChange({
      type: 'toggle',
      entity: 'product',
      entityId: productId,
      listId,
      payload: { purchasedBy },
      timestamp: new Date().toISOString(),
    })

    return product
  }

  async function removeProduct(productId: string) {
    const removed = products.value.find((p) => p.id === productId)
    products.value = products.value.filter((p) => p.id !== productId)

    if (navigator.onLine) {
      try {
        await productService.remove(listId, productId)
        return
      } catch {
        if (navigator.onLine) {
          if (removed) products.value.push(removed)
          throw new Error('Fehler beim Ausblenden')
        }
      }
    }

    // Offline: queue for sync
    await db.products.update(productId, {
      deletedAt: new Date().toISOString(),
      synced: false,
    })

    await syncService.addPendingChange({
      type: 'delete',
      entity: 'product',
      entityId: productId,
      listId,
      payload: {},
      timestamp: new Date().toISOString(),
    })
  }

  async function restoreProduct(productId: string) {
    const restored = await productService.restore(listId, productId)
    await fetchProducts()
    deletedProducts.value = deletedProducts.value.filter((p) => p.id !== productId)
    return restored
  }

  async function syncPending() {
    if (!navigator.onLine) return null
    try {
      const result = await syncService.syncPendingChanges(listId)
      if (result && (result.synced > 0 || result.failed > 0)) {
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
    restoreProduct,
    syncPending,
  }
}
