<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <!-- Header -->
        <div class="d-flex align-center mb-6">
          <v-btn
            icon="mdi-arrow-left"
            variant="tonal"
            size="small"
            to="/"
            class="mr-3"
          />
          <div class="flex-grow-1">
            <h1 class="text-h4 font-weight-bold">{{ listName }}</h1>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ activeProducts.length }} Produkte
              <span v-if="purchasedCount > 0" class="ml-1">
                · {{ purchasedCount }} erledigt
              </span>
            </div>
          </div>
          <v-btn
            icon="mdi-share-variant"
            variant="tonal"
            size="small"
            color="primary"
            @click="showShareDialog = true"
          />
        </div>

        <!-- Share dialog -->
        <v-dialog v-model="showShareDialog" max-width="440">
          <v-card class="pa-4">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon icon="mdi-share-variant" color="primary" class="mr-2" />
              Liste teilen
            </v-card-title>
            <v-card-text>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Teile diesen Link, damit andere der Liste beitreten koennen:
              </p>
              <v-text-field
                :model-value="shareUrl"
                readonly
                prepend-inner-icon="mdi-link"
                hide-details
                @click="copyShareUrl"
              >
                <template #append-inner>
                  <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyShareUrl" />
                </template>
              </v-text-field>
              <div class="text-caption text-medium-emphasis mt-2">
                Zugangscode: <strong>{{ accessCode }}</strong>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="showShareDialog = false">Schliessen</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Progress -->
        <v-card v-if="products.length > 0" class="mb-5 pa-4" border>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-2 font-weight-medium">Fortschritt</span>
            <span class="text-body-2 font-weight-bold text-primary">
              {{ progressPercent }}%
            </span>
          </div>
          <v-progress-linear
            :model-value="progressPercent"
            color="success"
            bg-color="grey-lighten-3"
            rounded
            height="8"
          />
        </v-card>

        <!-- Search bar -->
        <v-text-field
          v-model="searchQuery"
          label="Produkte durchsuchen..."
          prepend-inner-icon="mdi-magnify"
          clearable
          density="compact"
          hide-details
          class="mb-3"
        />

        <!-- Tag filter chips -->
        <div v-if="allTags.length > 0" class="d-flex flex-wrap ga-2 mb-4">
          <v-chip
            v-for="tag in allTags"
            :key="tag.id"
            :color="selectedTags.includes(tag.id) ? 'secondary' : 'default'"
            :variant="selectedTags.includes(tag.id) ? 'flat' : 'outlined'"
            label
            size="small"
            @click="toggleTagFilter(tag.id)"
          >
            {{ tag.name }}
          </v-chip>
          <v-chip
            v-if="selectedTags.length > 0"
            variant="text"
            size="small"
            @click="selectedTags = []"
          >
            Alle
          </v-chip>
          <v-spacer />
          <v-btn
            variant="text"
            size="x-small"
            color="secondary"
            prepend-icon="mdi-tag-multiple"
            @click="showTagManagement = true"
          >
            Tags
          </v-btn>
        </div>

        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-5" />

        <v-alert v-if="error" type="error" variant="tonal" class="mb-5" closable rounded="xl">
          {{ error }}
        </v-alert>

        <!-- Product list -->
        <transition-group name="product" tag="div">
          <v-card
            v-for="product in sortedProducts"
            :key="product.id"
            class="mb-3 product-card"
            :class="{ 'product-purchased': product.purchased }"
            border
            @click="onTogglePurchase(product)"
          >
            <div class="d-flex align-center pa-4">
              <v-checkbox-btn
                :model-value="product.purchased"
                :color="product.purchased ? 'success' : 'primary'"
                class="mr-3 flex-shrink-0"
              />

              <div class="flex-grow-1 min-width-0">
                <div
                  class="text-subtitle-1 font-weight-medium"
                  :class="{ 'text-decoration-line-through text-medium-emphasis': product.purchased }"
                >
                  {{ product.name }}
                </div>

                <!-- Tags -->
                <div v-if="product.tags && product.tags.length > 0" class="mt-1 d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="tag in product.tags"
                    :key="tag.id"
                    size="x-small"
                    variant="tonal"
                    color="secondary"
                    label
                  >
                    {{ tag.name }}
                  </v-chip>
                </div>

                <!-- Purchased info -->
                <div
                  v-if="product.purchased && product.purchasedBy"
                  class="text-caption text-medium-emphasis mt-1 d-flex align-center"
                >
                  <v-icon icon="mdi-check-circle" size="12" color="success" class="mr-1" />
                  {{ product.purchasedBy }} · {{ formatTime(product.purchasedAt) }}
                </div>
              </div>

              <!-- Price badge -->
              <v-chip
                v-if="product.price != null"
                :color="product.purchased ? 'success' : 'primary'"
                variant="tonal"
                size="small"
                class="ml-2 flex-shrink-0 font-weight-bold"
              >
                {{ formatPrice(product.price) }}
              </v-chip>

              <!-- Edit button -->
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="x-small"
                color="grey"
                class="ml-1"
                @click.stop="openEditDialog(product)"
              />

              <!-- Delete button -->
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                color="error"
                class="ml-1"
                @click.stop="confirmDelete(product)"
              />
            </div>
          </v-card>
        </transition-group>

        <!-- Deleted products toggle -->
        <div class="d-flex align-center mb-3 mt-4">
          <v-switch
            v-model="showDeleted"
            label="Ausgeblendete anzeigen"
            color="warning"
            density="compact"
            hide-details
            @update:model-value="onToggleDeleted"
          />
        </div>

        <!-- Deleted products -->
        <template v-if="showDeleted">
          <v-card
            v-for="product in deletedProducts"
            :key="'del-' + product.id"
            class="mb-3"
            border
            variant="outlined"
            color="warning"
          >
            <div class="d-flex align-center pa-4">
              <v-icon icon="mdi-delete-clock" color="warning" class="mr-3" />
              <div class="flex-grow-1">
                <div class="text-subtitle-1 text-decoration-line-through text-medium-emphasis">
                  {{ product.name }}
                </div>
              </div>
              <v-btn
                variant="tonal"
                color="success"
                size="small"
                prepend-icon="mdi-restore"
                @click="onRestoreProduct(product)"
              >
                Wiederherstellen
              </v-btn>
            </div>
          </v-card>
          <div v-if="deletedProducts.length === 0" class="text-body-2 text-medium-emphasis text-center mb-4">
            Keine ausgeblendeten Produkte
          </div>
        </template>

        <!-- Empty state -->
        <v-card v-if="!loading && products.length === 0" class="pa-8 text-center" border>
          <v-icon icon="mdi-cart-outline" size="80" color="grey-lighten-1" class="mb-4" />
          <div class="text-h6 text-medium-emphasis mb-2">Liste ist leer</div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            Fuege das erste Produkt hinzu!
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="showAdd = true">
            Produkt hinzufuegen
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- FAB -->
    <v-btn
      v-if="products.length > 0"
      color="primary"
      icon="mdi-plus"
      size="large"
      position="fixed"
      location="bottom end"
      class="ma-6 fab-btn"
      elevation="8"
      @click="showAdd = true"
    />

    <!-- Add product dialog -->
    <v-dialog v-model="showAdd" max-width="440">
      <v-card class="pa-2">
        <v-card-title class="text-h5 font-weight-bold pt-4 px-6">
          <v-icon icon="mdi-package-variant-plus" color="primary" class="mr-2" />
          Neues Produkt
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="newProductName"
            label="Was brauchst du?"
            placeholder="z.B. Milch, Brot, Eier..."
            prepend-inner-icon="mdi-food-apple"
            autofocus
            hide-details="auto"
            class="mb-4"
            :rules="[v => !!v.trim() || 'Name darf nicht leer sein']"
            @keyup.enter="onAddProduct"
          />
          <v-text-field
            v-model.number="newProductPrice"
            label="Preis (optional)"
            prepend-inner-icon="mdi-currency-eur"
            type="number"
            step="0.01"
            min="0"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showAdd = false">Abbrechen</v-btn>
          <v-btn
            color="primary"
            :disabled="!newProductName.trim()"
            :loading="adding"
            prepend-icon="mdi-check"
            @click="onAddProduct"
          >
            Hinzufuegen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit product dialog -->
    <ProductEditDialog
      v-model="showEdit"
      :product="editProduct"
      :saving="editSaving"
      @save="onSaveEdit"
    />

    <!-- Delete confirmation -->
    <v-dialog v-model="showDeleteConfirm" max-width="360">
      <v-card class="pa-4">
        <v-card-title class="text-h6">Produkt ausblenden?</v-card-title>
        <v-card-text>
          "{{ deleteTarget?.name }}" wird ausgeblendet. Du kannst es spaeter wiederherstellen.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Abbrechen</v-btn>
          <v-btn color="error" @click="onDeleteProduct">Ausblenden</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tag management dialog -->
    <TagManagementDialog
      v-model="showTagManagement"
      :tags="allTags"
      @create="onCreateTag"
      @delete="onDeleteTag"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import { useUser } from '@/composables/useUser'
