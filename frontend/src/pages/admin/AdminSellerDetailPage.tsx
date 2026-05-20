import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    FileText,
    Loader2,
    RotateCcw,
    Store,
    User,
    XCircle,
} from 'lucide-react'
import { adminSellerApi } from '@/api/admin/adminSellerApi'

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

function statusLabel(status?: string | null) {
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

function statusClass(status?: string | null) {
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

export default function AdminSellerDetailPage() {
    const { sellerId } = useParams<{ sellerId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const id = Number(sellerId)

    const [rejectReason, setRejectReason] = useState('')

    const {
        data: seller,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminSellerDetail', id],
        queryFn: () => adminSellerApi.getDetail(id),
        enabled: Number.isFinite(id),
        staleTime: 0,
    })

    const reviewMutation = useMutation({
        mutationFn: ({
            approved,
            rejectionReason,
        }: {
            approved: boolean
            rejectionReason?: string
        }) => adminSellerApi.review(id, approved, rejectionReason),
        onSuccess: () => {
            toast.success('Đã cập nhật hồ sơ seller')
            invalidate()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật hồ sơ seller'
            )
        },
    })

    const suspendMutation = useMutation({
        mutationFn: (reason?: string) => adminSellerApi.suspend(id, reason),
        onSuccess: () => {
            toast.success('Đã tạm khóa seller')
            invalidate()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể tạm khóa seller'
            )
        },
    })

    const reactivateMutation = useMutation({
        mutationFn: () => adminSellerApi.reactivate(id),
        onSuccess: () => {
            toast.success('Đã kích hoạt lại seller')
            invalidate()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể kích hoạt seller'
            )
        },
    })

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['adminSellerDetail', id] })
        queryClient.invalidateQueries({ queryKey: ['adminSellers'] })
        queryClient.invalidateQueries({ queryKey: ['adminSellerStats'] })
    }

    const handleApprove = () => {
        const ok = window.confirm('Duyệt hồ sơ seller này?')

        if (!ok) return

        reviewMutation.mutate({ approved: true })
    }

    const handleReject = () => {
        if (!rejectReason.trim()) {
            toast.error('Nhập lý do từ chối')
            return
        }

        reviewMutation.mutate({
            approved: false,
            rejectionReason: rejectReason.trim(),
        })
    }

    const handleSuspend = () => {
        const reason = window.prompt(
            'Lý do tạm khóa seller',
            'Vi phạm chính sách bán hàng'
        )

        if (reason === null) return

        suspendMutation.mutate(reason.trim() || undefined)
    }

    const handleReactivate = () => {
        const ok = window.confirm('Kích hoạt lại seller này?')

        if (!ok) return

        reactivateMutation.mutate()
    }

    const pendingAction =
        reviewMutation.isPending ||
        suspendMutation.isPending ||
        reactivateMutation.isPending

    if (isLoading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải hồ sơ seller...
            </div>
        )
    }

    if (isError || !seller) {
        return (
            <div className="p-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-sm text-orange-600 hover:underline"
                >
                    ← Quay lại
                </button>
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không tìm thấy hồ sơ seller.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
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

                    <h1 className="text-2xl font-bold text-gray-900">
                        Hồ sơ seller #{seller.sellerId}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kiểm tra thông tin, giấy tờ và trạng thái shop.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {seller.verificationStatus === 'pending' && (
                        <>
                            <button
                                type="button"
                                disabled={pendingAction}
                                onClick={handleApprove}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                                <CheckCircle2 size={16} />
                                Duyệt seller
                            </button>

                            <button
                                type="button"
                                disabled={pendingAction}
                                onClick={handleReject}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                            >
                                <XCircle size={16} />
                                Từ chối
                            </button>
                        </>
                    )}

                    {seller.verificationStatus === 'approved' && (
                        <button
                            type="button"
                            disabled={pendingAction}
                            onClick={handleSuspend}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                            <Ban size={16} />
                            Tạm khóa
                        </button>
                    )}

                    {seller.verificationStatus === 'suspended' && (
                        <button
                            type="button"
                            disabled={pendingAction}
                            onClick={handleReactivate}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            <RotateCcw size={16} />
                            Mở lại
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-orange-500" />
                        <h2 className="font-semibold text-gray-900">
                            Thông tin người bán
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Info label="Tên" value={seller.fullName} />
                        <Info label="Username" value={seller.username} />
                        <Info label="Email" value={seller.email} />
                        <Info label="Số điện thoại" value={seller.phoneNumber} />
                        <Info label="CCCD" value={seller.identityNumber} />
                        <Info label="Mã thuế" value={seller.taxCode} />
                        <Info label="Ngày đăng ký" value={formatDate(seller.createdAt)} />
                        <Info label="Ngày duyệt" value={formatDate(seller.verifiedAt)} />
                    </div>

                    <div className="mt-5">
                        <span
                            className={[
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                statusClass(seller.verificationStatus),
                            ].join(' ')}
                        >
                            {statusLabel(seller.verificationStatus)}
                        </span>
                    </div>

                    {seller.verificationStatus === 'pending' && (
                        <div className="mt-5">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Lý do từ chối
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                placeholder="Nhập lý do nếu từ chối hồ sơ..."
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                            />
                        </div>
                    )}

                    {seller.rejectionReason && (
                        <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {seller.rejectionReason}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Store className="h-5 w-5 text-orange-500" />
                        <h2 className="font-semibold text-gray-900">
                            Shop
                        </h2>
                    </div>

                    {seller.shop ? (
                        <div>
                            {seller.shop.bannerUrl && (
                                <img
                                    src={seller.shop.bannerUrl}
                                    alt={seller.shop.shopName}
                                    className="mb-4 h-28 w-full rounded-xl object-cover"
                                />
                            )}

                            <div className="flex items-center gap-3">
                                {seller.shop.avatarUrl ? (
                                    <img
                                        src={seller.shop.avatarUrl}
                                        alt={seller.shop.shopName}
                                        className="h-14 w-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                                        <Store />
                                    </div>
                                )}

                                <div>
                                    <Link
                                        to={`/shops/${
                                            seller.shop.shopSlug ||
                                            seller.shop.shopId
                                        }`}
                                        className="font-semibold text-orange-600 hover:underline"
                                    >
                                        {seller.shop.shopName}
                                    </Link>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Trạng thái: {seller.shop.shopStatus}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-4 text-sm text-gray-600">
                                {seller.shop.description || 'Chưa có mô tả shop.'}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <Info label="Rating" value={seller.shop.rating ?? 0} />
                                <Info
                                    label="Người theo dõi"
                                    value={seller.shop.followerCount ?? 0}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                            Seller đã được duyệt nhưng chưa tạo shop.
                        </div>
                    )}
                </section>
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <h2 className="font-semibold text-gray-900">
                        Giấy tờ xác minh
                    </h2>
                </div>

                {seller.documents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                        Chưa có giấy tờ.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {seller.documents.map((doc) => (
                            <a
                                key={doc.documentId}
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group overflow-hidden rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200"
                            >
                                <div className="aspect-[4/3] bg-white">
                                    <img
                                        src={doc.documentUrl}
                                        alt={doc.documentType}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                                        {doc.documentType}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {doc.verificationStatus} ·{' '}
                                        {formatDate(doc.uploadedAt)}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function Info({
    label,
    value,
}: {
    label: string
    value?: string | number | null
}) {
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-gray-800">
                {value === null || value === undefined || value === ''
                    ? '-'
                    : value}
            </p>
        </div>
    )
}
