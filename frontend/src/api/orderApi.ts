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

export const orderApi = {
    getMyOrders: async (
        params: GetMyOrdersParams = {}
    ): Promise<UserOrder[]> => {
        const res = await axiosInstance.get<ApiResponse<UserOrder[]>>(
            '/orders/my',
            {
                params: Object.fromEntries(
                    Object.entries(params).filter(([, value]) => {
                        return value !== undefined && value !== null && value !== ''
                    })
                ),
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
}