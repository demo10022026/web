import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface CheckoutRequest {
    cartItemIds: number[]
    addressId?: number | null
    voucherId?: number | null
    paymentMethod?: 'cod'
}

export interface CheckoutSummaryItem {
    cartItemId: number
    productId: number
    productName: string
    thumbnailUrl?: string | null

    variantId: number
    variantName?: string | null
    sku?: string | null
    variantImageUrl?: string | null

    quantity: number
    stockQuantity: number
    price: number
    originalPrice?: number | null
    lineTotal: number
}

export interface CheckoutShopGroup {
    shopId: number
    shopName: string
    shopSlug?: string | null
    shopSubtotal: number
    items: CheckoutSummaryItem[]
}

export interface CheckoutAppliedVoucher {
    voucherId: number
    code: string
    voucherName: string
    discountType: 'fixed' | 'percent'
    discountValue: number
    discountAmount: number
    scope: 'platform' | 'shop'
    shopId?: number | null
    shopName?: string | null
}

export interface CheckoutSummaryResponse {
    shops: CheckoutShopGroup[]
    totalItems: number
    totalQuantity: number
    subtotalAmount: number
    shippingFee: number
    discountAmount: number
    totalAmount: number
    appliedVoucher?: CheckoutAppliedVoucher | null
}

export interface CheckoutPlaceOrderResponse {
    orderId: number
    orderCode: string
    totalAmount: number
    orderStatus: string
}

export const checkoutApi = {
    getSummary: async (
        payload: CheckoutRequest
    ): Promise<CheckoutSummaryResponse> => {
        const res = await axiosInstance.post<ApiResponse<CheckoutSummaryResponse>>(
            '/checkout/summary',
            payload
        )

        return res.data.data!
    },

    placeOrder: async (
        payload: CheckoutRequest
    ): Promise<CheckoutPlaceOrderResponse> => {
        const res = await axiosInstance.post<
            ApiResponse<CheckoutPlaceOrderResponse>
        >('/checkout/place-order', payload)

        return res.data.data!
    },
}
