export interface ShoppingList {
  id: string
  name: string
  accessCode: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  version: number
  products: Product[]
  users: AppUser[]
}

export interface Product {
  id: string
  name: string
  price: number | null
  purchased: boolean
  purchasedBy: string | null
  purchasedAt: string | null
  position: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  version: number
  tags: Tag[]
}

export interface Tag {
  id: string
  name: string
}

export interface AppUser {
  id: string
  displayName: string
}

export interface CreateListPayload {
  name: string
  id?: string
}

export interface CreateProductPayload {
  name: string
  price?: number | null
}

export interface UpdateProductPayload {
  name: string
  price?: number | null
  position?: number | null
}