import { listService } from '@/services/listService'
import ProductEditDialog from '@/components/ProductEditDialog.vue'
import TagManagementDialog from '@/components/TagManagementDialog.vue'
import { useTags } from '@/composables/useTags'
import type { Product } from '@/types'

const route = useRoute()
const listId = route.params.id as string
const { displayName } = useUser()
const showSnackbar = inject<(text: string, color?: string, icon?: string) => void>('showSnackbar')!

const { products, deletedProducts, loading, error, fetchProducts, fetchDeletedProducts, addProduct, updateProduct, togglePurchase, removeProduct, restoreProduct } = useProducts(listId)
const { tags: allTags, fetchTags, createTag, removeTag: deleteTag } = useTags(listId)

const listName = ref('...')
const accessCode = ref('')
const showShareDialog = ref(false)
const showAdd = ref(false)
const newProductName = ref('')
const newProductPrice = ref<number | undefined>(undefined)
const adding = ref(false)

const showEdit = ref(false)
const editProduct = ref<Product | null>(null)
const editSaving = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<Product | null>(null)
const showDeleted = ref(false)
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const showTagManagement = ref(false)

const activeProducts = computed(() => products.value.filter((p) => !p.purchased))
const purchasedCount = computed(() => products.value.filter((p) => p.purchased).length)
const progressPercent = computed(() => {
  if (products.value.length === 0) return 0
  return Math.round((purchasedCount.value / products.value.length) * 100)
})

