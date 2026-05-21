import axiosInstance from '@/api/axiosInstance'
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

export interface AdminVoucherShopLookup {
    shopId: number
    shopName: string
    shopSlug?: string | null
    shopStatus?: string | null
}

export type AdminVoucherScope = 'platform' | 'shop'
export type AdminVoucherDiscountType = 'fixed' | 'percent'
export type AdminVoucherRawStatus = 'active' | 'inactive'
export type AdminVoucherStatus =
    | 'active'
    | 'inactive'
    | 'upcoming'
    | 'expired'
    | 'used_out'

export interface AdminVoucher {
    voucherId: number
    code: string
    voucherName: string

    discountType: AdminVoucherDiscountType
    discountValue: number
    maxDiscountAmount?: number | null
    minOrderAmount?: number | null

    scope: AdminVoucherScope
    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null

    usageLimit: number
    usedCount: number
    remainingCount: number
    perUserLimit: number

    savedCount: number
    userUsedCount: number

    startTime: string
    endTime: string
    createdAt?: string | null

    voucherStatus: AdminVoucherStatus
    rawStatus?: AdminVoucherRawStatus | null
}

export interface AdminVoucherStats {
    totalVouchers: number
    activeVouchers: number
    inactiveVouchers: number
    upcomingVouchers: number
    expiredVouchers: number
    usedOutVouchers: number
    platformVouchers: number
    shopVouchers: number
    totalSavedVouchers: number
}

export interface AdminVoucherListParams {
    scope?: 'all' | AdminVoucherScope
    status?: 'all' | AdminVoucherStatus
    keyword?: string
    page?: number
    size?: number
}

export interface AdminVoucherPayload {
    code: string
    voucherName: string
    discountType: AdminVoucherDiscountType
    discountValue: number
    maxDiscountAmount?: number | null
    minOrderAmount: number
    scope: AdminVoucherScope
    shopId?: number | null
    usageLimit: number
    perUserLimit: number
    startTime: string
    endTime: string
    voucherStatus: AdminVoucherRawStatus
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const adminVoucherApi = {
    getVouchers: async (
        params: AdminVoucherListParams = {}
    ): Promise<PageResponse<AdminVoucher>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<AdminVoucher>>
        >('/admin/vouchers', {
            params: cleanParams({
                ...params,
                scope: params.scope === 'all' ? undefined : params.scope,
                status: params.status === 'all' ? undefined : params.status,
            }),
        })

        return res.data.data!
    },

    getStats: async (): Promise<AdminVoucherStats> => {
        const res = await axiosInstance.get<ApiResponse<AdminVoucherStats>>(
            '/admin/vouchers/stats'
        )

        return res.data.data!
    },

    getVoucherDetail: async (voucherId: number): Promise<AdminVoucher> => {
        const res = await axiosInstance.get<ApiResponse<AdminVoucher>>(
            `/admin/vouchers/${voucherId}`
        )

        return res.data.data!
    },

    getShopLookup: async (
        shopId: number
    ): Promise<AdminVoucherShopLookup> => {
        const res = await axiosInstance.get<
            ApiResponse<AdminVoucherShopLookup>
        >(`/admin/vouchers/shops/${shopId}`)

        return res.data.data!
    },

    createVoucher: async (
        payload: AdminVoucherPayload
    ): Promise<AdminVoucher> => {
        const res = await axiosInstance.post<ApiResponse<AdminVoucher>>(
            '/admin/vouchers',
            payload
        )

        return res.data.data!
    },

    updateVoucher: async (
        voucherId: number,
        payload: AdminVoucherPayload
    ): Promise<AdminVoucher> => {
        const res = await axiosInstance.put<ApiResponse<AdminVoucher>>(
            `/admin/vouchers/${voucherId}`,
            payload
        )

        return res.data.data!
    },

    updateVoucherStatus: async (
        voucherId: number,
        voucherStatus: AdminVoucherRawStatus
    ): Promise<AdminVoucher> => {
        const res = await axiosInstance.patch<ApiResponse<AdminVoucher>>(
            `/admin/vouchers/${voucherId}/status`,
            {
                voucherStatus,
            }
        )

        return res.data.data!
    },
}
