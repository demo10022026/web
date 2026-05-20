import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface SellerAnalyticsSummary {
    revenue: number
    grossRevenue: number
    pendingRevenue: number
    cancelledRevenue: number
    returnedRevenue: number

    orderCount: number
    deliveredOrderCount: number
    pendingOrderCount: number
    cancelledOrderCount: number
    returnedOrderCount: number

    soldQuantity: number
    averageOrderValue: number

    completionRate: number
    cancellationRate: number
    returnRate: number
}

export interface SellerDailyRevenue {
    date: string
    revenue: number
    orderCount: number
    soldQuantity: number
}

export interface SellerStatusStat {
    status: string
    label: string
    orderCount: number
    revenue: number
}

export interface SellerTopProduct {
    productId: number
    productName: string
    thumbnailUrl?: string | null
    quantitySold: number
    orderCount: number
    revenue: number
}

export interface SellerRecentOrder {
    orderId: number
    orderCode: string
    orderStatus: string
    customerName?: string | null
    receiverName?: string | null
    receiverPhone?: string | null
    fullShippingAddress?: string | null
    shopSubtotalAmount: number
    createdAt?: string | null
}

export interface SellerAnalytics {
    fromDate: string
    toDate: string
    summary: SellerAnalyticsSummary
    dailyRevenue: SellerDailyRevenue[]
    statusStats: SellerStatusStat[]
    topProducts: SellerTopProduct[]
    recentOrders: SellerRecentOrder[]
}

export interface SellerAnalyticsParams {
    fromDate?: string
    toDate?: string
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const sellerAnalyticsApi = {
    getMyShopAnalytics: async (
        params: SellerAnalyticsParams = {}
    ): Promise<SellerAnalytics> => {
        const res = await axiosInstance.get<ApiResponse<SellerAnalytics>>(
            '/seller/analytics',
            {
                params: cleanParams(params),
            }
        )

        return res.data.data!
    },
}
