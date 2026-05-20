import axiosInstance from '../axiosInstance.ts'
import type { ApiResponse } from '@/types/auth.types.ts'

export type SellerVerifyStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'

export type SellerListStatus = SellerVerifyStatus | 'all'

export interface AdminSellerDocument {
    documentId: number
    documentType: string
    documentUrl: string
    verificationStatus: string
    uploadedAt: string
}

export interface AdminSellerShop {
    shopId: number
    shopName: string
    shopSlug: string
    description?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    shopStatus: 'active' | 'suspended' | 'hidden'
    rating?: number | null
    followerCount?: number | null
    createdAt?: string | null
}

export interface AdminSellerItem {
    sellerId: number

    userId?: number | null
    username?: string | null
    fullName: string
    email: string
    phoneNumber: string
    userRole?: string | null
    accountStatus?: string | null

    identityNumber?: string | null
    taxCode?: string | null
    verificationStatus: SellerVerifyStatus
    rejectionReason?: string | null
    verifiedAt?: string | null
    createdAt: string

    shop?: AdminSellerShop | null
    documents: AdminSellerDocument[]
}

export interface AdminSellerStats {
    totalSellers: number
    pendingSellers: number
    approvedSellers: number
    rejectedSellers: number
    suspendedSellers: number
    activeShops: number
    suspendedShops: number
    hiddenShops: number
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    first?: boolean
    last?: boolean
}

export interface SellerListParams {
    status?: SellerListStatus
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

export const adminSellerApi = {
    getStats: async (): Promise<AdminSellerStats> => {
        const res = await axiosInstance.get<ApiResponse<AdminSellerStats>>(
            '/admin/sellers/stats'
        )

        return res.data.data!
    },

    list: async (
        params: SellerListParams = {}
    ): Promise<PageResponse<AdminSellerItem>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<AdminSellerItem>>
        >('/admin/sellers', {
            params: cleanParams({
                status: params.status ?? 'pending',
                keyword: params.keyword,
                page: params.page ?? 0,
                size: params.size ?? 20,
            }),
        })

        return res.data.data!
    },

    getActiveSellers: async (
        params: Omit<SellerListParams, 'status'> = {}
    ): Promise<PageResponse<AdminSellerItem>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<AdminSellerItem>>
        >('/admin/sellers/active', {
            params: cleanParams({
                keyword: params.keyword,
                page: params.page ?? 0,
                size: params.size ?? 20,
            }),
        })

        return res.data.data!
    },

    getDetail: async (id: number): Promise<AdminSellerItem> => {
        const res = await axiosInstance.get<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}`
        )

        return res.data.data!
    },

    review: async (
        id: number,
        approved: boolean,
        rejectionReason?: string
    ): Promise<AdminSellerItem> => {
        const res = await axiosInstance.patch<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}/review`,
            { approved, rejectionReason }
        )

        return res.data.data!
    },

    suspend: async (
        id: number,
        reason?: string
    ): Promise<AdminSellerItem> => {
        const res = await axiosInstance.patch<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}/suspend`,
            { reason }
        )

        return res.data.data!
    },

    reactivate: async (id: number): Promise<AdminSellerItem> => {
        const res = await axiosInstance.patch<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}/reactivate`
        )

        return res.data.data!
    },

    // Legacy cho component cũ nếu còn dùng.
    getPendingSellers: async (): Promise<AdminSellerItem[]> => {
        const res = await axiosInstance.get<ApiResponse<AdminSellerItem[]>>(
            '/admin/sellers/pending'
        )

        return res.data.data ?? []
    },

    approveSeller: async (sellerId: number): Promise<AdminSellerItem> => {
        const res = await axiosInstance.put<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${sellerId}/approve`
        )

        return res.data.data!
    },

    rejectSeller: async (
        sellerId: number,
        reason: string
    ): Promise<AdminSellerItem> => {
        const res = await axiosInstance.put<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${sellerId}/reject`,
            { reason }
        )

        return res.data.data!
    },
}
