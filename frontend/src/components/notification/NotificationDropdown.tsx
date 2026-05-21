import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
    notificationApi,
    type NotificationItem,
    type PageResponse,
    type UnreadNotificationCount,
} from '@/api/notificationApi'
import { useAuthStore } from '@/store/authStore'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

function formatDate(value?: string | null) {
    if (!value) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function upsertFirstPage(
    oldData: PageResponse<NotificationItem> | undefined,
    notification: NotificationItem
): PageResponse<NotificationItem> | undefined {
    if (!oldData) return oldData

    const withoutDuplicate = oldData.content.filter(
        (item) => item.notificationId !== notification.notificationId
    )

    return {
        ...oldData,
        content: [notification, ...withoutDuplicate].slice(0, oldData.size || 10),
        totalElements: oldData.totalElements + 1,
    }
}

export default function NotificationDropdown() {
    const { isAuthenticated } = useAuthStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const notificationsQuery = useQuery({
        queryKey: ['notifications', 0, 5],
        queryFn: () => notificationApi.getNotifications({ page: 0, size: 5 }),
        enabled: isAuthenticated,
        staleTime: 15 * 1000,
    })

    const unreadQuery = useQuery({
        queryKey: ['notificationsUnreadCount'],
        queryFn: notificationApi.getUnreadCount,
        enabled: isAuthenticated,
        staleTime: 15 * 1000,
    })

    const onRealtimeNotification = useCallback(
        (notification: NotificationItem) => {
            queryClient.setQueryData<PageResponse<NotificationItem>>(
                ['notifications', 0, 5],
                (old) => upsertFirstPage(old, notification)
            )

            queryClient.setQueryData<UnreadNotificationCount>(
                ['notificationsUnreadCount'],
                (old) => ({
                    unreadCount: (old?.unreadCount ?? 0) + 1,
                })
            )

            toast(notification.title)
        },
        [queryClient]
    )

    useNotificationSocket(onRealtimeNotification)

    const markAsReadMutation = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] })
        },
    })

    const markAllMutation = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] })
        },
    })

    const unreadCount = unreadQuery.data?.unreadCount ?? 0
    const notifications = notificationsQuery.data?.content ?? []

    const handleNotificationClick = async (notification: NotificationItem) => {
        if (!notification.isRead) {
            await markAsReadMutation.mutateAsync(notification.notificationId)
        }

        setOpen(false)

        if (notification.targetUrl) {
            navigate(notification.targetUrl)
        }
    }

    if (!isAuthenticated) {
        return (
            <Link
                to="/login"
                className="relative p-2 hover:bg-orange-400/60 rounded-lg transition-colors"
                title="Thông báo"
            >
                <Bell className="h-5 w-5" />
            </Link>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative p-2 hover:bg-orange-400/60 rounded-lg transition-colors"
                title="Thông báo"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <p className="font-semibold text-gray-900">Thông báo</p>
                            <p className="text-xs text-gray-400">
                                {unreadCount > 0
                                    ? `${unreadCount} thông báo chưa đọc`
                                    : 'Không có thông báo chưa đọc'}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllMutation.mutate()}
                                disabled={markAllMutation.isPending}
                                className="text-xs font-medium text-orange-600 hover:underline disabled:opacity-60"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notificationsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tải thông báo...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-400">
                                Chưa có thông báo.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.notificationId}
                                    type="button"
                                    onClick={() => handleNotificationClick(notification)}
                                    className="flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50"
                                >
                                    <span
                                        className={[
                                            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                                            notification.isRead
                                                ? 'bg-gray-200'
                                                : 'bg-orange-500',
                                        ].join(' ')}
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-1 text-sm font-semibold text-gray-900">
                                            {notification.title}
                                        </span>
                                        {notification.content && (
                                            <span className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                                {notification.content}
                                            </span>
                                        )}
                                        <span className="mt-1 block text-[11px] text-gray-400">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <Link
                        to="/notifications"
                        onClick={() => setOpen(false)}
                        className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-orange-600 hover:bg-orange-50"
                    >
                        Xem tất cả
                    </Link>
                </div>
            )}
        </div>
    )
}
