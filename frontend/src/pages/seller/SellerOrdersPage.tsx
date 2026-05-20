import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CheckCircle2,
    Loader2,
    MapPin,
    Package,
    Phone,
    Search,
    Truck,
    User,
} from 'lucide-react'
import {
    sellerOrderApi,
    type SellerOrder,
    type SellerOrderStatus,
} from '@/api/sellerOrderApi'

const STATUS_TABS: Array<{
    label: string
    value: 'all' | SellerOrderStatus
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ xác nhận', value: 'pending' },
    { label: 'Đang chuẩn bị', value: 'processing' },
    { label: 'Đang giao', value: 'shipping' },
    { label: 'Hoàn thành', value: 'delivered' },
    { label: 'Đã hủy', value: 'cancelled' },
    { label: 'Trả hàng', value: 'returned' },
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
            return 'Chờ xác nhận'
        case 'processing':
            return 'Đang chuẩn bị'
        case 'shipping':
            return 'Đang giao'
        case 'delivered':
            return 'Hoàn thành'
        case 'cancelled':
            return 'Đã hủy'
        case 'returned':
            return 'Trả hàng'
        default:
            return 'Không rõ'
    }
}

function statusClass(status?: string) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-50 text-yellow-700'
        case 'processing':
            return 'bg-blue-50 text-blue-700'
        case 'shipping':
            return 'bg-purple-50 text-purple-700'
        case 'delivered':
            return 'bg-green-50 text-green-700'
        case 'cancelled':
            return 'bg-red-50 text-red-700'
        case 'returned':
            return 'bg-gray-100 text-gray-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function nextStatus(status: SellerOrderStatus): SellerOrderStatus | null {
    switch (status) {
        case 'pending':
            return 'processing'
        case 'processing':
            return 'shipping'
        case 'shipping':
            return 'delivered'
        default:
            return null
    }
}

function nextStatusActionLabel(status: SellerOrderStatus) {
    switch (status) {
        case 'pending':
            return 'Xác nhận đơn'
        case 'processing':
            return 'Bàn giao vận chuyển'
        case 'shipping':
            return 'Đánh dấu hoàn thành'
        default:
            return ''
    }
}

