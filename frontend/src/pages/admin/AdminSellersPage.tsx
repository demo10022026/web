import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Ban,
    CheckCircle2,
    Eye,
    Loader2,
    RotateCcw,
    Search,
    ShieldAlert,
    Store,
    UserCheck,
    UserX,
    XCircle,
} from 'lucide-react'
import {
    adminSellerApi,
    type AdminSellerItem,
    type SellerListStatus,
    type SellerVerifyStatus,
} from '@/api/admin/adminSellerApi'

const STATUS_TABS: Array<{
    label: string
    value: SellerListStatus
}> = [
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đang hoạt động', value: 'approved' },
    { label: 'Bị từ chối', value: 'rejected' },
    { label: 'Tạm khóa', value: 'suspended' },
    { label: 'Tất cả', value: 'all' },
]

function statusLabel(status?: SellerVerifyStatus | string | null) {
    switch (status) {
        case 'pending':
            return 'Chờ duyệt'
        case 'approved':
            return 'Hoạt động'
        case 'rejected':
            return 'Từ chối'
        case 'suspended':
            return 'Tạm khóa'
        default:
            return 'Không rõ'
    }
}

function statusClass(status?: SellerVerifyStatus | string | null) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-50 text-yellow-700'
        case 'approved':
            return 'bg-green-50 text-green-700'
        case 'rejected':
            return 'bg-red-50 text-red-700'
        case 'suspended':
            return 'bg-gray-100 text-gray-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function shopStatusLabel(status?: string | null) {
    switch (status) {
        case 'active':
            return 'Shop hoạt động'
        case 'suspended':
            return 'Shop tạm khóa'
        case 'hidden':
            return 'Shop ẩn'
        default:
            return 'Chưa tạo shop'
    }
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

