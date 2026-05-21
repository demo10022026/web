import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { notificationApi, type NotificationItem } from '@/api/notificationApi'

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

export default function NotificationsPage() {
    const [page, setPage] = useState(0)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data, isLoading, isError } = useQuery({
        queryKey: ['notifications', page, 10],
        queryFn: () => notificationApi.getNotifications({ page, size: 10 }),
        staleTime: 0,
    })

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

    const notifications = data?.content ?? []

    const handleClick = async (notification: NotificationItem) => {
        if (!notification.isRead) {
            await markAsReadMutation.mutateAsync(notification.notificationId)
        }

        if (notification.targetUrl) {
            navigate(notification.targetUrl)
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Thông báo
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Theo dõi đơn hàng, shop và các cập nhật liên quan đến tài khoản.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                    {markAllMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCheck className="h-4 w-4" />
                    )}
                    Đọc tất cả
                </button>
            </div>

            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải thông báo...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải thông báo.
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-gray-300" />
                    <h2 className="mt-4 font-semibold text-gray-800">
                        Chưa có thông báo
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Các cập nhật mới sẽ xuất hiện tại đây.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {notifications.map((notification) => (
                        <button
                            key={notification.notificationId}
                            type="button"
                            onClick={() => handleClick(notification)}
                            className="flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left last:border-b-0 hover:bg-gray-50"
                        >
                            <span
                                className={[
                                    'mt-1 h-3 w-3 shrink-0 rounded-full',
                                    notification.isRead
                                        ? 'bg-gray-200'
                                        : 'bg-orange-500',
                                ].join(' ')}
                            />

                            <span className="min-w-0 flex-1">
                                <span className="font-semibold text-gray-900">
                                    {notification.title}
                                </span>
                                {notification.content && (
                                    <span className="mt-1 block text-sm leading-6 text-gray-600">
                                        {notification.content}
                                    </span>
                                )}
                                <span className="mt-2 block text-xs text-gray-400">
                                    {formatDate(notification.createdAt)}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: data.totalPages }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setPage(index)}
                            className={[
                                'h-9 w-9 rounded-xl text-sm font-medium',
                                page === index
                                    ? 'bg-orange-500 text-white'
                                    : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                            ].join(' ')}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
