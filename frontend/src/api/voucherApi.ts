import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export type VoucherDiscountType = 'fixed' | 'percent'
export type VoucherScope = 'platform' | 'shop'
export type VoucherStatus =
    | 'active'
    | 'inactive'
    | 'upcoming'
    | 'expired'
    | 'used_out'

export interface Voucher {
    voucherId: number
    code: string
    voucherName: string

    discountType: VoucherDiscountType
    discountValue: number
    maxDiscountAmount?: number | null
    minOrderAmount?: number | null

    scope: VoucherScope
    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null

    usageLimit?: number | null
    usedCount: number
    remainingCount: number
    perUserLimit: number
    userUsedCount: number

    startTime: string
    endTime: string
    voucherStatus: VoucherStatus

    saved: boolean
    usable: boolean
    unavailableReason?: string | null
}

export interface GetAvailableVouchersParams {
    scope?: 'all' | VoucherScope
}

export interface GetMyVouchersParams {
    status?: 'all' | 'usable' | 'expired' | 'used'
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const voucherApi = {
    getAvailable: async (
        params: GetAvailableVouchersParams = {}
    ): Promise<Voucher[]> => {
        const res = await axiosInstance.get<ApiResponse<Voucher[]>>(
            '/vouchers/available',
            {
                params: cleanParams(params),
            }
        )

        return res.data.data ?? []
    },

    getMyVouchers: async (
        params: GetMyVouchersParams = {}
    ): Promise<Voucher[]> => {
        const res = await axiosInstance.get<ApiResponse<Voucher[]>>(
            '/vouchers/my',
            {
                params: cleanParams(params),
            }
        )

        return res.data.data ?? []
    },

    saveVoucher: async (voucherId: number): Promise<Voucher> => {
        const res = await axiosInstance.post<ApiResponse<Voucher>>(
            `/vouchers/${voucherId}/save`
        )

        return res.data.data!
    },

    removeSavedVoucher: async (voucherId: number): Promise<void> => {
        await axiosInstance.delete(`/vouchers/${voucherId}/save`)
    },
}