const filteredProducts = computed(() => {
  let result = products.value

  // Text search
  const query = (searchQuery.value ?? '').toLowerCase().trim()
  if (query) {
    result = result.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query)
      const tagMatch = p.tags?.some((t) => t.name.toLowerCase().includes(query))
      return nameMatch || tagMatch
    })
  }

  // Tag filter
  if (selectedTags.value.length > 0) {
    result = result.filter((p) =>
      p.tags?.some((t) => selectedTags.value.includes(t.id))
    )
  }

  return result
})

const sortedProducts = computed(() => {
  return [...filteredProducts.value].sort((a, b) => {
    if (a.purchased && !b.purchased) return 1
    if (!a.purchased && b.purchased) return -1
    return 0
  })
})

const shareUrl = computed(() => {
  return `${window.location.origin}/join/${accessCode.value}`
})

onMounted(async () => {
  try {
    const list = await listService.getById(listId)
    listName.value = list.name
    accessCode.value = list.accessCode ?? ''
  } catch {
    listName.value = 'Unbekannte Liste'
  }
  fetchProducts()
  fetchTags()
})

function toggleTagFilter(tagId: string) {
  const idx = selectedTags.value.indexOf(tagId)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

async function onCreateTag(name: string) {
  await createTag(name)
}

async function onDeleteTag(tagId: string) {
  await deleteTag(tagId)
  await fetchProducts() // refresh products to remove deleted tag references
}

function copyShareUrl() {
  navigator.clipboard.writeText(shareUrl.value)
  showSnackbar('Link kopiert!', 'info', 'mdi-content-copy')
}

async function onAddProduct() {
  const name = newProductName.value.trim()
  if (!name) return
  adding.value = true
  try {
    await addProduct({
      name,
      price: newProductPrice.value ?? null,
    })
    showAdd.value = false
    showSnackbar(`"${name}" hinzugefuegt!`)
    newProductName.value = ''
    newProductPrice.value = undefined
  } catch {
    error.value = 'Fehler beim Hinzufuegen'
  } finally {
    adding.value = false
  }
}

async function onTogglePurchase(product: Product) {
  try {
    await togglePurchase(product.id, displayName())
  } catch {
    error.value = 'Fehler beim Markieren'
  }
}

function openEditDialog(product: Product) {
  editProduct.value = product
  showEdit.value = true
}

async function onSaveEdit(payload: { name: string; price: number | null }) {
  if (!editProduct.value) return
  editSaving.value = true
  try {
    await updateProduct(editProduct.value.id, payload)
    showEdit.value = false
    showSnackbar('Produkt aktualisiert')
  } catch {
    error.value = 'Fehler beim Speichern'
  } finally {
    editSaving.value = false
  }
}

function onToggleDeleted(val: boolean) {
  if (val) fetchDeletedProducts()
}

async function onRestoreProduct(product: Product) {
  try {
    await restoreProduct(product.id)
    showSnackbar(`"${product.name}" wiederhergestellt`)
  } catch {
    error.value = 'Fehler beim Wiederherstellen'
  }
}

function confirmDelete(product: Product) {
  deleteTarget.value = product
  showDeleteConfirm.value = true
}

async function onDeleteProduct() {
  if (!deleteTarget.value) return
  try {
    await removeProduct(deleteTarget.value.id)
    showDeleteConfirm.value = false
    showSnackbar(`"${deleteTarget.value.name}" ausgeblendet`)
  } catch {
    error.value = 'Fehler beim Ausblenden'
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(price)
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.product-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.product-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06) !important;
}
.product-purchased {
  opacity: 0.7;
}

.min-width-0 {
  min-width: 0;
}

.fab-btn {
  transition: transform 0.2s ease;
}
.fab-btn:hover {
  transform: scale(1.1);
}

.product-enter-active,
.product-leave-active {
  transition: all 0.3s ease;
}
.product-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.product-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
