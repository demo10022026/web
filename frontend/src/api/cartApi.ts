import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type {
    AddToCartRequest,
    CartResponse,
    UpdateCartItemRequest,
} from '@/types/cart.types'

export const cartApi = {
    getCart: async (): Promise<CartResponse> => {
        const res = await axiosInstance.get<ApiResponse<CartResponse>>('/cart')
        return res.data.data!
    },

    addItem: async (body: AddToCartRequest): Promise<CartResponse> => {
        const res = await axiosInstance.post<ApiResponse<CartResponse>>(
            '/cart/items',
            body
        )
        return res.data.data!
    },

    updateItem: async (
        cartItemId: number,
        body: UpdateCartItemRequest
    ): Promise<CartResponse> => {
        const res = await axiosInstance.put<ApiResponse<CartResponse>>(
            `/cart/items/${cartItemId}`,
            body
        )
        return res.data.data!
    },

    removeItem: async (cartItemId: number): Promise<CartResponse> => {
        const res = await axiosInstance.delete<ApiResponse<CartResponse>>(
            `/cart/items/${cartItemId}`
        )
        return res.data.data!
    },

    clearCart: async (): Promise<CartResponse> => {
        const res = await axiosInstance.delete<ApiResponse<CartResponse>>(
            '/cart/clear'
        )
        return res.data.data!
    },
}