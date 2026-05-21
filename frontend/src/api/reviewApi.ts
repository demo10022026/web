import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type { PageResponse } from '@/types/product.types'

export interface ProductReview {
    reviewId: number
    orderItemId?: number | null

    productId: number
    productName?: string | null

    userId?: number | null
    username?: string | null
    userFullName?: string | null
    userAvatarUrl?: string | null

    rating: number
    reviewContent?: string | null
    verifiedPurchase?: boolean | null
    createdAt?: string | null
}

export interface ProductReviewStats {
    productId: number
    averageRating: number
    reviewCount: number
    ratingCounts: Record<string, number>
}

export interface GetProductReviewsParams {
    ratings?: number[]
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

export const reviewApi = {
    getLatestProductReviews: async (
        productId: number,
        limit = 5
    ): Promise<ProductReview[]> => {
        const res = await axiosInstance.get<ApiResponse<ProductReview[]>>(
            `/products/${productId}/reviews/latest`,
            {
                params: {
                    limit,
                },
            }
        )

        return res.data.data ?? []
    },

    getProductReviews: async (
        productId: number,
        params: GetProductReviewsParams = {}
    ): Promise<PageResponse<ProductReview>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<ProductReview>>
        >(`/products/${productId}/reviews`, {
            params: cleanParams({
                ...params,
                ratings:
                    params.ratings && params.ratings.length > 0
                        ? params.ratings.join(',')
                        : undefined,
            }),
        })

        return res.data.data!
    },

    getProductReviewStats: async (
        productId: number
    ): Promise<ProductReviewStats> => {
        const res = await axiosInstance.get<ApiResponse<ProductReviewStats>>(
            `/products/${productId}/reviews/stats`
        )

        return res.data.data!
    },
}
