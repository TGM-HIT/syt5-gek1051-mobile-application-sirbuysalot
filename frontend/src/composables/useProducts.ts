import { ref } from 'vue'
import { productService } from '@/services/productService'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const deletedProducts = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      products.value = await productService.getAll(listId)
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der Produkte'
    } finally {
      loading.value = false
    }
  }

  async function fetchDeletedProducts() {
    try {
      deletedProducts.value = await productService.getDeleted(listId)
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der geloeschten Produkte'
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    const created = await productService.create(listId, payload)
    products.value.push(created)
    return created
  }

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const updated = await productService.update(listId, productId, payload)
    const idx = products.value.findIndex((p) => p.id === productId)
    if (idx !== -1) products.value[idx] = updated
    return updated
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    error.value = null
    try {
      const updated = await productService.togglePurchase(listId, productId, purchasedBy)
      const idx = products.value.findIndex((p) => p.id === productId)
      if (idx !== -1) products.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Umschalten des Kaufstatus'
      throw e
    }
  }

  async function removeProduct(productId: string) {
    await productService.remove(listId, productId)
    products.value = products.value.filter((p) => p.id !== productId)
  }

  async function restoreProduct(productId: string) {
    const restored = await productService.restore(listId, productId)
    products.value.push(restored)
    deletedProducts.value = deletedProducts.value.filter((p) => p.id !== productId)
    return restored
  }

  return {
    products,
    deletedProducts,
    loading,
    error,
    fetchProducts,
    fetchDeletedProducts,
    addProduct,
    updateProduct,
    togglePurchase,
    removeProduct,
    restoreProduct,
  }
}
