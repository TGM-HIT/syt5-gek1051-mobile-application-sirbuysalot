import { ref, onMounted, onUnmounted } from 'vue'
import { productService } from '@/services/productService'
import { db } from '@/db'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

function toDbProduct(p: Product, listId: string, synced: boolean) {
  return {
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
    synced,
  }
}

export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const fetched = await productService.getAll(listId)
      products.value = fetched
      for (const p of fetched) {
        await db.products.put(toDbProduct(p, listId, true))
      }
    } catch {
      // Offline: load from Dexie cache
      const cached = await db.products
        .where('listId')
        .equals(listId)
        .filter((p) => !p.deletedAt)
        .toArray()
      products.value = cached.map((p) => ({
        id: p.id!,
        name: p.name,
        price: p.price ?? null,
        purchased: p.purchased,
        purchasedBy: p.purchasedBy ?? null,
        purchasedAt: p.purchasedAt ?? null,
        position: p.position ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt ?? null,
        version: p.version,
        tags: [],
      }))
      if (cached.length === 0) {
        error.value = 'Offline – keine gecachten Daten verfügbar'
      }
    } finally {
      loading.value = false
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    const created = await productService.create(listId, payload)
    products.value.push(created)
    await db.products.put(toDbProduct(created, listId, true))
    return created
  }

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const updated = await productService.update(listId, productId, payload)
    const idx = products.value.findIndex((p) => p.id === productId)
    if (idx !== -1) products.value[idx] = updated
    await db.products.put(toDbProduct(updated, listId, true))
    return updated
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    const idx = products.value.findIndex((p) => p.id === productId)
    if (idx === -1) return

    const current = products.value[idx]
    const newPurchased = !current.purchased
    const newPurchasedAt = newPurchased ? new Date().toISOString() : null

    // Optimistic update
    products.value[idx] = {
      ...current,
      purchased: newPurchased,
      purchasedBy: newPurchased ? purchasedBy : null,
      purchasedAt: newPurchasedAt,
    }

    // Persist locally with synced: false
    await db.products.put({
      ...toDbProduct(current, listId, false),
      purchased: newPurchased,
      purchasedBy: newPurchased ? purchasedBy : undefined,
      purchasedAt: newPurchasedAt ?? undefined,
    })

    try {
      const updated = await productService.togglePurchase(listId, productId, purchasedBy)
      products.value[idx] = updated
      await db.products.update(productId, {
        purchased: updated.purchased,
        purchasedBy: updated.purchasedBy ?? undefined,
        purchasedAt: updated.purchasedAt ?? undefined,
        version: updated.version,
        synced: true,
      })
      return updated
    } catch {
      // Offline: keep optimistic state, synced: false stays in Dexie
    }
  }

  async function syncPending() {
    const pending = await db.products
      .where('listId')
      .equals(listId)
      .filter((p) => !p.synced)
      .toArray()

    if (pending.length === 0) return

    try {
      const serverProducts = await productService.getAll(listId)
      for (const local of pending) {
        const server = serverProducts.find((s) => s.id === local.id)
        if (!server) continue

        if (server.purchased !== local.purchased) {
          const updated = await productService.togglePurchase(
            listId,
            local.id!,
            local.purchasedBy ?? '',
          )
          await db.products.update(local.id!, {
            purchased: updated.purchased,
            purchasedBy: updated.purchasedBy ?? undefined,
            purchasedAt: updated.purchasedAt ?? undefined,
            version: updated.version,
            synced: true,
          })
          const idx = products.value.findIndex((p) => p.id === local.id)
          if (idx !== -1) products.value[idx] = updated
        } else {
          await db.products.update(local.id!, { synced: true })
        }
      }
    } catch {
      // Still offline, try again later
    }
  }

  async function removeProduct(productId: string) {
    await productService.remove(listId, productId)
    products.value = products.value.filter((p) => p.id !== productId)
    await db.products.update(productId, { deletedAt: new Date().toISOString() })
  }

  function handleOnline() {
    syncPending()
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
  })

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    togglePurchase,
    removeProduct,
    syncPending,
  }
}
