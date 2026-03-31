import { ref } from 'vue'
import { productService } from '@/services/productService'
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types'

export function useProducts(listId: string) {
  const products = ref<Product[]>([])
  const deletedProducts = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const listGone = ref(false)

  async function fetchProducts() {
    if (products.value.length === 0) {
      loading.value = true
    }
    error.value = null
    try {
      products.value = await productService.getAll(listId)
    } catch (e: any) {
      if (e.response?.status === 404) {
        listGone.value = true
      }
      error.value = e.message ?? 'Fehler beim Laden der Produkte'
    } finally {
      loading.value = false
    }
  }

  async function fetchDeletedProducts() {
    try {
      deletedProducts.value = await productService.getDeleted(listId)
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Laden der gelöschten Produkte'
    }
  }

  async function addProduct(payload: CreateProductPayload) {
    const created = await productService.create(listId, payload)
    await fetchProducts()
    return created
  }

  async function updateProduct(productId: string, payload: UpdateProductPayload) {
    const updated = await productService.update(listId, productId, payload)
    await fetchProducts()
    return updated
  }

  async function togglePurchase(productId: string, purchasedBy: string) {
    error.value = null
    try {
      const updated = await productService.togglePurchase(listId, productId, purchasedBy)
      await fetchProducts()
      return updated
    } catch (e: any) {
      error.value = e.message ?? 'Fehler beim Umschalten des Kaufstatus'
      throw e
    }
  }

  async function removeProduct(productId: string) {
    await productService.remove(listId, productId)
    await fetchProducts()
  }

  async function restoreProduct(productId: string) {
    const restored = await productService.restore(listId, productId)
    await fetchProducts()
    deletedProducts.value = deletedProducts.value.filter((p) => p.id !== productId)
    return restored
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
  }
}
