import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type { ShopInfo } from '@/api/sellerShopApi'

export interface SellerDashboardStats {
    totalProducts: number
    activeProducts: number
    draftProducts: number
    inactiveProducts: number
    bannedProducts: number

    totalSold: number
    lowStockVariants: number

    pendingOrders: number

    todayRevenue: number
    totalRevenue: number

    averageRating: number
}

export interface SellerDashboardTasks {
    newOrders: number
    lowStockProducts: number

    needAvatar: boolean
    needBanner: boolean
    needDescription: boolean
}

export interface SellerRecentProduct {
    productId: number
    productName: string
    thumbnailUrl?: string | null
    productStatus: 'draft' | 'active' | 'inactive' | 'banned'
    soldCount: number
    averageRating: number
    createdAt: string
}

export interface SellerLowStockProduct {
    productId: number
    productName: string
    thumbnailUrl?: string | null

    variantId: number
    variantName?: string | null
    sku?: string | null
    stockQuantity: number
}

export interface SellerDashboardData {
    shop: ShopInfo
    stats: SellerDashboardStats
    tasks: SellerDashboardTasks
    recentProducts: SellerRecentProduct[]
    lowStockProducts: SellerLowStockProduct[]
}

export const sellerDashboardApi = {
    getDashboard: async (): Promise<SellerDashboardData> => {
        const res = await axiosInstance.get<ApiResponse<SellerDashboardData>>(
            '/seller/dashboard'
        )

        return res.data.data!
    },
}