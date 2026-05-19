import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Users,
    Store,
    ShoppingBag,
    CreditCard,
    Clock,
    CheckCircle,
    TrendingUp,
    ChevronRight,
    Eye,
    Loader2,
    Package,
} from 'lucide-react'

import StatCard from '@/components/admin/StatCard'
import { adminDashboardApi } from '@/api/admin/dashboardApi'

// ─────────────────────────────────────────────
// Badge trạng thái
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-600',
        suspended: 'bg-gray-100 text-gray-600',
    }

    const label: Record<string, string> = {
        pending: 'Chờ duyệt',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
        suspended: 'Tạm khóa',
    }

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                cfg[status] ?? 'bg-gray-100 text-gray-500'
            }`}
        >
      {label[status] ?? status}
    </span>
    )
}

export default function AdminDashboardPage() {

    // ─────────────────────────────────────────────
    // Query dashboard
    // ─────────────────────────────────────────────
    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: adminDashboardApi.getDashboard,
    })

    // ─────────────────────────────────────────────
    // Safe data
    // ─────────────────────────────────────────────
    const pendingCount =
        data?.pendingSellerCount ?? 0

    const totalSellers =
        data?.totalSellers ?? 0

    const approvedCount =
        totalSellers - pendingCount

    const recentPendingSellers =
        data?.recentPendingSellers ?? []

    // ─────────────────────────────────────────────
    // Stats
    // ─────────────────────────────────────────────
    const STATS = [
        {
            title: 'Tổng Seller',
            value: totalSellers,
            subtitle: 'Đã đăng ký',
            icon: Store,
            color: 'violet' as const,
        },
        {
            title: 'Chờ xét duyệt',
            value: pendingCount,
            subtitle: 'Cần xử lý',
            icon: Clock,
            color: 'orange' as const,
        },
        {
            title: 'Đã duyệt',
            value: approvedCount,
            subtitle: 'Đang hoạt động',
            icon: CheckCircle,
            color: 'green' as const,
        },
        {
            title: 'Người dùng',
            value: data?.totalUsers ?? 0,
            subtitle: 'Tổng tài khoản',
            icon: Users,
            color: 'blue' as const,
        },
        {
            title: 'Sản phẩm',
            value: data?.totalProducts ?? 0,
            subtitle: 'Đang bán',
            icon: ShoppingBag,
            color: 'violet' as const,
        },
        {
            title: 'Đơn hàng',
            value: data?.totalOrders ?? 0,
            subtitle: 'Tổng đơn',
            icon: Package,
            color: 'blue' as const,
        },
        {
            title: 'Doanh thu',
            value:
                Number(data?.totalRevenue ?? 0).toLocaleString('vi-VN') + ' ₫',
            subtitle: 'Toàn hệ thống',
            icon: CreditCard,
            color: 'green' as const,
        },
    ]

    // ─────────────────────────────────────────────
    // Error state
    // ─────────────────────────────────────────────
    if (isError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
                    Không thể tải dashboard
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Tổng quan hệ thống ShopVN
                    </p>
                </div>

                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {STATS.map(stat => (
                    <StatCard
                        key={stat.title}
                        {...stat}
                    />
                ))}
            </div>

            {/* Pending sellers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />

                        <h2 className="font-semibold text-gray-800">
                            Hồ sơ chờ xét duyệt
                        </h2>

                        {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {pendingCount}
              </span>
                        )}
                    </div>

                    <Link
                        to="/admin/sellers?status=pending"
                        className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
                    >
                        Xem tất cả
                        <ChevronRight size={14} />
                    </Link>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                ) : recentPendingSellers.length > 0 ? (

                    // Table
                    <div className="overflow-x-auto">
                        <table className="w-full">

                            <thead>
                            <tr className="bg-gray-50 text-left">

                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                    Người dùng
                                </th>

                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                    CCCD / CMND
                                </th>

                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                    Giấy tờ
                                </th>

                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                    Ngày nộp
                                </th>

                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                                    Trạng thái
                                </th>

                                <th className="px-6 py-3" />
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">

                            {recentPendingSellers.map((seller: any) => (

                                <tr
                                    key={seller.sellerId}
                                    className="hover:bg-gray-50 transition-colors"
                                >

                                    {/* User */}
                                    <td className="px-6 py-4">

                                        <div className="flex items-center gap-3">

                                            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                                                {seller.fullName?.charAt(0)?.toUpperCase()}
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {seller.fullName}
                                                </p>

                                                <p className="text-xs text-gray-400">
                                                    {seller.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Identity */}
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {seller.identityNumber ?? '—'}
                                    </td>

                                    {/* Docs */}
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                        {seller.documentCount ?? 0} file
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {seller.createdAt
                                            ? new Date(seller.createdAt)
                                                .toLocaleDateString('vi-VN')
                                            : '—'}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <StatusBadge status="pending" />
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/admin/sellers/${seller.sellerId}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 hover:text-violet-700 text-xs font-semibold transition-colors"
                                        >
                                            <Eye size={12} />
                                            Xem xét
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                ) : (

                    // Empty
                    <div className="text-center py-16">

                        <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-3" />

                        <p className="font-medium text-gray-500">
                            Không có hồ sơ nào chờ duyệt
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                            Tất cả hồ sơ đã được xử lý
                        </p>
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {[
                    {
                        to: '/admin/sellers',
                        label: 'Quản lý Seller',
                        icon: Store,
                        color: 'text-violet-600 bg-violet-50',
                    },
                    {
                        to: '/admin/users',
                        label: 'Người dùng',
                        icon: Users,
                        color: 'text-blue-600 bg-blue-50',
                    },
                    {
                        to: '/admin/reports',
                        label: 'Báo cáo',
                        icon: TrendingUp,
                        color: 'text-emerald-600 bg-emerald-50',
                    },
                ].map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 group"
                    >

                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}
                        >
                            <item.icon size={20} />
                        </div>

                        <span className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
              {item.label}
            </span>

                        <ChevronRight
                            size={16}
                            className="ml-auto text-gray-300 group-hover:text-violet-400 transition-colors"
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}