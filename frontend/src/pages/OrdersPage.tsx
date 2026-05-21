import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CheckCircle2,
    Loader2,
    MessageCircle,
    Package,
    Search,
    ShoppingBag,
    Star,
    Store,
    Truck,
    X,
} from 'lucide-react'
import {
    orderApi,
    type OrderStatus,
    type UserOrder,
    type UserOrderItem,
} from '@/api/orderApi'

const ORDER_TABS: Array<{
    label: string
    value: 'all' | OrderStatus
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ thanh toán', value: 'pending' },
    { label: 'Vận chuyển', value: 'processing' },
    { label: 'Chờ giao hàng', value: 'shipping' },
    { label: 'Hoàn thành', value: 'delivered' },
    { label: 'Đã hủy', value: 'cancelled' },
    { label: 'Trả hàng/Hoàn tiền', value: 'returned' },
]

function formatMoney(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

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

function statusLabel(status?: string) {
    switch (status) {
        case 'pending':
            return 'CHỜ THANH TOÁN'
        case 'processing':
            return 'VẬN CHUYỂN'
        case 'shipping':
            return 'CHỜ GIAO HÀNG'
        case 'delivered':
            return 'HOÀN THÀNH'
        case 'cancelled':
            return 'ĐÃ HỦY'
        case 'returned':
            return 'TRẢ HÀNG/HOÀN TIỀN'
        default:
            return 'KHÔNG RÕ'
    }
}

function statusSubText(status?: string) {
    switch (status) {
        case 'pending':
            return 'Đơn hàng đang chờ xác nhận'
        case 'processing':
            return 'Người bán đang chuẩn bị hàng'
        case 'shipping':
            return 'Đơn hàng đang được vận chuyển'
        case 'delivered':
            return 'Giao hàng thành công'
        case 'cancelled':
            return 'Đơn hàng đã được hủy'
        case 'returned':
            return 'Đơn hàng đang xử lý trả hàng/hoàn tiền'
        default:
            return 'Đang cập nhật trạng thái'
    }
}

function canCancel(status?: string) {
    return status === 'pending' || status === 'processing'
}

function ReviewModal({
    item,
    onClose,
    onSubmit,
    submitting,
}: {
    item: UserOrderItem
    onClose: () => void
    onSubmit: (payload: {
        orderItemId: number
        rating: number
        reviewContent: string
    }) => void
    submitting: boolean
}) {
    const [rating, setRating] = useState(5)
    const [reviewContent, setReviewContent] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        onSubmit({
            orderItemId: item.orderItemId,
            rating,
            reviewContent: reviewContent.trim(),
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Đánh giá sản phẩm
                        </h2>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {item.productName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4 flex gap-3 rounded-xl bg-gray-50 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white">
                        {item.thumbnailUrl ? (
                            <img
                                src={item.thumbnailUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-gray-300" />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 text-sm">
                        <p className="line-clamp-2 font-medium text-gray-900">
                            {item.productName}
                        </p>

                        <p className="mt-1 text-gray-400">
                            Phân loại: {item.variantName || item.sku || 'Mặc định'}
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Số sao
                    </label>

                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, index) => {
                            const value = index + 1

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRating(value)}
                                    className="p-1"
                                >
                                    <Star
                                        className={
                                            value <= rating
                                                ? 'h-7 w-7 text-yellow-400'
                                                : 'h-7 w-7 text-gray-300'
                                        }
                                        fill={value <= rating ? 'currentColor' : 'none'}
                                    />
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mb-5">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nội dung đánh giá
                    </label>

                    <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-orange-500"
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    />

                    <p className="mt-1 text-right text-xs text-gray-400">
                        {reviewContent.length}/1000
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Gửi đánh giá
                    </button>
                </div>
            </form>
        </div>
    )
}

function OrderCard({ order }: { order: UserOrder }) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [reviewItem, setReviewItem] = useState<UserOrderItem | null>(null)

    const reviewableItems = useMemo(() => {
        if (order.orderStatus !== 'delivered') return []

        return order.items.filter((item) => !item.reviewed)
    }, [order.items, order.orderStatus])

    const allItemsReviewed =
        order.orderStatus === 'delivered' &&
        order.items.length > 0 &&
        order.items.every((item) => item.reviewed)

    const cancelMutation = useMutation({
        mutationFn: orderApi.cancelOrder,
        onSuccess: () => {
            toast.success('Đã hủy đơn hàng')
            queryClient.invalidateQueries({
                queryKey: ['myOrders'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể hủy đơn hàng'
            )
        },
    })

    const reviewMutation = useMutation({
        mutationFn: ({
            orderItemId,
            rating,
            reviewContent,
        }: {
            orderItemId: number
            rating: number
            reviewContent: string
        }) =>
            orderApi.createReview({
                orderItemId,
                data: {
                    rating,
                    reviewContent,
                },
            }),
        onSuccess: () => {
            toast.success('Đã gửi đánh giá')
            setReviewItem(null)
            queryClient.invalidateQueries({
                queryKey: ['myOrders'],
            })
            queryClient.invalidateQueries({
                queryKey: ['product'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể gửi đánh giá'
            )
        },
    })

    const buyAgainMutation = useMutation({
        mutationFn: orderApi.buyAgain,
        onSuccess: (data) => {
            if (data.skippedItems?.length) {
                toast(
                    `Đã bỏ qua ${data.skippedItems.length} sản phẩm không thể mua lại`
                )
            }

            if (!data.cartItemIds?.length) {
                toast.error('Không có sản phẩm nào có thể mua lại')
                return
            }

            navigate(`/checkout?items=${data.cartItemIds.join(',')}`)
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể mua lại đơn hàng'
            )
        },
    })

    const handleCancel = () => {
        const ok = window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')

        if (!ok) return

        cancelMutation.mutate(order.orderId)
    }

    const handleContactSeller = () => {
        toast('Tính năng chat với người bán sẽ được hoàn thiện sau')
    }

    const handleBuyAgain = () => {
        buyAgainMutation.mutate(order.orderId)
    }

    const handleOpenReview = () => {
        const firstItem = reviewableItems[0]

        if (!firstItem) return

        setReviewItem(firstItem)
    }

    return (
        <>
            <div className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="max-w-[260px] truncate font-semibold text-gray-900">
                            {order.shopName || 'Shop'}
                        </span>

                        <button
                            type="button"
                            onClick={handleContactSeller}
                            className="inline-flex items-center gap-1 rounded-sm bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                            <MessageCircle size={13} />
                            Chat
                        </button>

                        {order.shopSlug ? (
                            <Link
                                to={`/shops/${order.shopSlug}`}
                                className="inline-flex items-center gap-1 rounded-sm border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                                <Store size={13} />
                                Xem Shop
                            </Link>
                        ) : (
                            <Link
                                to={`/search?shopName=${encodeURIComponent(order.shopName || '')}`}
                                className="inline-flex items-center gap-1 rounded-sm border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                                <Store size={13} />
                                Xem Shop
                            </Link>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-sm">
                        <div className="hidden items-center gap-1 text-emerald-600 md:flex">
                            <Truck size={16} />
                            {statusSubText(order.orderStatus)}
                        </div>

                        <span className="hidden h-4 w-px bg-gray-200 md:inline-block" />

                        <span className="font-medium text-red-500">
                            {statusLabel(order.orderStatus)}
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 px-4">
                    {order.items.length === 0 ? (
                        <div className="flex items-center gap-3 py-4">
                            <div className="flex h-20 w-20 items-center justify-center bg-gray-100">
                                <Package className="h-7 w-7 text-gray-300" />
                            </div>

                            <div className="text-sm text-gray-500">
                                Đơn hàng chưa có sản phẩm.
                            </div>
                        </div>
                    ) : (
                        order.items.map((item) => (
                            <div
                                key={item.orderItemId}
                                className="flex gap-3 py-4 hover:bg-gray-50"
                            >
                                <Link
                                    to={`/products/${item.productId}`}
                                    className="h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-gray-100 bg-gray-100"
                                >
                                    {item.thumbnailUrl ? (
                                        <img
                                            src={item.thumbnailUrl}
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-7 w-7 text-gray-300" />
                                        </div>
                                    )}
                                </Link>

                                <Link
                                    to={`/products/${item.productId}`}
                                    className="min-w-0 flex-1"
                                >
                                    <p className="line-clamp-2 text-sm text-gray-900 md:text-base">
                                        {item.productName}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-400">
                                        Phân loại hàng:{' '}
                                        {item.variantName || item.sku || 'Mặc định'}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700">
                                        x{item.quantity}
                                    </p>

                                    {order.orderStatus === 'delivered' && item.reviewed && (
                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700">
                                            <CheckCircle2 size={13} />
                                            Đã đánh giá
                                        </span>
                                    )}
                                </Link>

                                <div className="flex shrink-0 flex-col items-end justify-center text-sm">
                                    {item.originalPrice &&
                                        item.originalPrice > item.price && (
                                            <span className="text-gray-400 line-through">
                                                {formatMoney(item.originalPrice)}
                                            </span>
                                        )}

                                    <span className="text-red-500">
                                        {formatMoney(item.price)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-gray-100 bg-white px-4 py-4">
                    <div className="flex items-center justify-end gap-3">
                        <span className="text-sm text-gray-700">Thành tiền:</span>

                        <span className="text-2xl font-medium text-red-500">
                            {formatMoney(order.totalAmount)}
                        </span>
                    </div>

                    <div className="mt-2 text-right text-xs text-gray-400">
                        Mã đơn: {order.orderCode} · Đặt lúc {formatDate(order.createdAt)}
                    </div>

                    {order.trackingCode && (
                        <div className="mt-1 text-right text-xs text-gray-400">
                            Mã vận đơn: {order.trackingCode}
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {order.orderStatus === 'delivered' && reviewableItems.length > 0 && (
                            <button
                                type="button"
                                onClick={handleOpenReview}
                                className="rounded-sm bg-red-500 px-8 py-2 text-sm font-medium text-white hover:bg-red-600"
                            >
                                Đánh Giá
                            </button>
                        )}

                        {allItemsReviewed && (
                            <button
                                type="button"
                                disabled
                                className="rounded-sm border border-green-100 bg-green-50 px-8 py-2 text-sm font-medium text-green-700"
                            >
                                Đã đánh giá
                            </button>
                        )}

                        {(order.orderStatus === 'delivered' ||
                            order.orderStatus === 'cancelled') && (
                            <button
                                type="button"
                                disabled={buyAgainMutation.isPending}
                                onClick={handleBuyAgain}
                                className="rounded-sm bg-red-500 px-8 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                            >
                                {buyAgainMutation.isPending
                                    ? 'Đang xử lý...'
                                    : 'Mua Lại'}
                            </button>
                        )}

                        {canCancel(order.orderStatus) && (
                            <button
                                type="button"
                                disabled={cancelMutation.isPending}
                                onClick={handleCancel}
                                className="rounded-sm border border-gray-200 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {cancelMutation.isPending
                                    ? 'Đang hủy...'
                                    : 'Hủy Đơn Hàng'}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleContactSeller}
                            className="rounded-sm border border-gray-200 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Liên Hệ Người Bán
                        </button>
                    </div>
                </div>
            </div>

            {reviewItem && (
                <ReviewModal
                    item={reviewItem}
                    onClose={() => setReviewItem(null)}
                    submitting={reviewMutation.isPending}
                    onSubmit={(payload) => reviewMutation.mutate(payload)}
                />
            )}
        </>
    )
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')

    const {
        data: orders = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['myOrders', activeTab, keyword],
        queryFn: () =>
            orderApi.getMyOrders({
                status: activeTab === 'all' ? undefined : activeTab,
                keyword: keyword || undefined,
            }),
        staleTime: 0,
    })

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-4 bg-white">
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {ORDER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setActiveTab(tab.value)}
                            className={[
                                'shrink-0 border-b-2 px-6 py-4 text-sm font-medium transition-colors',
                                activeTab === tab.value
                                    ? 'border-red-500 text-red-500'
                                    : 'border-transparent text-gray-700 hover:text-red-500',
                            ].join(' ')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <form
                onSubmit={handleSearch}
                className="mb-4 flex items-center gap-3 bg-gray-100 px-4 py-3"
            >
                <Search className="h-5 w-5 text-gray-400" />

                <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
                    className="flex-1 bg-transparent text-sm outline-none"
                />

                {keyword && (
                    <button
                        type="button"
                        onClick={() => {
                            setKeyword('')
                            setKeywordInput('')
                        }}
                        className="text-sm text-gray-500 hover:text-red-500"
                    >
                        Xóa
                    </button>
                )}
            </form>

            {isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải đơn hàng...
                </div>
            ) : isError ? (
                <div className="rounded-sm bg-white p-10 text-center text-red-500">
                    Không thể tải danh sách đơn hàng.
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-sm bg-white p-16 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />

                    <p className="mt-4 text-gray-500">
                        Chưa có đơn hàng nào.
                    </p>

                    <Link
                        to="/"
                        className="mt-4 inline-flex rounded-sm bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.orderId}
                            order={order}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
