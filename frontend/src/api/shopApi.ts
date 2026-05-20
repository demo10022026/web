import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface PublicShop {
    shopId: number
    shopName: string
    shopSlug: string
    description?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    shopStatus: 'active' | 'suspended' | 'hidden'
    rating: number
    followerCount: number
    activeProductCount: number
    createdAt?: string | null
}

export const shopApi = {
    getPublicShop: async (shopSlugOrId: string): Promise<PublicShop> => {
        const res = await axiosInstance.get<ApiResponse<PublicShop>>(
            `/shops/${shopSlugOrId}`
        )

        return res.data.data!
    },
}
