import axiosInstance from '../axiosInstance.ts'
import type { ApiResponse } from '@/types/auth.types.ts'

export interface AdminSellerItem {
    sellerId: number
    fullName: string
    email: string
    phoneNumber: string
    identityNumber?: string
    taxCode?: string
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
    rejectionReason?: string
    documents: {
        documentId: number
        documentType: 'citizen_id' | 'business_license' | 'tax_document'
        documentUrl: string
        verificationStatus: string
        uploadedAt: string
    }[]
    createdAt: string
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}

export const adminSellerApi = {
    list: async (
        status = 'pending',
        page = 0,
        size = 20
    ): Promise<PageResponse<AdminSellerItem>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<AdminSellerItem>>>(
            '/admin/sellers',
            { params: { status, page, size } }
        )
        return res.data.data!
    },

    getDetail: async (id: number): Promise<AdminSellerItem> => {
        const res = await axiosInstance.get<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}`
        )
        return res.data.data!
    },

    review: async (
        id: number,
        approved: boolean,
        rejectionReason?: string
    ): Promise<AdminSellerItem> => {
        const res = await axiosInstance.patch<ApiResponse<AdminSellerItem>>(
            `/admin/sellers/${id}/review`,
            { approved, rejectionReason }
        )
        return res.data.data!
    },
}