function OrderCard({
                       order,
                       onUpdateStatus,
                       updating,
                   }: {
    order: SellerOrder
    onUpdateStatus: (order: SellerOrder) => void
    updating: boolean
}) {
    const next = nextStatus(order.orderStatus)

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">
                            {order.orderCode}
                        </span>

                        <span
                            className={[
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                statusClass(order.orderStatus),
                            ].join(' ')}
                        >
                            {statusLabel(order.orderStatus)}
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                        Đặt lúc {formatDate(order.createdAt)}
                    </p>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-xs text-gray-400">Thành tiền shop</p>
                    <p className="text-lg font-semibold text-orange-600">
                        {formatMoney(order.shopSubtotalAmount)}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 border-b border-gray-100 p-4 lg:grid-cols-2">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                        <User className="h-4 w-4 text-gray-400" />
                        Khách hàng
                    </div>

                    <p className="text-gray-600">
                        {order.customerName || order.receiverName}
                    </p>

                    <p className="text-gray-400">
                        {order.customerEmail || 'Không có email'}
                    </p>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Địa chỉ nhận hàng
                    </div>

                    <p className="text-gray-600">{order.receiverName}</p>

                    <p className="flex items-center gap-1 text-gray-500">
                        <Phone className="h-3.5 w-3.5" />
                        {order.receiverPhone}
                    </p>

                    <p className="text-gray-500">
                        {order.fullShippingAddress}
                    </p>
                </div>
            </div>

            <div className="divide-y divide-gray-100 px-4">
                {order.items.length === 0 ? (
                    <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
                        <Package className="h-7 w-7 text-gray-300" />
                        Đơn này không có sản phẩm thuộc shop của bạn.
                    </div>
                ) : (
                    order.items.map((item) => (
                        <div
                            key={item.orderItemId}
                            className="flex gap-3 py-4"
                        >
                            <Link
                                to={`/products/${item.productId}`}
                                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
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

                            <div className="min-w-0 flex-1">
                                <Link
                                    to={`/products/${item.productId}`}
                                    className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-orange-600"
                                >
                                    {item.productName}
                                </Link>

                                <p className="mt-1 text-xs text-gray-400">
                                    Phân loại:{' '}
                                    {item.variantName || item.sku || 'Mặc định'}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                    x{item.quantity}
                                </p>
                            </div>

                            <div className="shrink-0 text-right text-sm">
                                <p className="text-gray-500">
                                    {formatMoney(item.price)}
                                </p>

                                <p className="mt-1 font-semibold text-orange-600">
                                    {formatMoney(item.lineTotal)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-xs text-gray-500">
                    {order.trackingCode && (
                        <p>Mã vận đơn: {order.trackingCode}</p>
                    )}

                    {order.ghnOrderCode && (
                        <p>Mã GHN: {order.ghnOrderCode}</p>
                    )}

                    <p>
                        Tổng đơn gốc:{' '}
                        <span className="font-medium text-gray-700">
                            {formatMoney(order.orderTotalAmount)}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                    {next && (
                        <button
                            type="button"
                            disabled={updating}
                            onClick={() => onUpdateStatus(order)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {updating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : next === 'shipping' ? (
                                <Truck className="h-4 w-4" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}

                            {nextStatusActionLabel(order.orderStatus)}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SellerOrdersPage() {
    const queryClient = useQueryClient()

    const [activeStatus, setActiveStatus] = useState<'all' | SellerOrderStatus>(
        'all'
    )
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [page, setPage] = useState(0)

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerOrders', activeStatus, keyword, page],
        queryFn: () =>
            sellerOrderApi.getMyShopOrders({
                status: activeStatus === 'all' ? undefined : activeStatus,
                keyword: keyword || undefined,
                page,
                size: 10,
            }),
        staleTime: 0,
    })

    const orders = data?.content ?? []

    const updateStatusMutation = useMutation({
        mutationFn: ({
                         orderId,
                         orderStatus,
                     }: {
            orderId: number
            orderStatus: SellerOrderStatus
        }) => sellerOrderApi.updateOrderStatus(orderId, orderStatus),

        onSuccess: () => {
            toast.success('Cập nhật trạng thái đơn hàng thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerOrders'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                'Không thể cập nhật trạng thái đơn hàng'
            )
        },
    })

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleStatusTab = (status: 'all' | SellerOrderStatus) => {
        setActiveStatus(status)
        setPage(0)
    }

    const handleUpdateStatus = (order: SellerOrder) => {
        const next = nextStatus(order.orderStatus)

        if (!next) return

        const ok = window.confirm(
            `Chuyển đơn ${order.orderCode} sang "${statusLabel(next)}"?`
        )

        if (!ok) return

        updateStatusMutation.mutate({
            orderId: order.orderId,
            orderStatus: next,
        })
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý đơn hàng
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Theo dõi và cập nhật trạng thái các đơn hàng thuộc shop của bạn.
                </p>
            </div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleStatusTab(tab.value)}
                            className={[
                                'shrink-0 border-b-2 px-5 py-4 text-sm font-medium',
                                activeStatus === tab.value
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-600 hover:text-orange-600',
                            ].join(' ')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={handleSearch}
                    className="flex items-center gap-3 p-4"
                >
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                        <Search className="h-4 w-4 text-gray-400" />

                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tìm mã đơn, người nhận, SĐT, địa chỉ, tên sản phẩm, SKU..."
                            className="flex-1 text-sm outline-none"
                        />

                        {keyword && (
                            <button
                                type="button"
                                onClick={() => {
                                    setKeyword('')
                                    setKeywordInput('')
                                    setPage(0)
                                }}
                                className="text-xs text-gray-400 hover:text-orange-600"
                            >
                                Xóa
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Tìm
                    </button>
                </form>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải đơn hàng...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải danh sách đơn hàng.
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-300" />

                    <h2 className="mt-4 font-semibold text-gray-800">
                        Chưa có đơn hàng phù hợp
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Khi user đặt mua sản phẩm của shop, đơn hàng sẽ xuất hiện tại đây.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.orderId}
                            order={order}
                            onUpdateStatus={handleUpdateStatus}
                            updating={updateStatusMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: data.totalPages }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setPage(i)}
                            className={[
                                'h-9 w-9 rounded-xl text-sm font-medium',
                                page === i
                                    ? 'bg-orange-500 text-white'
                                    : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                            ].join(' ')}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}