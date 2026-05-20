import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export type SellerShopStatus = 'active' | 'hidden' | 'suspended'

export interface SellerShopBankAccount {
    bankAccountId: number
    bankName: string
    accountHolder: string
    accountNumber: string
    maskedAccountNumber?: string | null
    isPrimary: boolean
    createdAt?: string | null
}

export interface SellerShopProfile {
    shopId: number
    sellerId: number
    shopName: string
    shopSlug: string
    description?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    shopStatus: SellerShopStatus
    rating: number
    followerCount: number
    createdAt?: string | null
    bankAccount?: SellerShopBankAccount | null
}

export interface UpdateSellerShopProfilePayload {
    shopName: string
    description?: string
    shopStatus: Exclude<SellerShopStatus, 'suspended'>
    avatar?: File | null
    banner?: File | null
}

export interface UpsertSellerBankAccountPayload {
    bankName: string
    accountHolder: string
    accountNumber: string
}

export const sellerShopProfileApi = {
    getMyShopProfile: async (): Promise<SellerShopProfile> => {
        const res = await axiosInstance.get<ApiResponse<SellerShopProfile>>(
            '/seller/shop/profile'
        )

        return res.data.data!
    },

    updateMyShopProfile: async (
        payload: UpdateSellerShopProfilePayload
    ): Promise<SellerShopProfile> => {
        const formData = new FormData()

        formData.append('shopName', payload.shopName)
        formData.append('shopStatus', payload.shopStatus)

        if (payload.description) {
            formData.append('description', payload.description)
        }

        if (payload.avatar) {
            formData.append('avatar', payload.avatar)
        }

        if (payload.banner) {
            formData.append('banner', payload.banner)
        }

        const res = await axiosInstance.put<ApiResponse<SellerShopProfile>>(
            '/seller/shop/profile',
            formData
        )

        return res.data.data!
    },

    upsertBankAccount: async (
        payload: UpsertSellerBankAccountPayload
    ): Promise<SellerShopProfile> => {
        const res = await axiosInstance.put<ApiResponse<SellerShopProfile>>(
            '/seller/shop/profile/bank-account',
            payload
        )

        return res.data.data!
    },
}
