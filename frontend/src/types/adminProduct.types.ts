export type ProductStatus = 'draft' | 'active' | 'inactive' | 'banned'

export interface AdminPageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}

export interface AdminProductResponse {
    productId: number
    productName: string
    thumbnailUrl?: string
    productStatus: ProductStatus

    shopId?: number
    shopName?: string

    categoryId?: number
    categoryName?: string

    brandId?: number
    brandName?: string

    minPrice?: number
    originalPrice?: number
    discountPercent?: number

    soldCount?: number
    averageRating?: number

    totalStock?: number
    variantCount?: number
    imageCount?: number

    createdAt?: string
    updatedAt?: string
}

export interface AdminProductDetailResponse extends AdminProductResponse {
    description?: string
    shopSlug?: string
    variants: AdminProductVariant[]
    images: AdminProductImage[]
}

export interface AdminProductVariant {
    variantId: number
    variantName: string
    sku?: string
    price: number
    originalPrice?: number
    discountPercent?: number
    stockQuantity: number
    weight?: number
    length?: number
    width?: number
    height?: number
    imageUrl?: string
    createdAt?: string
}

export interface AdminProductImage {
    imageId: number
    imageUrl: string
    isThumbnail?: boolean
    createdAt?: string
}

export interface AdminProductQuery {
    keyword?: string
    status?: ProductStatus
    shopId?: number
    categoryId?: number
    brandId?: number
    page?: number
    size?: number
    sortBy?: string
    direction?: 'asc' | 'desc'
}

export interface AdminProductUpdateRequest {
    productName?: string
    description?: string
    thumbnailUrl?: string
    categoryId?: number
    brandId?: number
    productStatus?: ProductStatus
}

export interface AdminProductStatusRequest {
    productStatus: ProductStatus
    reason?: string
}