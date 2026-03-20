import { ref, onMounted, onUnmounted } from 'vue'
import { productService } from '@/services/productService'
import { syncService } from '@/services/syncService'
import { db, type Product as DbProduct } from '@/db'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

function generateUUID(): string {
  return crypto.randomUUID()
}

export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      if (navigator.onLine) {
        const serverProducts = await productService.getAll(listId)
        products.value = serverProducts
        await db.products.where('listId').equals(listId).delete()
        for (const product of serverProducts) {
          await db.products.put({
            id: product.id,
            listId,
            name: product.name,
            price: product.price ?? undefined,
            purchased: product.purchased,
            purchasedBy: product.purchasedBy ?? undefined,
            purchasedAt: product.purchasedAt ?? undefined,
            position: product.position ?? 0,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            version: product.version,
            synced: true,
          })
        }
      } else {
        const localProducts = await db.products.where('listId').equals(listId).toArray()
        products.value = localProducts.map((p) => ({
          id: p.id!,
          listId: p.listId,
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
      }
    } catch (e: any) {
      const localProducts = await db.products.where('listId').equals(listId).toArray()
      if (localProducts.length > 0) {
        products.value = localProducts.map((p) => ({
          id: p.id!,
          listId: p.listId,
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
      } else {
        error.value = e.message ?? 'Fehler beim Laden der Produkte'
      }
    } finally {
      loading.value = false
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    const now = new Date().toISOString()
    const tempId = generateUUID()

    const localProduct: DbProduct = {
      id: tempId,
      listId,
      name: payload.name,
      price: payload.price ?? undefined,
      purchased: false,
      position: products.value.length,
      createdAt: now,
      updatedAt: now,
      version: 0,
      synced: false,
    }

    await db.products.add(localProduct)
    const newProduct: Product = {
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
      version: 0,
      tags: [],
    }
    products.value.push(newProduct)

    if (navigator.onLine) {
      try {
        const created = await productService.create(listId, payload)
        await db.products.update(tempId, {
          id: created.id,
          version: created.version,
          synced: true,
        })
        const idx = products.value.findIndex((p) => p.id === tempId)
        if (idx !== -1) products.value[idx] = { ...products.value[idx], id: created.id, version: created.version }
        return created
      } catch {
        await syncService.addToQueue('create', 'product', tempId, { ...payload, listId })
      }
    } else {
      await syncService.addToQueue('create', 'product', tempId, { ...payload, listId })
    }

    return products.value.find((p) => p.id === tempId)
  }

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const now = new Date().toISOString()
    const idx = products.value.findIndex((p) => p.id === productId)
    
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...payload, updatedAt: now }
    }

    await db.products.update(productId, {
      name: payload.name,
      price: payload.price ?? undefined,
      position: payload.position ?? 0,
      synced: false,
    })

    if (navigator.onLine) {
      try {
        const updated = await productService.update(listId, productId, payload)
        await db.products.update(productId, { version: updated.version, synced: true })
        const idx2 = products.value.findIndex((p) => p.id === productId)
        if (idx2 !== -1) products.value[idx2] = { ...products.value[idx2], version: updated.version }
        return updated
      } catch {
        await syncService.addToQueue('update', 'product', productId, { ...payload, listId })
      }
    } else {
      await syncService.addToQueue('update', 'product', productId, { ...payload, listId })
    }

    return products.value.find((p) => p.id === productId)
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    const product = products.value.find((p) => p.id === productId)
    if (!product) return

    const now = new Date().toISOString()
    const newPurchased = !product.purchased
    const newPurchasedAt = newPurchased ? now : null

    const idx = products.value.findIndex((p) => p.id === productId)
    if (idx !== -1) {
      products.value[idx] = {
        ...products.value[idx],
        purchased: newPurchased,
        purchasedBy: newPurchased ? purchasedBy : null,
        purchasedAt: newPurchasedAt,
        updatedAt: now,
      }
    }

    await db.products.update(productId, {
      purchased: newPurchased,
      purchasedBy: newPurchased ? purchasedBy : undefined,
      purchasedAt: newPurchasedAt ?? undefined,
      synced: false,
    })

    if (navigator.onLine) {
      try {
        const updated = await productService.togglePurchase(listId, productId, purchasedBy)
        await db.products.update(productId, { version: updated.version, synced: true })
        const idx2 = products.value.findIndex((p) => p.id === productId)
        if (idx2 !== -1) products.value[idx2] = { ...products.value[idx2], version: updated.version }
        return updated
      } catch {
        await syncService.addToQueue('update', 'product', productId, { purchased: newPurchased, purchasedBy, listId })
      }
    } else {
      await syncService.addToQueue('update', 'product', productId, { purchased: newPurchased, purchasedBy, listId })
    }

    return products.value.find((p) => p.id === productId)
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
    await db.products.delete(productId)
    products.value = products.value.filter((p) => p.id !== productId)

    if (navigator.onLine) {
      try {
        await productService.remove(listId, productId)
      } catch {
        await syncService.addToQueue('delete', 'product', productId, { listId })
      }
    } else {
      await syncService.addToQueue('delete', 'product', productId, { listId })
    }
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
