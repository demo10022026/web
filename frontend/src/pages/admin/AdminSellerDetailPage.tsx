import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    CheckCircle,
    ExternalLink,
    FileText,
    XCircle,
} from 'lucide-react'
import {
    adminSellerApi,
    type AdminSellerDocument,
    type AdminSellerItem,
} from '@/api/admin/adminSellerApi'

const documentLabels: Record<string, string> = {
    citizen_id: 'CCCD mặt trước',
    citizen_id_back: 'CCCD mặt sau',
    business_license: 'Giấy phép kinh doanh',
    tax_document: 'Giấy tờ thuế',
}

function isImageUrl(url: string) {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(url)
}

function statusBadge(status: string) {
    if (status === 'pending') {
        return 'bg-yellow-100 text-yellow-700'
    }

    if (status === 'approved') {
        return 'bg-green-100 text-green-700'
    }

    if (status === 'rejected') {
        return 'bg-red-100 text-red-700'
    }

    return 'bg-gray-100 text-gray-700'
}

function DocumentCard({ doc }: { doc: AdminSellerDocument }) {
    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <div>
                    <div className="font-medium text-gray-800">
                        {documentLabels[doc.documentType] ?? doc.documentType}
                    </div>

                    <div className="text-xs text-gray-500">
                        Upload: {doc.uploadedAt}
                    </div>
                </div>

                <span
                    className={[
                        'rounded-full px-2 py-1 text-xs',
                        statusBadge(doc.verificationStatus),
                    ].join(' ')}
                >
                    {doc.verificationStatus}
                </span>
            </div>

            <div className="p-4">
                {isImageUrl(doc.documentUrl) ? (
                    <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                    >
                        <img
                            src={doc.documentUrl}
                            alt={documentLabels[doc.documentType] ?? doc.documentType}
                            className="max-h-[420px] w-full rounded-lg border object-contain"
                        />
                    </a>
                ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border bg-gray-50 text-gray-500">
                        <FileText size={40} />

                        <p className="mt-2 text-sm">
                            Không thể xem trước trực tiếp file này.
                        </p>
                    </div>
                )}

                <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline"
                >
                    Mở giấy tờ trong tab mới
                    <ExternalLink size={14} />
                </a>
            </div>
        </div>
    )
}

