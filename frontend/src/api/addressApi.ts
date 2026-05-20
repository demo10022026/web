import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export type AddressType = 'home' | 'office' | 'other'

export interface UserAddress {
    addressId: number

    receiverName: string
    receiverPhone: string

    provinceCode?: string | null
    districtCode?: string | null
    wardCode?: string | null

    provinceName: string
    districtName: string
    wardName: string

    addressLine: string
    fullAddress: string

    addressType: AddressType
    isDefault: boolean

    createdAt?: string | null
}

export interface UserAddressPayload {
    receiverName: string
    receiverPhone: string

    provinceCode?: string
    districtCode?: string
    wardCode?: string

    provinceName: string
    districtName: string
    wardName: string

    addressLine: string
    addressType: AddressType
    isDefault: boolean
}

export const addressApi = {
    getMyAddresses: async (): Promise<UserAddress[]> => {
        const res = await axiosInstance.get<ApiResponse<UserAddress[]>>(
            '/addresses/my'
        )

        return res.data.data ?? []
    },

    createAddress: async (
        payload: UserAddressPayload
    ): Promise<UserAddress> => {
        const res = await axiosInstance.post<ApiResponse<UserAddress>>(
            '/addresses',
            payload
        )

        return res.data.data!
    },

    updateAddress: async (
        addressId: number,
        payload: UserAddressPayload
    ): Promise<UserAddress> => {
        const res = await axiosInstance.put<ApiResponse<UserAddress>>(
            `/addresses/${addressId}`,
            payload
        )

        return res.data.data!
    },

    deleteAddress: async (addressId: number): Promise<void> => {
        await axiosInstance.delete(`/addresses/${addressId}`)
    },

    setDefaultAddress: async (addressId: number): Promise<UserAddress> => {
        const res = await axiosInstance.put<ApiResponse<UserAddress>>(
            `/addresses/${addressId}/default`
        )

        return res.data.data!
    },
}