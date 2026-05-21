import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Loader2,
    Package,
    Search,
    ShoppingBag,
    Truck,
    CheckCircle2,
    XCircle,
    RotateCcw,
} from 'lucide-react'
import {
    adminOrderApi,
    type AdminOrder,
    type AdminOrderStatus,
} from '@/api/admin/adminOrderApi'

const STATUS_TABS: Array<{
    label: string
    value: 'all' | AdminOrderStatus
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

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: number
    icon: typeof ShoppingBag
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <Icon size={22} />
                </div>
            </div>
        </div>
    )
}

function OrderRow({ order }: { order: AdminOrder }) {
    const firstItem = order.items?.[0]

    return (
        <tr className="border-b border-gray-100 align-top hover:bg-gray-50/60">
            <td className="px-4 py-4">
                <Link
                    to={`/admin/orders/${order.orderId}`}
                    className="font-semibold text-gray-900 hover:text-orange-600"
                >
                    {order.orderCode}
                </Link>
                <p className="mt-1 text-xs text-gray-400">
                    {formatDate(order.createdAt)}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="font-medium text-gray-800">
                    {order.customerName || 'Không rõ'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    {order.customerEmail || order.customerPhone || '-'}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="font-medium text-gray-800">
                    {order.receiverName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    {order.receiverPhone}
                </p>
                <p className="mt-1 line-clamp-2 max-w-xs text-xs text-gray-400">
                    {order.fullShippingAddress}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="line-clamp-2 text-sm text-gray-800">
                    {firstItem?.productName || '-'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    {order.items?.length || 0} sản phẩm ·{' '}
                    {order.shops?.length || 0} shop
                </p>
            </td>

            <td className="px-4 py-4">
                <span
                    className={[
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        statusClass(order.orderStatus),
                    ].join(' ')}
                >
                    {statusLabel(order.orderStatus)}
                </span>
            </td>

            <td className="px-4 py-4 text-right">
                <p className="font-semibold text-orange-600">
                    {formatMoney(order.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Ship {formatMoney(order.shippingFee)}
                </p>
            </td>

            <td className="px-4 py-4 text-right">
                <Link
                    to={`/admin/orders/${order.orderId}`}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-orange-600"
                >
                    Chi tiết
                </Link>
            </td>
        </tr>
    )
}

export default function AdminOrdersPage() {
    const [status, setStatus] = useState<'all' | AdminOrderStatus>('all')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [page, setPage] = useState(0)

    const statsQuery = useQuery({
        queryKey: ['adminOrderStats'],
        queryFn: adminOrderApi.getStats,
        staleTime: 0,
    })

    const ordersQuery = useQuery({
        queryKey: ['adminOrders', status, keyword, page],
        queryFn: () =>
            adminOrderApi.getOrders({
                status,
                keyword: keyword || undefined,
                page,
                size: 10,
            }),
        staleTime: 0,
    })

    const orders = ordersQuery.data?.content ?? []
    const stats = statsQuery.data

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleStatus = (nextStatus: 'all' | AdminOrderStatus) => {
        setStatus(nextStatus)
        setPage(0)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý đơn hàng
                    </h1>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <StatCard
                    label="Tổng đơn"
                    value={stats?.totalOrders ?? 0}
                    icon={ShoppingBag}
                />
                <StatCard
                    label="Chờ xác nhận"
                    value={stats?.pendingOrders ?? 0}
                    icon={Package}
                />
                <StatCard
                    label="Đang giao"
                    value={stats?.shippingOrders ?? 0}
                    icon={Truck}
                />
                <StatCard
                    label="Hoàn thành"
                    value={stats?.deliveredOrders ?? 0}
                    icon={CheckCircle2}
                />
                <StatCard
                    label="Đã hủy"
                    value={stats?.cancelledOrders ?? 0}
                    icon={XCircle}
                />
                <StatCard
                    label="Trả hàng"
                    value={stats?.returnedOrders ?? 0}
                    icon={RotateCcw}
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleStatus(tab.value)}
                            className={[
                                'shrink-0 border-b-2 px-5 py-4 text-sm font-medium',
                                status === tab.value
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-600 hover:text-orange-600',
                            ].join(' ')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 p-4">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tìm mã đơn, email, SĐT, người nhận, shop, sản phẩm, mã vận đơn..."
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

                {ordersQuery.isLoading ? (
                    <div className="flex min-h-[300px] items-center justify-center text-gray-500">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tải đơn hàng...
                    </div>
                ) : ordersQuery.isError ? (
                    <div className="m-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                        Không thể tải danh sách đơn hàng.
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center">
                        <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                        <h2 className="mt-4 font-semibold text-gray-800">
                            Không có đơn hàng phù hợp
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Đơn hàng mới sẽ hiển thị tại đây sau khi user thanh toán.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Đơn</th>
                                    <th className="px-4 py-3">Khách hàng</th>
                                    <th className="px-4 py-3">Người nhận</th>
                                    <th className="px-4 py-3">Sản phẩm</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                                    <th className="px-4 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderRow key={order.orderId} order={order} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {ordersQuery.data && ordersQuery.data.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: ordersQuery.data.totalPages }).map(
                        (_, i) => (
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
                        )
                    )}
                </div>
            )}
        </div>
    )
}
