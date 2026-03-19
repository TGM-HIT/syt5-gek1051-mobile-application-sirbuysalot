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
        </div>

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

        <!-- Search -->
        <v-text-field
          v-if="products.length > 0"
          v-model="searchQuery"
          placeholder="Produkte durchsuchen..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mb-5"
        />

        <!-- Tag Filter -->
        <v-card v-if="availableTags.length > 0" class="mb-5 pa-4" border>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 font-weight-medium">Nach Tags filtern</span>
            <div class="d-flex align-center">
              <span v-if="hasActiveFilter" class="text-body-2 text-medium-emphasis mr-2">
                {{ filteredProductCount }} von {{ totalProductCount }} Produkten
              </span>
              <v-btn
                v-if="hasActiveFilter"
                variant="text"
                size="small"
                color="primary"
                @click="resetFilter"
              >
                Alle anzeigen
              </v-btn>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="tag in availableTags"
              :key="tag.id"
              :color="isTagSelected(tag.id) ? 'primary' : 'default'"
              :variant="isTagSelected(tag.id) ? 'flat' : 'outlined'"
              label
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </v-chip>
          </div>
        </v-card>

        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-5" />

        <v-alert v-if="error" type="error" variant="tonal" class="mb-5" closable rounded="xl">
          {{ error }}
        </v-alert>

        <!-- Product list -->
        <transition-group name="product" tag="div">
          <v-card
            v-for="product in filteredProducts"
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
            </div>
          </v-card>
        </transition-group>

        <!-- Empty state - no products -->
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

        <!-- Empty state - no filter results -->
        <v-card v-if="!loading && products.length > 0 && filteredProducts.length === 0" class="pa-8 text-center" border>
          <v-icon icon="mdi-filter-off-outline" size="80" color="grey-lighten-1" class="mb-4" />
          <div class="text-h6 text-medium-emphasis mb-2">Keine Produkte gefunden</div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            Keine Produkte entsprechen dem aktuellen Filter.
          </div>
          <v-btn color="primary" variant="outlined" @click="resetFilter">
            Filter zuruecksetzen
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import { useTagFilter } from '@/composables/useTagFilter'
import { useUser } from '@/composables/useUser'
import { listService } from '@/services/listService'
import type { Product } from '@/types'

const route = useRoute()
const listId = route.params.id as string
const { displayName } = useUser()
const showSnackbar = inject<(text: string, color?: string, icon?: string) => void>('showSnackbar')!

const { products, loading, error, fetchProducts, addProduct, togglePurchase } = useProducts(listId)

const searchQuery = ref('')

const {
  availableTags,
  filteredProducts,
  isTagSelected,
  toggleTag,
  resetFilter,
  hasActiveFilter,
  totalProductCount,
  filteredProductCount,
} = useTagFilter(products, searchQuery)

const listName = ref('...')
const showAdd = ref(false)
const newProductName = ref('')
const newProductPrice = ref<number | undefined>(undefined)
const adding = ref(false)

const activeProducts = computed(() => products.value.filter((p) => !p.purchased))
const purchasedCount = computed(() => products.value.filter((p) => p.purchased).length)
const progressPercent = computed(() => {
  if (products.value.length === 0) return 0
  return Math.round((purchasedCount.value / products.value.length) * 100)
})

onMounted(async () => {
  try {
    const list = await listService.getById(listId)
    listName.value = list.name
  } catch {
    listName.value = 'Unbekannte Liste'
  }
  fetchProducts()
})

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
