import Dexie, { type Table } from 'dexie'

export interface ShoppingList {
  id?: string
  name: string
  accessCode?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  version: number
  synced: boolean
}

export interface Product {
  id?: string
  listId: string
  name: string
  price?: number
  purchased: boolean
  purchasedBy?: string
  purchasedAt?: string
  position: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  version: number
  synced: boolean
}

export interface Tag {
  id?: string
  name: string
  listId: string
}

export interface ProductTag {
  productId: string
  tagId: string
}

export interface PendingChange {
  id?: number
  type: 'create' | 'update' | 'delete' | 'toggle' | 'reorder'
  entity: 'product' | 'list'
  entityId?: string
  listId: string
  payload: any
  timestamp: string
}

class SirBuysALotDB extends Dexie {
  shoppingLists!: Table<ShoppingList>
  products!: Table<Product>
  tags!: Table<Tag>
  productTags!: Table<ProductTag>
  pendingChanges!: Table<PendingChange>

  constructor() {
    super('sirbuysalot')
    this.version(1).stores({
      shoppingLists: 'id, name, accessCode, synced',
      products: 'id, listId, name, purchased, synced',
      tags: 'id, name, listId',
      productTags: '[productId+tagId], productId, tagId',
    })
    this.version(2).stores({
      shoppingLists: 'id, name, accessCode, synced',
      products: 'id, listId, name, purchased, synced',
      tags: 'id, name, listId',
      productTags: '[productId+tagId], productId, tagId',
      pendingChanges: '++id, type, entity, listId, timestamp',
    })
  }
}

export const db = new SirBuysALotDB()
