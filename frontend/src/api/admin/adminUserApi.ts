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

export type AdminUserRole = 'user' | 'seller' | 'admin' | 'manager'
export type AdminAccountStatus = 'active' | 'suspended' | 'banned'

export interface AdminUser {
    userId: number
    username: string
    fullName: string
    email: string
    phoneNumber: string
    avatarUrl?: string | null

    gender?: 'male' | 'female' | 'other' | null
    birthDate?: string | null

    role: AdminUserRole
    accountStatus: AdminAccountStatus

    emailVerified: boolean
    phoneVerified: boolean

    lastLoginAt?: string | null
    createdAt?: string | null
    updatedAt?: string | null

    hasSellerProfile: boolean

    sellerId?: number | null
    sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended' | null
    identityNumber?: string | null
    taxCode?: string | null

    shopId?: number | null
    shopName?: string | null
    shopSlug?: string | null
    shopStatus?: 'active' | 'suspended' | 'hidden' | null
}

export interface AdminUserStats {
    totalUsers: number

    activeUsers: number
    suspendedUsers: number
    bannedUsers: number

    normalUsers: number
    sellerUsers: number
    adminUsers: number
    managerUsers: number
}

export interface AdminUserListParams {
    keyword?: string
    role?: 'all' | AdminUserRole
    status?: 'all' | AdminAccountStatus
    page?: number
    size?: number
}

export interface AdminUpdateUserPayload {
    fullName?: string
    email?: string
    phoneNumber?: string
    role?: AdminUserRole
    accountStatus?: AdminAccountStatus
}

export interface AdminUpdateUserProfilePayload {
    fullName?: string
    email?: string
    phoneNumber?: string
}

export interface AdminUpdateUserRolePayload {
    role: AdminUserRole
}

export interface AdminUpdateUserStatusPayload {
    accountStatus: AdminAccountStatus
}

export interface AdminResetUserPasswordPayload {
    temporaryPassword?: string
}

export interface AdminResetPasswordResponse {
    userId: number
    email: string
    temporaryPassword: string
    message: string
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const adminUserApi = {
    getUsers: async (
        params: AdminUserListParams = {}
    ): Promise<PageResponse<AdminUser>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<AdminUser>>>(
            '/admin/users',
            {
                params: cleanParams({
                    ...params,
                    role: params.role === 'all' ? undefined : params.role,
                    status: params.status === 'all' ? undefined : params.status,
                }),
            }
        )

        return res.data.data!
    },

    getStats: async (): Promise<AdminUserStats> => {
        const res = await axiosInstance.get<ApiResponse<AdminUserStats>>(
            '/admin/users/stats'
        )

        return res.data.data!
    },

    getUserDetail: async (userId: number): Promise<AdminUser> => {
        const res = await axiosInstance.get<ApiResponse<AdminUser>>(
            `/admin/users/${userId}`
        )

        return res.data.data!
    },

    updateUser: async (
        userId: number,
        payload: AdminUpdateUserPayload
    ): Promise<AdminUser> => {
        const res = await axiosInstance.patch<ApiResponse<AdminUser>>(
            `/admin/users/${userId}`,
            payload
        )

        return res.data.data!
    },

    updateUserProfile: async (
        userId: number,
        payload: AdminUpdateUserProfilePayload
    ): Promise<AdminUser> => {
        const res = await axiosInstance.patch<ApiResponse<AdminUser>>(
            `/admin/users/${userId}/profile`,
            payload
        )

        return res.data.data!
    },

    updateUserRole: async (
        userId: number,
        payload: AdminUpdateUserRolePayload
    ): Promise<AdminUser> => {
        const res = await axiosInstance.patch<ApiResponse<AdminUser>>(
            `/admin/users/${userId}/role`,
            payload
        )

        return res.data.data!
    },

    updateUserStatus: async (
        userId: number,
        payload: AdminUpdateUserStatusPayload
    ): Promise<AdminUser> => {
        const res = await axiosInstance.patch<ApiResponse<AdminUser>>(
            `/admin/users/${userId}/status`,
            payload
        )

        return res.data.data!
    },

    resetUserPassword: async (
        userId: number,
        payload: AdminResetUserPasswordPayload = {}
    ): Promise<AdminResetPasswordResponse> => {
        const res = await axiosInstance.post<ApiResponse<AdminResetPasswordResponse>>(
            `/admin/users/${userId}/reset-password`,
            payload
        )

        return res.data.data!
    },
}
