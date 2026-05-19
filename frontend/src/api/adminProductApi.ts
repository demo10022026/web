import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type {
    AdminPageResponse,
    AdminProductDetailResponse,
    AdminProductQuery,
    AdminProductResponse,
    AdminProductStatusRequest,
    AdminProductUpdateRequest,
} from '@/types/adminProduct.types'

export const adminProductApi = {
    getProducts: async (
        params: AdminProductQuery
    ): Promise<AdminPageResponse<AdminProductResponse>> => {
        const res = await axiosInstance.get<
            ApiResponse<AdminPageResponse<AdminProductResponse>>
        >('/admin/products', { params })

        return res.data.data!
    },

    getProductDetail: async (
        productId: number
    ): Promise<AdminProductDetailResponse> => {
        const res = await axiosInstance.get<
            ApiResponse<AdminProductDetailResponse>
        >(`/admin/products/${productId}`)

        return res.data.data!
    },

    updateProduct: async (
        productId: number,
        body: AdminProductUpdateRequest
    ): Promise<AdminProductDetailResponse> => {
        const res = await axiosInstance.put<
            ApiResponse<AdminProductDetailResponse>
        >(`/admin/products/${productId}`, body)

        return res.data.data!
    },

    updateStatus: async (
        productId: number,
        body: AdminProductStatusRequest
    ): Promise<AdminProductResponse> => {
        const res = await axiosInstance.patch<ApiResponse<AdminProductResponse>>(
            `/admin/products/${productId}/status`,
            body
        )

        return res.data.data!
    },

    softDelete: async (productId: number): Promise<AdminProductResponse> => {
        const res = await axiosInstance.delete<ApiResponse<AdminProductResponse>>(
            `/admin/products/${productId}`
        )

        return res.data.data!
    },

    permanentDelete: async (productId: number): Promise<void> => {
        await axiosInstance.delete(`/admin/products/${productId}/permanent`)
    },
}