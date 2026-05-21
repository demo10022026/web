import axiosInstance from './axiosInstance'
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

export interface ChatConversation {
    conversationId: number

    userId: number
    userName: string
    userAvatarUrl?: string | null

    sellerUserId: number
    sellerUserName: string
    sellerAvatarUrl?: string | null

    shopId: number
    shopName: string
    shopSlug?: string | null
    shopAvatarUrl?: string | null

    lastMessage?: string | null
    lastMessageAt?: string | null

    userUnreadCount: number
    sellerUnreadCount: number
    myUnreadCount: number

    createdAt?: string | null
    updatedAt?: string | null
}

export interface ChatMessage {
    messageId: number
    conversationId: number

    senderId: number
    senderName: string
    senderAvatarUrl?: string | null

    messageType: 'text'
    content: string

    read: boolean
    mine: boolean

    createdAt?: string | null
}

export const chatApi = {
    startWithShop: async (
        shopKey: number | string
    ): Promise<ChatConversation> => {
        const res = await axiosInstance.post<ApiResponse<ChatConversation>>(
            `/chats/shops/key/${encodeURIComponent(String(shopKey))}/start`
        )

        return res.data.data!
    },

    getConversations: async (): Promise<ChatConversation[]> => {
        const res = await axiosInstance.get<ApiResponse<ChatConversation[]>>(
            '/chats/conversations'
        )

        return res.data.data ?? []
    },

    getMessages: async (
        conversationId: number,
        page = 0,
        size = 30
    ): Promise<PageResponse<ChatMessage>> => {
        const res = await axiosInstance.get<ApiResponse<PageResponse<ChatMessage>>>(
            `/chats/conversations/${conversationId}/messages`,
            {
                params: {
                    page,
                    size,
                },
            }
        )

        return res.data.data!
    },

    sendMessage: async (
        conversationId: number,
        content: string
    ): Promise<ChatMessage> => {
        const res = await axiosInstance.post<ApiResponse<ChatMessage>>(
            `/chats/conversations/${conversationId}/messages`,
            {
                content,
            }
        )

        return res.data.data!
    },

    markAsRead: async (
        conversationId: number
    ): Promise<ChatConversation> => {
        const res = await axiosInstance.patch<ApiResponse<ChatConversation>>(
            `/chats/conversations/${conversationId}/read`
        )

        return res.data.data!
    },

    getUnreadCount: async (): Promise<number> => {
        const res = await axiosInstance.get<ApiResponse<number>>(
            '/chats/unread-count'
        )

        return res.data.data ?? 0
    },
}
