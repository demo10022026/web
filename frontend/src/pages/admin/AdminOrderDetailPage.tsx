import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Loader2,
    MapPin,
    Package,
    Phone,
    Save,
    Store,
    Truck,
    User,
} from 'lucide-react'
import {
    adminOrderApi,
    type AdminOrder,
    type AdminOrderStatus,
} from '@/api/admin/adminOrderApi'

const ORDER_STATUS_OPTIONS: Array<{
    label: string
    value: AdminOrderStatus
}> = [
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

function InfoCard({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon: typeof User
    children: ReactNode
}) {
    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                <Icon className="h-5 w-5 text-orange-500" />
                {title}
            </h2>

            {children}
        </section>
    )
}

function OrderItems({ order }: { order: AdminOrder }) {
    return (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Package className="h-5 w-5 text-orange-500" />
                    Sản phẩm trong đơn
                </h2>
            </div>

            <div className="divide-y divide-gray-100">
                {order.shops.map((shop) => (
                    <div key={shop.shopId ?? shop.shopName} className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-gray-800">
                                <Store className="h-4 w-4 text-gray-400" />
                                {shop.shopSlug ? (
                                    <Link
                                        to={`/shops/${shop.shopSlug}`}
                                        className="hover:text-orange-600"
                                    >
                                        {shop.shopName || 'Shop'}
                                    </Link>
                                ) : (
                                    <span>{shop.shopName || 'Shop'}</span>
                                )}
                            </div>

                            <p className="text-sm font-semibold text-orange-600">
                                {formatMoney(shop.shopSubtotal)}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {shop.items.map((item) => (
                                <div key={item.orderItemId} className="flex gap-3">
                                    <Link
                                        to={`/products/${item.productId}`}
                                        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
                                    >
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={item.productName || ''}
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
                                            {item.productName || 'Sản phẩm'}
                                        </Link>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Phân loại:{' '}
                                            {item.variantName || item.sku || 'Mặc định'}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
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
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default function AdminOrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const numericOrderId = Number(orderId)

    const [orderStatus, setOrderStatus] = useState<AdminOrderStatus>('pending')
    const [trackingCode, setTrackingCode] = useState('')
    const [ghnOrderCode, setGhnOrderCode] = useState('')

    const {
        data: order,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminOrderDetail', numericOrderId],
        queryFn: () => adminOrderApi.getOrderDetail(numericOrderId),
        enabled: Number.isFinite(numericOrderId),
        staleTime: 0,
    })

    useEffect(() => {
        if (!order) return

        setOrderStatus(order.orderStatus)
        setTrackingCode(order.trackingCode ?? '')
        setGhnOrderCode(order.ghnOrderCode ?? '')
    }, [order])

    const updateStatusMutation = useMutation({
        mutationFn: () =>
            adminOrderApi.updateOrderStatus(numericOrderId, {
                orderStatus,
                trackingCode: trackingCode.trim() || null,
                ghnOrderCode: ghnOrderCode.trim() || null,
            }),
        onSuccess: (data) => {
            toast.success('Đã cập nhật đơn hàng')
            queryClient.setQueryData(['adminOrderDetail', numericOrderId], data)
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] })
            queryClient.invalidateQueries({ queryKey: ['adminOrderStats'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật đơn hàng'
            )
        },
    })

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        updateStatusMutation.mutate()
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải đơn hàng...
            </div>
        )
    }

    if (isError || !order) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                Không thể tải chi tiết đơn hàng.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600"
                    >
                        <ArrowLeft size={16} />
                        Quay lại
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {order.orderCode}
                        </h1>

                        <span
                            className={[
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                statusClass(order.orderStatus),
                            ].join(' ')}
                        >
                            {statusLabel(order.orderStatus)}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Đặt lúc {formatDate(order.createdAt)}
                    </p>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500">Tổng thanh toán</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {formatMoney(order.totalAmount)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <InfoCard title="Khách hàng" icon={User}>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-gray-900">
                                    {order.customerName || 'Không rõ'}
                                </p>
                                <p className="text-gray-500">
                                    {order.customerEmail || 'Không có email'}
                                </p>
                                <p className="text-gray-500">
                                    {order.customerPhone || 'Không có SĐT'}
                                </p>
                                {order.customerId && (
                                    <Link
                                        to={`/admin/users/${order.customerId}`}
                                        className="inline-block text-orange-600 hover:underline"
                                    >
                                        Xem hồ sơ người dùng
                                    </Link>
                                )}
                            </div>
                        </InfoCard>

                        <InfoCard title="Người nhận" icon={MapPin}>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-gray-900">
                                    {order.receiverName}
                                </p>
                                <p className="flex items-center gap-1 text-gray-500">
                                    <Phone size={14} />
                                    {order.receiverPhone}
                                </p>
                                <p className="text-gray-500">
                                    {order.fullShippingAddress}
                                </p>
                            </div>
                        </InfoCard>
                    </div>

                    <OrderItems order={order} />
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <Truck className="h-5 w-5 text-orange-500" />
                            Xử lý đơn hàng
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Trạng thái đơn
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) =>
                                        setOrderStatus(e.target.value as AdminOrderStatus)
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                >
                                    {ORDER_STATUS_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Mã vận đơn
                                </label>
                                <input
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    placeholder="Nhập mã vận đơn"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updateStatusMutation.isPending}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {updateStatusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Lưu thay đổi
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold text-gray-900">
                            Thanh toán
                        </h2>

                        {order.payment ? (
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    Phương thức:{' '}
                                    <span className="font-medium text-gray-900">
                                        {order.payment.paymentMethod || '-'}
                                    </span>
                                </p>
                                <p>
                                    Trạng thái:{' '}
                                    <span className="font-medium text-gray-900">
                                        {order.payment.paymentStatus || '-'}
                                    </span>
                                </p>
                                <p>
                                    Mã giao dịch:{' '}
                                    <span className="font-medium text-gray-900">
                                        {order.payment.transactionCode || '-'}
                                    </span>
                                </p>
                                <p>
                                    Thanh toán lúc:{' '}
                                    <span className="font-medium text-gray-900">
                                        {formatDate(order.payment.paidAt)}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Chưa có bản ghi thanh toán. Với COD, trạng thái có thể được cập nhật sau khi giao hàng.
                            </p>
                        )}
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold text-gray-900">
                            Tổng kết tiền
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Tạm tính</span>
                                <span>{formatMoney(order.subtotalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Phí vận chuyển</span>
                                <span>{formatMoney(order.shippingFee)}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-2" />
                            <div className="flex justify-between font-semibold text-gray-900">
                                <span>Tổng cộng</span>
                                <span className="text-orange-600">
                                    {formatMoney(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
