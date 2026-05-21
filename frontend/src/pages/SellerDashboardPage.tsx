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
import { sellerShopApi } from '@/api/sellerShopApi'


function formatRating(value?: number | null) {
    const rating = Number(value ?? 0)

    if (!Number.isFinite(rating) || rating <= 0) {
        return '0.0'
    }

    return rating.toFixed(1)
}

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function formatMoney(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value)
}

function statusLabel(status?: string) {
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

function statusClass(status?: string) {
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

function StatCard({
                      title,
                      value,
                      sub,
                      icon,
                  }: {
    title: string
    value: string
    sub: string
    icon: React.ReactNode
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
    icon: React.ReactNode
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
        data: shop,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerMyShop'],
        queryFn: sellerShopApi.getMyShop,
        retry: false,
        staleTime: 0,
    })

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải dashboard...
            </div>
        )
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải thông tin cửa hàng.
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
                                        statusClass(shop.shopStatus),
                                    ].join(' ')}
                                >
                        {statusLabel(shop.shopStatus)}
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
                        {formatRating(shop.rating)} · {shop.reviewCount ?? 0} đánh giá
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
                    value={formatMoney(0)}
                    sub="Chưa kết nối đơn hàng"
                    icon={<Wallet size={22} />}
                />

                <StatCard
                    title="Đơn chờ xử lý"
                    value="0"
                    sub="Đơn hàng mới"
                    icon={<ShoppingBag size={22} />}
                />

                <StatCard
                    title="Sản phẩm đang bán"
                    value="0"
                    sub="Sẽ cập nhật khi có trang sản phẩm"
                    icon={<Package size={22} />}
                />

                <StatCard
                    title="Đánh giá shop"
                    value={formatRating(shop.rating)}
                    sub={`Từ ${shop.reviewCount ?? 0} đánh giá sản phẩm`}
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
                                Đơn hàng mới nhất
                            </h2>

                            <Link
                                to="/seller/orders"
                                className="text-sm font-medium text-orange-600 hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>

                        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                            <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />

                            <p className="mt-3 text-sm font-medium text-gray-700">
                                Chưa có dữ liệu đơn hàng
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                                Khi có đơn mới, danh sách sẽ hiển thị tại đây.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Việc cần làm
                        </h2>

                        <div className="mt-4 space-y-3">
                            {!shop.bannerUrl && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Cập nhật ảnh bìa shop
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {!shop.avatarUrl && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Cập nhật avatar shop
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            {!shop.description && (
                                <Link
                                    to="/seller/shop/profile"
                                    className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 hover:bg-orange-100"
                                >
                                    Thêm mô tả cửa hàng
                                    <ArrowRight size={16} />
                                </Link>
                            )}

                            <Link
                                to="/seller/products/new"
                                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Đăng sản phẩm đầu tiên
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Sản phẩm cần chú ý
                        </h2>

                        <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-6 text-center">
                            <Package className="mx-auto h-9 w-9 text-gray-300" />

                            <p className="mt-3 text-sm font-medium text-gray-700">
                                Chưa có sản phẩm
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                                Sau khi đăng sản phẩm, các cảnh báo tồn kho sẽ hiển thị ở đây.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}