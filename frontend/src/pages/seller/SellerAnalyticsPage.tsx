import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock,
    Loader2,
    Package,
    PieChart,
    Receipt,
    ShoppingBag,
    Star,
    TrendingUp,
} from 'lucide-react'
import {
    sellerAnalyticsApi,
    type SellerAnalytics,
    type SellerDailyRevenue,
    type SellerRecentOrder,
    type SellerStatusStat,
    type SellerTopProduct,
} from '@/api/sellerAnalyticsApi'

function toDateInputValue(date: Date) {
    return date.toISOString().slice(0, 10)
}

function daysAgo(days: number) {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return toDateInputValue(date)
}

function today() {
    return toDateInputValue(new Date())
}

function formatMoney(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

function formatNumber(value?: number | null) {
    return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

function formatPercent(value?: number | null) {
    return `${Number(value ?? 0).toFixed(2)}%`
}

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function formatDateTime(value?: string | null) {
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

function MetricCard({
    title,
    value,
    sub,
    icon,
    tone = 'default',
}: {
    title: string
    value: string
    sub?: string
    icon: React.ReactNode
    tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
    const toneClass = {
        default: 'bg-gray-50 text-gray-600',
        good: 'bg-green-50 text-green-600',
        warn: 'bg-yellow-50 text-yellow-700',
        bad: 'bg-red-50 text-red-600',
    }[tone]

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {value}
                    </p>

                    {sub && (
                        <p className="mt-1 text-xs text-gray-400">{sub}</p>
                    )}
                </div>

                <div
                    className={[
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        toneClass,
                    ].join(' ')}
                >
                    {icon}
                </div>
            </div>
        </div>
    )
}

function RevenueChart({ data }: { data: SellerDailyRevenue[] }) {
    const maxRevenue = Math.max(...data.map((item) => item.revenue), 1)

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Doanh thu theo ngày
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                        Chỉ tính đơn đã hoàn thành.
                    </p>
                </div>

                <BarChart3 className="h-5 w-5 text-orange-500" />
            </div>

            {data.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-gray-400">
                    Chưa có dữ liệu doanh thu.
                </div>
            ) : (
                <div className="flex h-72 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-2">
                    {data.map((item) => {
                        const height = Math.max(
                            8,
                            Math.round((item.revenue / maxRevenue) * 220)
                        )

                        return (
                            <div
                                key={item.date}
                                className="flex min-w-[34px] flex-col items-center justify-end gap-2"
                                title={`${formatDate(item.date)}: ${formatMoney(item.revenue)}`}
                            >
                                <div className="text-[10px] text-gray-400">
                                    {item.orderCount}
                                </div>

                                <div
                                    className="w-5 rounded-t-lg bg-orange-400 transition hover:bg-orange-500"
                                    style={{
                                        height,
                                    }}
                                />

                                <div className="whitespace-nowrap text-[10px] text-gray-400">
                                    {new Date(item.date).getDate()}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function StatusDistribution({ stats }: { stats: SellerStatusStat[] }) {
    const total = stats.reduce((sum, item) => sum + item.orderCount, 0)

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Hiệu suất xử lý đơn
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                        Phân bổ đơn hàng theo trạng thái.
                    </p>
                </div>

                <PieChart className="h-5 w-5 text-orange-500" />
            </div>

            <div className="space-y-3">
                {stats.map((item) => {
                    const percent = total
                        ? Math.round((item.orderCount / total) * 100)
                        : 0

                    return (
                        <div key={item.status}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {item.label}
                                </span>

                                <span className="font-medium text-gray-900">
                                    {item.orderCount} đơn
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-orange-400"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="mt-1 text-xs text-gray-400">
                                {formatMoney(item.revenue)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function TopProductsTable({ products }: { products: SellerTopProduct[] }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Sản phẩm hiệu quả nhất
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                        Xếp theo doanh thu đơn hoàn thành.
                    </p>
                </div>

                <Star className="h-5 w-5 text-orange-500" />
            </div>

            {products.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Chưa có sản phẩm phát sinh doanh thu.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                                <th className="pb-3 font-medium">Sản phẩm</th>
                                <th className="pb-3 text-right font-medium">
                                    Đã bán
                                </th>
                                <th className="pb-3 text-right font-medium">
                                    Đơn
                                </th>
                                <th className="pb-3 text-right font-medium">
                                    Doanh thu
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <tr key={product.productId}>
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/products/${product.productId}`}
                                                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                                            >
                                                {product.thumbnailUrl ? (
                                                    <img
                                                        src={product.thumbnailUrl}
                                                        alt={product.productName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <Package className="h-5 w-5 text-gray-300" />
                                                    </div>
                                                )}
                                            </Link>

                                            <Link
                                                to={`/products/${product.productId}`}
                                                className="line-clamp-2 font-medium text-gray-800 hover:text-orange-600"
                                            >
                                                {product.productName}
                                            </Link>
                                        </div>
                                    </td>

                                    <td className="py-3 text-right text-gray-700">
                                        {formatNumber(product.quantitySold)}
                                    </td>

                                    <td className="py-3 text-right text-gray-700">
                                        {formatNumber(product.orderCount)}
                                    </td>

                                    <td className="py-3 text-right font-semibold text-orange-600">
                                        {formatMoney(product.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function RecentOrdersTable({ orders }: { orders: SellerRecentOrder[] }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Đơn gần đây
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                        Các đơn có sản phẩm thuộc shop.
                    </p>
                </div>

                <Link
                    to="/seller/orders"
                    className="text-sm font-medium text-orange-600 hover:underline"
                >
                    Xem tất cả
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                    Chưa có đơn gần đây.
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div
                            key={order.orderId}
                            className="rounded-2xl border border-gray-100 p-4"
                        >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
                                        {formatDateTime(order.createdAt)}
                                    </p>
                                </div>

                                <div className="text-left md:text-right">
                                    <p className="text-sm font-semibold text-orange-600">
                                        {formatMoney(order.shopSubtotalAmount)}
                                    </p>

                                    <p className="text-xs text-gray-400">
                                        {order.receiverName || order.customerName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function AnalyticsContent({ analytics }: { analytics: SellerAnalytics }) {
    const summary = analytics.summary

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Doanh thu hoàn thành"
                    value={formatMoney(summary.revenue)}
                    sub={`${formatNumber(summary.deliveredOrderCount)} đơn hoàn thành`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    tone="good"
                />

                <MetricCard
                    title="Doanh thu đang xử lý"
                    value={formatMoney(summary.pendingRevenue)}
                    sub={`${formatNumber(summary.pendingOrderCount)} đơn chưa hoàn tất`}
                    icon={<Clock className="h-5 w-5" />}
                    tone="warn"
                />

                <MetricCard
                    title="Sản phẩm đã bán"
                    value={formatNumber(summary.soldQuantity)}
                    sub={`AOV: ${formatMoney(summary.averageOrderValue)}`}
                    icon={<ShoppingBag className="h-5 w-5" />}
                />

                <MetricCard
                    title="Tỷ lệ hoàn thành"
                    value={formatPercent(summary.completionRate)}
                    sub={`Hủy: ${formatPercent(summary.cancellationRate)} · Trả: ${formatPercent(summary.returnRate)}`}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    tone="good"
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <RevenueChart data={analytics.dailyRevenue} />
                <StatusDistribution stats={analytics.statusStats} />
            </div>

            <TopProductsTable products={analytics.topProducts} />

            <RecentOrdersTable orders={analytics.recentOrders} />
        </div>
    )
}

export default function SellerAnalyticsPage() {
    const [fromDate, setFromDate] = useState(daysAgo(29))
    const [toDate, setToDate] = useState(today())
    const [appliedRange, setAppliedRange] = useState({
        fromDate: daysAgo(29),
        toDate: today(),
    })

    const {
        data: analytics,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [
            'sellerAnalytics',
            appliedRange.fromDate,
            appliedRange.toDate,
        ],
        queryFn: () =>
            sellerAnalyticsApi.getMyShopAnalytics({
                fromDate: appliedRange.fromDate,
                toDate: appliedRange.toDate,
            }),
        staleTime: 0,
    })

    const rangeLabel = useMemo(() => {
        return `${formatDate(appliedRange.fromDate)} - ${formatDate(appliedRange.toDate)}`
    }, [appliedRange])

    const applyPreset = (days: number) => {
        const nextFrom = daysAgo(days - 1)
        const nextTo = today()

        setFromDate(nextFrom)
        setToDate(nextTo)
        setAppliedRange({
            fromDate: nextFrom,
            toDate: nextTo,
        })
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (fromDate > toDate) {
            return
        }

        setAppliedRange({
            fromDate,
            toDate,
        })
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Doanh thu & hiệu suất
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Theo dõi doanh thu, tốc độ xử lý đơn và sản phẩm bán tốt.
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Khoảng dữ liệu: {rangeLabel}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => applyPreset(7)}
                                className="rounded-xl border px-3 py-2 text-sm text-gray-600 hover:border-orange-300 hover:text-orange-600"
                            >
                                7 ngày
                            </button>

                            <button
                                type="button"
                                onClick={() => applyPreset(30)}
                                className="rounded-xl border px-3 py-2 text-sm text-gray-600 hover:border-orange-300 hover:text-orange-600"
                            >
                                30 ngày
                            </button>

                            <button
                                type="button"
                                onClick={() => applyPreset(90)}
                                className="rounded-xl border px-3 py-2 text-sm text-gray-600 hover:border-orange-300 hover:text-orange-600"
                            >
                                90 ngày
                            </button>
                        </div>

                        <div className="hidden h-8 w-px bg-gray-100 md:block" />

                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-400" />

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                            />

                            <span className="text-gray-400">-</span>

                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                            />

                            <button
                                type="submit"
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>

                    {fromDate > toDate && (
                        <p className="mt-2 text-xs text-red-500">
                            Ngày bắt đầu không được lớn hơn ngày kết thúc.
                        </p>
                    )}
                </form>
            </div>

            {isLoading ? (
                <div className="flex min-h-[420px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải thống kê...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải dữ liệu thống kê.
                </div>
            ) : analytics ? (
                <AnalyticsContent analytics={analytics} />
            ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <Receipt className="mx-auto h-12 w-12 text-gray-300" />

                    <h2 className="mt-4 font-semibold text-gray-800">
                        Chưa có dữ liệu thống kê
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Khi có đơn hàng phát sinh, dữ liệu sẽ được hiển thị tại đây.
                    </p>
                </div>
            )}

        </div>
    )
}
