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

export interface ShopFollowStatus {
    shopId: number
    following: boolean
    followerCount: number
}

export interface FollowingShop {
    shopId: number
    shopName: string
    shopSlug?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    description?: string | null
    shopStatus?: string | null
    rating?: number | null
    followerCount?: number | null
    followedAt?: string | null
}

export const shopFollowApi = {
    getFollowStatus: async (shopId: number): Promise<ShopFollowStatus> => {
        const res = await axiosInstance.get<ApiResponse<ShopFollowStatus>>(
            `/shops/${shopId}/follow-status`
        )

        return res.data.data!
    },

    followShop: async (shopId: number): Promise<ShopFollowStatus> => {
        const res = await axiosInstance.post<ApiResponse<ShopFollowStatus>>(
            `/shops/${shopId}/follow`
        )

        return res.data.data!
    },

    unfollowShop: async (shopId: number): Promise<ShopFollowStatus> => {
        const res = await axiosInstance.delete<ApiResponse<ShopFollowStatus>>(
            `/shops/${shopId}/follow`
        )

        return res.data.data!
    },

    getMyFollowingShops: async (params: {
        page?: number
        size?: number
    } = {}): Promise<PageResponse<FollowingShop>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<FollowingShop>>
        >('/users/me/following-shops', {
            params: {
                page: params.page ?? 0,
                size: params.size ?? 12,
            },
        })

        return res.data.data!
    },
}
