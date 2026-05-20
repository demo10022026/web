import axiosInstance from '../axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export type SellerVerificationStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'

export type SellerDocumentType =
    | 'citizen_id'
    | 'citizen_id_back'
    | 'business_license'
    | 'tax_document'

export interface AdminSellerDocument {
    documentId: number
    documentType: SellerDocumentType
    documentUrl: string
    verificationStatus: 'pending' | 'approved' | 'rejected'
    uploadedAt: string
}

export interface AdminSellerItem {
    sellerId: number
    fullName: string
    email: string
    phoneNumber: string
    identityNumber?: string | null
    taxCode?: string | null
    verificationStatus: SellerVerificationStatus
    rejectionReason?: string | null
    verifiedAt?: string | null
    createdAt: string
    documents: AdminSellerDocument[]
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