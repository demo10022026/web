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

export interface NotificationItem {
    notificationId: number
    type: string
    title: string
    content?: string | null
    targetUrl?: string | null
    refType?: string | null
    refId?: number | null
    isRead: boolean
    readAt?: string | null
    createdAt?: string | null
}

export interface UnreadNotificationCount {
    unreadCount: number
}

export const notificationApi = {
    getNotifications: async (params: {
        page?: number
        size?: number
    } = {}): Promise<PageResponse<NotificationItem>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<NotificationItem>>
        >('/notifications', {
            params: {
                page: params.page ?? 0,
                size: params.size ?? 10,
            },
        })

        return res.data.data!
    },

    getUnreadCount: async (): Promise<UnreadNotificationCount> => {
        const res = await axiosInstance.get<
            ApiResponse<UnreadNotificationCount>
        >('/notifications/unread-count')

        return res.data.data ?? { unreadCount: 0 }
    },

    markAsRead: async (
        notificationId: number
    ): Promise<NotificationItem> => {
        const res = await axiosInstance.patch<ApiResponse<NotificationItem>>(
            `/notifications/${notificationId}/read`
        )

        return res.data.data!
    },

    markAllAsRead: async (): Promise<void> => {
        await axiosInstance.patch<ApiResponse<void>>(
            '/notifications/read-all'
        )
    },
}
