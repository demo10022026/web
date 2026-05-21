import axiosInstance from '../axiosInstance'
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

export type AdminOrderStatus =
    | 'pending'
    | 'processing'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'returned'

export interface AdminOrderStats {
    totalOrders: number
    pendingOrders: number
    processingOrders: number
    shippingOrders: number
    deliveredOrders: number
    cancelledOrders: number
    returnedOrders: number
}

export interface AdminOrderPayment {
    paymentId: number
    paymentMethod?: string | null
    paymentStatus?: string | null
    transactionCode?: string | null
    paidAt?: string | null
    createdAt?: string | null
}

export interface AdminOrderItem {
    orderItemId: number

    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null

    productId?: number | null
    productName?: string | null
    thumbnailUrl?: string | null

    variantId?: number | null
    variantName?: string | null
    sku?: string | null

    quantity: number
    price: number
    lineTotal: number
}

export interface AdminOrderShopGroup {
    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null
    shopSubtotal: number
    items: AdminOrderItem[]
}

export interface AdminOrder {
    orderId: number
    orderCode: string
    orderStatus: AdminOrderStatus

    customerId?: number | null
    customerName?: string | null
    customerEmail?: string | null
    customerPhone?: string | null

    receiverName: string
    receiverPhone: string
    provinceName: string
    districtName: string
    wardName: string
    shippingAddress: string
    fullShippingAddress: string

    shippingProviderId?: number | null
    shippingProviderName?: string | null
    ghnOrderCode?: string | null
    trackingCode?: string | null

    subtotalAmount: number
    shippingFee: number
    totalAmount: number

    payment?: AdminOrderPayment | null
    createdAt?: string | null

    shops: AdminOrderShopGroup[]
    items: AdminOrderItem[]
}

export interface AdminOrderListParams {
    status?: string
    keyword?: string
    page?: number
    size?: number
}

export interface AdminUpdateOrderStatusPayload {
    orderStatus: AdminOrderStatus
    trackingCode?: string | null
    ghnOrderCode?: string | null
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const adminOrderApi = {
    getOrders: async (
        params: AdminOrderListParams = {}
    ): Promise<PageResponse<AdminOrder>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<AdminOrder>>>(
            '/admin/orders',
            {
                params: cleanParams({
                    ...params,
                    status: params.status === 'all' ? undefined : params.status,
                }),
            }
        )

        return res.data.data!
    },

    getStats: async (): Promise<AdminOrderStats> => {
        const res = await axiosInstance.get<ApiResponse<AdminOrderStats>>(
            '/admin/orders/stats'
        )

        return res.data.data!
    },

    getOrderDetail: async (orderId: number): Promise<AdminOrder> => {
        const res = await axiosInstance.get<ApiResponse<AdminOrder>>(
            `/admin/orders/${orderId}`
        )

        return res.data.data!
    },

    updateOrderStatus: async (
        orderId: number,
        payload: AdminUpdateOrderStatusPayload
    ): Promise<AdminOrder> => {
        const res = await axiosInstance.patch<ApiResponse<AdminOrder>>(
            `/admin/orders/${orderId}/status`,
            payload
        )

        return res.data.data!
    },
}
