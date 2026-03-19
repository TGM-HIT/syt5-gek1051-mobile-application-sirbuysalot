import { ref, computed, type Ref } from 'vue'
import type { Product, Tag } from '@/types'

export function useTagFilter(products: Ref<Product[]>) {
  const selectedTagIds = ref<Set<string>>(new Set())

  const availableTags = computed<Tag[]>(() => {
    const tagMap = new Map<string, Tag>()
    for (const product of products.value) {
      if (product.tags) {
        for (const tag of product.tags) {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, tag)
          }
        }
      }
    }
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  })

  const filteredProducts = computed<Product[]>(() => {
    if (selectedTagIds.value.size === 0) {
      return products.value
    }
    return products.value.filter((product) => {
      if (!product.tags || product.tags.length === 0) {
        return false
      }
      return product.tags.some((tag) => selectedTagIds.value.has(tag.id))
    })
  })

  const isTagSelected = (tagId: string): boolean => {
    return selectedTagIds.value.has(tagId)
  }

  const toggleTag = (tagId: string): void => {
    const newSet = new Set(selectedTagIds.value)
    if (newSet.has(tagId)) {
      newSet.delete(tagId)
    } else {
      newSet.add(tagId)
    }
    selectedTagIds.value = newSet
  }

  const resetFilter = (): void => {
    selectedTagIds.value = new Set()
  }

  const hasActiveFilter = computed<boolean>(() => {
    return selectedTagIds.value.size > 0
  })

  const totalProductCount = computed<number>(() => {
    return products.value.length
  })

  const filteredProductCount = computed<number>(() => {
    return filteredProducts.value.length
  })

  return {
    selectedTagIds,
    availableTags,
    filteredProducts,
    isTagSelected,
    toggleTag,
    resetFilter,
    hasActiveFilter,
    totalProductCount,
    filteredProductCount,
  }
}