export default function AdminSellerDetailPage() {
    const { sellerId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const id = Number(sellerId)

    const [checked, setChecked] = useState(false)
    const [rejectMode, setRejectMode] = useState(false)
    const [reason, setReason] = useState('')

    const {
        data: seller,
        isLoading,
        isError,
    } = useQuery<AdminSellerItem>({
        queryKey: ['adminSellerDetail', id],
        queryFn: () => adminSellerApi.getDetail(id),
        enabled: Number.isFinite(id),
    })

    const reviewMutation = useMutation({
        mutationFn: ({
            approved,
            rejectionReason,
        }: {
            approved: boolean
            rejectionReason?: string
        }) => adminSellerApi.review(id, approved, rejectionReason),

        onSuccess: (_, variables) => {
            toast.success(
                variables.approved
                    ? 'Đã duyệt seller'
                    : 'Đã từ chối seller'
            )

            queryClient.invalidateQueries({ queryKey: ['adminSellers'] })
            queryClient.invalidateQueries({ queryKey: ['adminSellerDetail', id] })

            navigate('/admin/sellers')
        },

        onError: () => {
            toast.error('Cập nhật trạng thái seller thất bại')
        },
    })

    const requiredDocs = useMemo(() => {
        const docs = seller?.documents ?? []

        return {
            hasFrontId: docs.some((d) => d.documentType === 'citizen_id'),
            hasBackId: docs.some((d) => d.documentType === 'citizen_id_back'),
            hasBusinessLicense: docs.some((d) => d.documentType === 'business_license'),
            hasTaxDocument: docs.some((d) => d.documentType === 'tax_document'),
        }
    }, [seller])

    const canReview = seller?.verificationStatus === 'pending'
    const hasEnoughRequiredDocs =
        requiredDocs.hasFrontId &&
        requiredDocs.hasBackId &&
        requiredDocs.hasBusinessLicense &&
        requiredDocs.hasTaxDocument

    const handleApprove = () => {
        if (!checked) {
            toast.error('Bạn cần xác nhận đã kiểm tra giấy tờ')
            return
        }

        if (!hasEnoughRequiredDocs) {
            toast.error('Hồ sơ chưa đủ tất cả giấy tờ bắt buộc')
            return
        }

        reviewMutation.mutate({ approved: true })
    }

    const handleReject = () => {
        if (!checked) {
            toast.error('Bạn cần xác nhận đã kiểm tra giấy tờ')
            return
        }

        if (!reason.trim()) {
            toast.error('Nhập lý do từ chối')
            return
        }

        reviewMutation.mutate({
            approved: false,
            rejectionReason: reason.trim(),
        })
    }

    if (isLoading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Đang tải hồ sơ seller...
            </div>
        )
    }

    if (isError || !seller) {
        return (
            <div className="p-6 text-sm text-red-500">
                Không thể tải hồ sơ seller
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        to="/admin/sellers"
                        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                    >
                        <ArrowLeft size={16} />
                        Quay lại danh sách
                    </Link>

                    <h1 className="text-xl font-semibold text-gray-800">
                        Hồ sơ seller #{seller.sellerId}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Xem thông tin và giấy tờ trước khi xác nhận trạng thái.
                    </p>
                </div>

                <span
                    className={[
                        'rounded-full px-3 py-1 text-sm',
                        statusBadge(seller.verificationStatus),
                    ].join(' ')}
                >
                    {seller.verificationStatus}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <div className="space-y-6">
                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="mb-4 font-semibold text-gray-800">
                            Thông tin người đăng ký
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-gray-400">Họ tên</div>
                                <div className="font-medium text-gray-800">
                                    {seller.fullName || '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-gray-400">Email</div>
                                <div className="text-gray-800">
                                    {seller.email}
                                </div>
                            </div>

                            <div>
                                <div className="text-gray-400">Số điện thoại</div>
                                <div className="text-gray-800">
                                    {seller.phoneNumber}
                                </div>
                            </div>

                            <div>
                                <div className="text-gray-400">Số CCCD</div>
                                <div className="text-gray-800">
                                    {seller.identityNumber ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-gray-400">Mã thuế</div>
                                <div className="text-gray-800">
                                    {seller.taxCode ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-gray-400">Ngày tạo hồ sơ</div>
                                <div className="text-gray-800">
                                    {seller.createdAt}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                        <h2 className="mb-4 font-semibold text-gray-800">
                            Kiểm tra bắt buộc
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div
                                className={
                                    requiredDocs.hasFrontId
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }
                            >
                                {requiredDocs.hasFrontId ? '✓' : '✕'} CCCD mặt trước
                            </div>

                            <div
                                className={
                                    requiredDocs.hasBackId
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }
                            >
                                {requiredDocs.hasBackId ? '✓' : '✕'} CCCD mặt sau
                            </div>

                            <div
                                className={
                                    requiredDocs.hasBusinessLicense
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }
                            >
                                {requiredDocs.hasBusinessLicense ? '✓' : '✕'} Giấy phép kinh doanh
                            </div>

                            <div
                                className={
                                    requiredDocs.hasTaxDocument
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }
                            >
                                {requiredDocs.hasTaxDocument ? '✓' : '✕'} Giấy tờ thuế
                            </div>
                        </div>
                    </div>

                    {canReview && (
                        <div className="rounded-xl border bg-white p-5">
                            <h2 className="mb-4 font-semibold text-gray-800">
                                Xác nhận trạng thái
                            </h2>

                            <label className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => setChecked(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>
                                    Tôi đã kiểm tra thông tin và giấy tờ của hồ sơ này.
                                </span>
                            </label>

                            {rejectMode && (
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Nhập lý do từ chối"
                                    rows={4}
                                    className="mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500"
                                />
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    disabled={reviewMutation.isPending}
                                    onClick={handleApprove}
                                    className="inline-flex items-center gap-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                    <CheckCircle size={16} />
                                    Duyệt seller
                                </button>

                                {!rejectMode ? (
                                    <button
                                        onClick={() => setRejectMode(true)}
                                        className="inline-flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                    >
                                        <XCircle size={16} />
                                        Từ chối
                                    </button>
                                ) : (
                                    <button
                                        disabled={reviewMutation.isPending}
                                        onClick={handleReject}
                                        className="inline-flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        <XCircle size={16} />
                                        Xác nhận từ chối
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="mb-4 font-semibold text-gray-800">
                        Giấy tờ đã upload
                    </h2>

                    {seller.documents.length === 0 ? (
                        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
                            Hồ sơ này chưa upload giấy tờ.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {seller.documents.map((doc) => (
                                <DocumentCard
                                    key={doc.documentId}
                                    doc={doc}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}