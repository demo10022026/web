export interface ProductSummary {
  productId: number
  productName: string
  thumbnailUrl: string
  price: number
  originalPrice?: number
  discountPercent: number
  soldCount: number
  averageRating: number
  shopName: string
  shopId: number
  categoryName?: string
}

export interface VariantDto {
  variantId: number
  variantName: string
  sku: string
  price: number
  originalPrice?: number
  discountPercent: number
  stockQuantity: number
  imageUrl?: string
}

export interface ProductDetail {
  productId: number
  productName: string
  description: string
  thumbnailUrl: string
  images: string[]
  variants: VariantDto[]
  soldCount: number
  averageRating: number
  shop: {
    shopId: number
    shopName: string
    shopSlug: string
    avatarUrl?: string
    rating: number
    followerCount: number
  }
  categoryName?: string
  brandName?: string
  createdAt: string
}

export interface FlashSaleProduct {
  productId: number
  productName: string
  thumbnailUrl: string
  salePrice: number
  originalPrice: number
  discountPercent: number
  quantityLimit: number
  quantitySold: number
  remainingPercent: number
  endTime: string
}

export interface CategoryDto {
  categoryId: number
  categoryName: string
  children: CategoryDto[]
}

export interface HomeData {
  flashSale: FlashSaleProduct[]
  newProducts: ProductSummary[]
  bestSellers: ProductSummary[]
  categories: CategoryDto[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
