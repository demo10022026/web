import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
}

export type SellerOrderStatus =
    | 'pending'
    | 'processing'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'returned'

export interface SellerOrderItem {
    orderItemId: number

    productId: number
    productName: string
    thumbnailUrl?: string | null

    variantId?: number | null
    variantName?: string | null
    sku?: string | null

    quantity: number
    price: number
    lineTotal: number
}

export interface SellerOrder {
    orderId: number
    orderCode: string
    orderStatus: SellerOrderStatus

    customerId?: number | null
    customerName?: string | null
    customerEmail?: string | null
    customerPhone?: string | null

    shopId?: number | null
    shopName?: string | null

    receiverName: string
    receiverPhone: string
    provinceName: string
    districtName: string
    wardName: string
    shippingAddress: string
    fullShippingAddress: string

    ghnOrderCode?: string | null
    trackingCode?: string | null

    orderTotalAmount: number
    shippingFee: number
    shopSubtotalAmount: number

    createdAt?: string | null

    items: SellerOrderItem[]
}

export interface SellerOrderListParams {
    status?: string
    keyword?: string
    page?: number
    size?: number
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const sellerOrderApi = {
    getMyShopOrders: async (
        params: SellerOrderListParams = {}
    ): Promise<PageResponse<SellerOrder>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<SellerOrder>>
        >('/seller/orders', {
            params: cleanParams(params),
        })

        return res.data.data!
    },

    getMyShopOrderDetail: async (
        orderId: number
    ): Promise<SellerOrder> => {
        const res = await axiosInstance.get<ApiResponse<SellerOrder>>(
            `/seller/orders/${orderId}`
        )

        return res.data.data!
    },

    updateOrderStatus: async (
        orderId: number,
        orderStatus: SellerOrderStatus
    ): Promise<SellerOrder> => {
        const res = await axiosInstance.patch<ApiResponse<SellerOrder>>(
            `/seller/orders/${orderId}/status`,
            {
                orderStatus,
            }
        )

        return res.data.data!
    },
}