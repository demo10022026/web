import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowRight,
    BarChart3,
    Eye,
    Loader2,
    Package,
    PlusCircle,
    Settings,
    ShoppingBag,
    Star,
    Store,
    Users,
    Wallet,
} from 'lucide-react'
import { sellerDashboardApi } from '@/api/sellerDashboardApi'

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function formatMoney(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

function shopStatusLabel(status?: string) {
    switch (status) {
        case 'active':
            return 'Đang hoạt động'
        case 'suspended':
            return 'Tạm khóa'
        case 'hidden':
            return 'Đang ẩn'
        default:
            return 'Không rõ'
    }
}

function shopStatusClass(status?: string) {
    switch (status) {
        case 'active':
            return 'border-green-200 bg-green-50 text-green-700'
        case 'suspended':
            return 'border-red-200 bg-red-50 text-red-700'
        case 'hidden':
            return 'border-gray-200 bg-gray-50 text-gray-700'
        default:
            return 'border-gray-200 bg-gray-50 text-gray-600'
    }
}

function productStatusLabel(status?: string) {
    switch (status) {
        case 'active':
            return 'Đang bán'
        case 'draft':
            return 'Nháp'
        case 'inactive':
            return 'Đã ẩn'
        case 'banned':
            return 'Bị khóa'
        default:
            return 'Không rõ'
    }
}

function productStatusClass(status?: string) {
    switch (status) {
        case 'active':
            return 'bg-green-50 text-green-700'
        case 'draft':
            return 'bg-yellow-50 text-yellow-700'
        case 'inactive':
            return 'bg-gray-100 text-gray-600'
        case 'banned':
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

function StatCard({
                      title,
                      value,
                      sub,
                      icon,
                  }: {
    title: string
    value: string
    sub: string
    icon: ReactNode
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">{sub}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function QuickAction({
                         to,
                         icon,
                         title,
                         desc,
                     }: {
    to: string
    icon: ReactNode
    title: string
    desc: string
}) {
    return (
        <Link
            to={to}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                {icon}
            </div>

            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="mt-1 text-sm text-gray-500">{desc}</p>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />
            </div>
        </Link>
    )
}

export default function SellerDashboardPage() {
    const navigate = useNavigate()

    const {
        data: dashboard,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['sellerDashboard'],
        queryFn: sellerDashboardApi.getDashboard,
        retry: false,
        staleTime: 0,
    })

    const status = (error as any)?.response?.status
    const code = (error as any)?.response?.data?.errorCode

    const shop = dashboard?.shop
    const stats = dashboard?.stats
    const tasks = dashboard?.tasks
    const recentProducts = dashboard?.recentProducts ?? []
    const lowStockProducts = dashboard?.lowStockProducts ?? []

    const hasTask =
        !!tasks?.needAvatar ||
        !!tasks?.needBanner ||
        !!tasks?.needDescription ||
        (stats?.totalProducts ?? 0) === 0 ||
        (stats?.lowStockVariants ?? 0) > 0 ||
        (stats?.pendingOrders ?? 0) > 0

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải dashboard...
            </div>
        )
    }

    if (isError && (status === 404 || code === 'SHOP_NOT_FOUND')) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Bạn chưa tạo shop
                    </h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Hồ sơ seller đã được duyệt. Hãy tạo shop để bắt đầu bán hàng.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/seller/shop/setup')}
                        className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Tạo shop ngay
                    </button>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải thông tin dashboard.
                </div>
            </div>
        )
    }

    if (!shop) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Bạn chưa tạo shop
                    </h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Hồ sơ seller đã được duyệt. Hãy tạo shop để bắt đầu bán hàng.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/seller/shop/setup')}
                        className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Tạo shop ngay
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="relative h-44 bg-gradient-to-r from-orange-400 to-orange-600">
                    {shop.bannerUrl && (
                        <img
                            src={shop.bannerUrl}
                            alt={shop.shopName}
                            className="h-full w-full object-cover"
                        />
                    )}

                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="relative flex flex-col gap-5 px-6 pb-6 pt-0 md:flex-row md:items-end md:justify-between">
                    <div className="flex gap-4">
                        <div className="relative z-10 -mt-16 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-orange-50 shadow-lg">
                            {shop.avatarUrl ? (
                                <img
                                    src={shop.avatarUrl}
                                    alt={shop.shopName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Store className="h-10 w-10 text-orange-400" />
                            )}
                        </div>

                        <div className="pt-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {shop.shopName}
                                </h1>

                                <span
                                    className={[
                                        'rounded-full border px-3 py-1 text-xs font-semibold',
                                        shopStatusClass(shop.shopStatus),
                                    ].join(' ')}
                                >
                                    {shopStatusLabel(shop.shopStatus)}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                @{shop.shopSlug}
                            </p>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                                {shop.description || 'Shop chưa có mô tả.'}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    {shop.rating ?? 0}
                                </span>

                                <span className="inline-flex items-center gap-1">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    {shop.followerCount ?? 0} người theo dõi
                                </span>

                                <span>
                                    Tạo ngày {formatDate(shop.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:pb-1">
                        <Link
                            to={`/shops/${shop.shopSlug}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            <Eye size={16} />
                            Xem shop
                        </Link>

                        <Link
                            to="/seller/shop/profile"
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            <Settings size={16} />
                            Chỉnh sửa shop
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Doanh thu hôm nay"
                    value={formatMoney(stats?.todayRevenue ?? 0)}
                    sub="Tính theo đơn hàng hoàn tất"
                    icon={<Wallet size={22} />}
                />

                <StatCard
                    title="Đơn chờ xử lý"
                    value={`${stats?.pendingOrders ?? 0}`}
                    sub="Đơn hàng mới"
                    icon={<ShoppingBag size={22} />}
                />

                <StatCard
                    title="Sản phẩm đang bán"
                    value={`${stats?.activeProducts ?? 0}`}
                    sub={`Tổng ${stats?.totalProducts ?? 0} sản phẩm`}
                    icon={<Package size={22} />}
                />

                <StatCard
                    title="Đã bán"
                    value={`${stats?.totalSold ?? 0}`}
                    sub={`${stats?.lowStockVariants ?? 0} biến thể sắp hết hàng`}
                    icon={<Star size={22} />}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Thao tác nhanh
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <QuickAction
                                to="/seller/products/new"
                                icon={<PlusCircle size={22} />}
                                title="Thêm sản phẩm"
                                desc="Tạo sản phẩm mới cho cửa hàng."
                            />

                            <QuickAction
                                to="/seller/products"
                                icon={<Package size={22} />}
                                title="Quản lý sản phẩm"
                                desc="Xem, sửa, ẩn hoặc cập nhật tồn kho."
                            />

                            <QuickAction
                                to="/seller/orders"
                                icon={<ShoppingBag size={22} />}
                                title="Quản lý đơn hàng"
                                desc="Xem và xử lý đơn hàng của shop."
                            />

                            <QuickAction
                                to="/seller/analytics"
                                icon={<BarChart3 size={22} />}
                                title="Thống kê bán hàng"
                                desc="Theo dõi doanh thu và hiệu suất."
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Sản phẩm mới nhất
                            </h2>

                            <Link
                                to="/seller/products"
                                className="text-sm font-medium text-orange-600 hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>

                        {recentProducts.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                                <Package className="mx-auto h-10 w-10 text-gray-300" />

                                <p className="mt-3 text-sm font-medium text-gray-700">
                                    Chưa có sản phẩm
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                    Sau khi đăng sản phẩm, danh sách sẽ hiển thị tại đây.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentProducts.map((product) => (
                                    <Link
                                        key={product.productId}
                                        to={`/products/${product.productId}`}
                                        className="flex items-center gap-3 py-3 hover:bg-gray-50"
                                    >
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                            {product.thumbnailUrl ? (
                                                <img
                                                    src={product.thumbnailUrl}
                                                    alt={product.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium text-gray-800">
                                                    {product.productName}
                                                </p>

                                                <span
                                                    className={[
                                                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                        productStatusClass(product.productStatus),
                                                    ].join(' ')}
                                                >
                                                    {productStatusLabel(product.productStatus)}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 text-xs text-gray-400">
                                                Đã bán {product.soldCount ?? 0} · Rating {product.averageRating ?? 0}
                                            </p>
                                        </div>

                                        <ArrowRight className="h-4 w-4 text-gray-300" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Việc cần làm
                        </h2>

                        <div className="mt-4 space-y-3">
                            {tasks?.needBanner && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Cập nhật ảnh bìa shop
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {tasks?.needAvatar && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Cập nhật avatar shop
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {tasks?.needDescription && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Thêm mô tả cửa hàng
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {(stats?.totalProducts ?? 0) === 0 && (
                                <Link
                                    to="/seller/products/new"
                                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Đăng sản phẩm đầu tiên
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {(stats?.pendingOrders ?? 0) > 0 && (
                                <Link
                                    to="/seller/orders"
                                    className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 hover:bg-blue-100"
                                >
                                    {stats?.pendingOrders ?? 0} đơn hàng chờ xử lý
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {(stats?.lowStockVariants ?? 0) > 0 && (
                                <Link
                                    to="/seller/products"
                                    className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 hover:bg-red-100"
                                >
                                    {stats?.lowStockVariants ?? 0} biến thể sắp hết hàng
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {!hasTask && (
                                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                                    Cửa hàng hiện không có việc cần xử lý.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Sản phẩm cần chú ý
                        </h2>

                        <div className="mt-4 space-y-3">
                            {lowStockProducts.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                                    <Package className="mx-auto h-9 w-9 text-gray-300" />

                                    <p className="mt-3 text-sm font-medium text-gray-700">
                                        Không có sản phẩm sắp hết hàng
                                    </p>

                                    <p className="mt-1 text-sm text-gray-400">
                                        Các cảnh báo tồn kho sẽ hiển thị tại đây.
                                    </p>
                                </div>
                            ) : (
                                lowStockProducts.map((item) => (
                                    <Link
                                        key={`${item.productId}-${item.variantId}`}
                                        to={`/products/${item.productId}`}
                                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                            {item.thumbnailUrl ? (
                                                <img
                                                    src={item.thumbnailUrl}
                                                    alt={item.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {item.productName}
                                            </p>

                                            <p className="mt-0.5 text-xs text-gray-400">
                                                {item.variantName || item.sku || 'Biến thể'} · còn {item.stockQuantity}
                                            </p>
                                        </div>

                                        <ArrowRight className="h-4 w-4 text-gray-300" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}