export interface CartItem {
    cartItemId: number

    productId: number
    productName: string
    thumbnailUrl?: string
    productStatus: string

    variantId: number
    variantName?: string
    sku?: string
    variantImageUrl?: string

    price: number
    originalPrice?: number
    discountPercent?: number

    quantity: number
    stockQuantity: number

    itemTotal: number
}

export interface CartShopGroup {
    shopId: number
    shopName: string
    shopSlug?: string

    items: CartItem[]

    totalQuantity: number
    subtotal: number
}

export interface CartResponse {
    cartId: number
    totalItems: number
    totalQuantity: number
    totalAmount: number
    shops: CartShopGroup[]
}

export interface AddToCartRequest {
    variantId: number
    quantity: number
}

export interface UpdateCartItemRequest {
    quantity: number
}