function StatCard({
    label,
    value,
    icon,
}: {
    label: string
    value: number
    icon: React.ReactNode
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function SellerTable({
    sellers,
    activeStatus,
    onApprove,
    onReject,
    onSuspend,
    onReactivate,
    pendingAction,
}: {
    sellers: AdminSellerItem[]
    activeStatus: SellerListStatus
    onApprove: (seller: AdminSellerItem) => void
    onReject: (seller: AdminSellerItem) => void
    onSuspend: (seller: AdminSellerItem) => void
    onReactivate: (seller: AdminSellerItem) => void
    pendingAction: boolean
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Seller</th>
                            <th className="px-4 py-3 font-medium">Shop</th>
                            <th className="px-4 py-3 font-medium">Trạng thái</th>
                            <th className="px-4 py-3 font-medium">Giấy tờ</th>
                            <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
                            <th className="px-4 py-3 text-right font-medium">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {sellers.map((seller) => (
                            <tr key={seller.sellerId} className="align-top">
                                <td className="px-4 py-4">
                                    <div className="font-semibold text-gray-900">
                                        {seller.fullName || seller.username}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {seller.email}
                                    </div>
                                    <div className="mt-0.5 text-xs text-gray-400">
                                        {seller.phoneNumber || 'Chưa có SĐT'}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        CCCD/MST:{' '}
                                        {seller.identityNumber || '-'} /{' '}
                                        {seller.taxCode || '-'}
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    {seller.shop ? (
                                        <div>
                                            <Link
                                                to={`/shops/${
                                                    seller.shop.shopSlug ||
                                                    seller.shop.shopId
                                                }`}
                                                className="font-medium text-orange-600 hover:underline"
                                            >
                                                {seller.shop.shopName}
                                            </Link>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {shopStatusLabel(
                                                    seller.shop.shopStatus
                                                )}
                                            </div>
                                            <div className="mt-0.5 text-xs text-gray-400">
                                                Rating:{' '}
                                                {seller.shop.rating ?? 0} · Theo
                                                dõi:{' '}
                                                {seller.shop.followerCount ?? 0}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            Chưa tạo shop
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={[
                                            'rounded-full px-2.5 py-1 text-xs font-medium',
                                            statusClass(
                                                seller.verificationStatus
                                            ),
                                        ].join(' ')}
                                    >
                                        {statusLabel(
                                            seller.verificationStatus
                                        )}
                                    </span>

                                    {seller.rejectionReason && (
                                        <p className="mt-2 max-w-[240px] text-xs text-red-500">
                                            {seller.rejectionReason}
                                        </p>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="text-xs text-gray-600">
                                        {seller.documents?.length ?? 0} tài liệu
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">
                                        {seller.documents
                                            ?.map((doc) => doc.documentType)
                                            .slice(0, 3)
                                            .join(', ') || '-'}
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-xs text-gray-500">
                                    {formatDate(seller.createdAt)}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Link
                                            to={`/admin/sellers/${seller.sellerId}`}
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Eye size={14} />
                                            Chi tiết
                                        </Link>

                                        {seller.verificationStatus ===
                                            'pending' && (
                                            <>
                                                <button
                                                    type="button"
                                                    disabled={pendingAction}
                                                    onClick={() =>
                                                        onApprove(seller)
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Duyệt
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={pendingAction}
                                                    onClick={() =>
                                                        onReject(seller)
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
                                                >
                                                    <XCircle size={14} />
                                                    Từ chối
                                                </button>
                                            </>
                                        )}

                                        {seller.verificationStatus ===
                                            'approved' && (
                                            <button
                                                type="button"
                                                disabled={pendingAction}
                                                onClick={() =>
                                                    onSuspend(seller)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                                            >
                                                <Ban size={14} />
                                                Tạm khóa
                                            </button>
                                        )}

                                        {seller.verificationStatus ===
                                            'suspended' && (
                                            <button
                                                type="button"
                                                disabled={pendingAction}
                                                onClick={() =>
                                                    onReactivate(seller)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                                            >
                                                <RotateCcw size={14} />
                                                Mở lại
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {sellers.length === 0 && (
                <div className="p-10 text-center text-sm text-gray-500">
                    Không có seller phù hợp với bộ lọc hiện tại.
                </div>
            )}

            {activeStatus === 'approved' && sellers.length > 0 && (
                <div className="border-t border-gray-100 bg-green-50 px-4 py-3 text-xs text-green-700">
                    Danh sách các seller đang hoạt động.
                </div>
            )}
        </div>
    )
}

export default function AdminSellersPage() {
    const queryClient = useQueryClient()

    const [activeStatus, setActiveStatus] =
        useState<SellerListStatus>('pending')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [page, setPage] = useState(0)
    const [rejectingSeller, setRejectingSeller] =
        useState<AdminSellerItem | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    const statsQuery = useQuery({
        queryKey: ['adminSellerStats'],
        queryFn: adminSellerApi.getStats,
        staleTime: 0,
    })

    const sellersQuery = useQuery({
        queryKey: ['adminSellers', activeStatus, keyword, page],
        queryFn: () =>
            adminSellerApi.list({
                status: activeStatus,
                keyword,
                page,
                size: 20,
            }),
        staleTime: 0,
    })

    const reviewMutation = useMutation({
        mutationFn: ({
            sellerId,
            approved,
            rejectionReason,
        }: {
            sellerId: number
            approved: boolean
            rejectionReason?: string
        }) =>
            adminSellerApi.review(
                sellerId,
                approved,
                rejectionReason
            ),
        onSuccess: () => {
            toast.success('Đã cập nhật hồ sơ seller')
            setRejectingSeller(null)
            setRejectReason('')
            invalidateSellerQueries()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật hồ sơ seller'
            )
        },
    })

    const suspendMutation = useMutation({
        mutationFn: ({
            sellerId,
            reason,
        }: {
            sellerId: number
            reason?: string
        }) => adminSellerApi.suspend(sellerId, reason),
        onSuccess: () => {
            toast.success('Đã tạm khóa seller')
            invalidateSellerQueries()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể tạm khóa seller'
            )
        },
    })

    const reactivateMutation = useMutation({
        mutationFn: adminSellerApi.reactivate,
        onSuccess: () => {
            toast.success('Đã kích hoạt lại seller')
            invalidateSellerQueries()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể kích hoạt seller'
            )
        },
    })

    const invalidateSellerQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['adminSellers'] })
        queryClient.invalidateQueries({ queryKey: ['adminSellerStats'] })
        queryClient.invalidateQueries({ queryKey: ['adminSellerDetail'] })
    }

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleTab = (status: SellerListStatus) => {
        setActiveStatus(status)
        setPage(0)
    }

    const handleApprove = (seller: AdminSellerItem) => {
        const ok = window.confirm(
            `Duyệt seller "${seller.fullName || seller.email}"?`
        )

        if (!ok) return

        reviewMutation.mutate({
            sellerId: seller.sellerId,
            approved: true,
        })
    }

    const handleRejectSubmit = () => {
        if (!rejectingSeller) return

        if (!rejectReason.trim()) {
            toast.error('Nhập lý do từ chối')
            return
        }

        reviewMutation.mutate({
            sellerId: rejectingSeller.sellerId,
            approved: false,
            rejectionReason: rejectReason.trim(),
        })
    }

    const handleSuspend = (seller: AdminSellerItem) => {
        const reason = window.prompt(
            `Lý do tạm khóa seller "${seller.fullName || seller.email}"`,
            'Vi phạm chính sách bán hàng'
        )

        if (reason === null) return

        suspendMutation.mutate({
            sellerId: seller.sellerId,
            reason: reason.trim() || undefined,
        })
    }

    const handleReactivate = (seller: AdminSellerItem) => {
        const ok = window.confirm(
            `Mở lại seller "${seller.fullName || seller.email}"?`
        )

        if (!ok) return

        reactivateMutation.mutate(seller.sellerId)
    }

    const sellers = sellersQuery.data?.content ?? []
    const stats = statsQuery.data
    const totalPages = sellersQuery.data?.totalPages ?? 0

    const pendingAction =
        reviewMutation.isPending ||
        suspendMutation.isPending ||
        reactivateMutation.isPending

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý người bán
                    </h1>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Tổng seller"
                    value={stats?.totalSellers ?? 0}
                    icon={<Store size={22} />}
                />
                <StatCard
                    label="Chờ duyệt"
                    value={stats?.pendingSellers ?? 0}
                    icon={<ShieldAlert size={22} />}
                />
                <StatCard
                    label="Seller hoạt động"
                    value={stats?.approvedSellers ?? 0}
                    icon={<UserCheck size={22} />}
                />
                <StatCard
                    label="Tạm khóa / Từ chối"
                    value={
                        (stats?.suspendedSellers ?? 0) +
                        (stats?.rejectedSellers ?? 0)
                    }
                    icon={<UserX size={22} />}
                />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleTab(tab.value)}
                            className={[
                                'shrink-0 border-b-2 px-5 py-4 text-sm font-semibold',
                                activeStatus === tab.value
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
                            placeholder="Tìm theo tên, username, email, SĐT, CCCD hoặc mã thuế..."
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

            {sellersQuery.isLoading ? (
                <div className="flex min-h-[260px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải danh sách seller...
                </div>
            ) : sellersQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải danh sách seller.
                </div>
            ) : (
                <SellerTable
                    sellers={sellers}
                    activeStatus={activeStatus}
                    onApprove={handleApprove}
                    onReject={setRejectingSeller}
                    onSuspend={handleSuspend}
                    onReactivate={handleReactivate}
                    pendingAction={pendingAction}
                />
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
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

            {rejectingSeller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900">
                            Từ chối hồ sơ seller
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Seller: {rejectingSeller.fullName || rejectingSeller.email}
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            placeholder="Nhập lý do từ chối để seller biết cần sửa gì..."
                            className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                        />

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectingSeller(null)
                                    setRejectReason('')
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                disabled={reviewMutation.isPending}
                                onClick={handleRejectSubmit}
                                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                            >
                                {reviewMutation.isPending
                                    ? 'Đang xử lý...'
                                    : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
