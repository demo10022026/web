import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface ShopInfo {
    shopId: number
    sellerId: number
    shopName: string
    shopSlug: string
    description?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    shopStatus: 'active' | 'suspended' | 'hidden'
    rating: number
    followerCount: number
    createdAt: string
}

export interface CreateShopPayload {
    shopName: string
    description?: string
    avatar?: File | null
    banner?: File | null
}

export const sellerShopApi = {
    getMyShop: async (): Promise<ShopInfo | null> => {
        try {
            const res = await axiosInstance.get<ApiResponse<ShopInfo>>(
                '/seller/shop/me'
            )

            return res.data.data ?? null
        } catch (err: any) {
            const status = err?.response?.status
            const code = err?.response?.data?.errorCode

            if (status === 404 || code === 'SHOP_NOT_FOUND') {
                return null
            }

            throw err
        }
    },

    createShop: async (payload: CreateShopPayload): Promise<ShopInfo> => {
        const formData = new FormData()

        formData.append('shopName', payload.shopName)

        if (payload.description) {
            formData.append('description', payload.description)
        }

        if (payload.avatar) {
            formData.append('avatar', payload.avatar)
        }

        if (payload.banner) {
            formData.append('banner', payload.banner)
        }

        const res = await axiosInstance.post<ApiResponse<ShopInfo>>(
            '/seller/shop',
            formData
        )

        return res.data.data!
    },
}