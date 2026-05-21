import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'returned'

export interface UserOrderItem {
    orderItemId: number

    productId: number
    productName: string
    thumbnailUrl?: string | null

    variantId: number
    variantName?: string | null
    sku?: string | null

    quantity: number
    price: number
    originalPrice?: number | null

    reviewed?: boolean
    reviewId?: number | null
}

export interface UserOrder {
    orderId: number
    orderCode: string

    orderStatus: OrderStatus

    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null

    subtotalAmount: number
    shippingFee: number
    totalAmount: number

    receiverName: string
    receiverPhone: string
    provinceName: string
    districtName: string
    wardName: string
    shippingAddress: string

    ghnOrderCode?: string | null
    trackingCode?: string | null

    createdAt?: string | null

    items: UserOrderItem[]
}

export interface GetMyOrdersParams {
    status?: string
    keyword?: string
}

export interface CreateReviewRequest {
    rating: number
    reviewContent?: string | null
}

export interface UserReview {
    reviewId: number
    orderItemId: number
    productId: number
    productName: string
    rating: number
    reviewContent?: string | null
    createdAt?: string | null
}

export interface BuyAgainSkippedItem {
    productId?: number | null
    productName?: string | null
    variantId?: number | null
    variantName?: string | null
    reason: string
}

export interface BuyAgainResponse {
    cartItemIds: number[]
    skippedItems: BuyAgainSkippedItem[]
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const orderApi = {
    getMyOrders: async (
        params: GetMyOrdersParams = {}
    ): Promise<UserOrder[]> => {
        const res = await axiosInstance.get<ApiResponse<UserOrder[]>>(
            '/orders/my',
            {
                params: cleanParams(params),
            }
        )

        return res.data.data ?? []
    },

    cancelOrder: async (orderId: number): Promise<UserOrder> => {
        const res = await axiosInstance.put<ApiResponse<UserOrder>>(
            `/orders/${orderId}/cancel`
        )

        return res.data.data!
    },

    createReview: async ({
        orderItemId,
        data,
    }: {
        orderItemId: number
        data: CreateReviewRequest
    }): Promise<UserReview> => {
        const res = await axiosInstance.post<ApiResponse<UserReview>>(
            `/orders/items/${orderItemId}/review`,
            data
        )

        return res.data.data!
    },

    buyAgain: async (orderId: number): Promise<BuyAgainResponse> => {
        const res = await axiosInstance.post<ApiResponse<BuyAgainResponse>>(
            `/orders/${orderId}/buy-again`
        )

        return res.data.data!
    },
}
