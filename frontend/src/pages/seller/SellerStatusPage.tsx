import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Home,
    Loader2,
    ShieldAlert,
    Store,
    Upload,
    XCircle,
} from 'lucide-react'
import { sellerOnboardingApi } from '@/api/sellerOnboardingApi'
import { useSellerStore } from '@/store/sellerStore'
import type { SellerDocument, SellerProfile, SellerStatus } from '@/types/seller.types'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

type DocType = SellerDocument['documentType']

const REQUIRED_DOCS: {
    type: DocType
    label: string
    hint: string
}[] = [
    {
        type: 'citizen_id',
        label: 'CCCD / CMND — Mặt trước',
        hint: 'Ảnh rõ nét, đủ 4 góc, không bị chói sáng',
    },
    {
        type: 'citizen_id_back',
        label: 'CCCD / CMND — Mặt sau',
        hint: 'Ảnh rõ nét, đủ 4 góc, không bị chói sáng',
    },
    {
        type: 'business_license',
        label: 'Giấy phép kinh doanh',
        hint: 'Bắt buộc để xác minh tư cách người bán',
    },
    {
        type: 'tax_document',
        label: 'Giấy tờ thuế',
        hint: 'MST cá nhân hoặc giấy tờ thuế doanh nghiệp',
    },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]

function validateFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
        return 'File tối đa 5MB'
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return 'Chỉ hỗ trợ JPG, PNG, WEBP hoặc PDF'
    }

    return null
}

function formatDate(value?: string) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value))
}

function statusConfig(status: SellerStatus) {
    switch (status) {
        case 'pending':
            return {
                icon: Clock,
                title: 'Hồ sơ đang chờ duyệt',
                description:
                    'Hồ sơ của bạn đã được gửi. Quản trị viên sẽ kiểm tra thông tin và giấy tờ trước khi kích hoạt quyền bán hàng.',
                badge: 'Đang chờ duyệt',
                badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                boxClass: 'bg-amber-50 border-amber-200',
            }

        case 'approved':
            return {
                icon: CheckCircle2,
                title: 'Hồ sơ đã được duyệt',
                description:
                    'Bạn đã đủ điều kiện trở thành người bán. Tiếp tục thiết lập shop để bắt đầu đăng sản phẩm.',
                badge: 'Đã duyệt',
                badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                boxClass: 'bg-emerald-50 border-emerald-200',
            }

        case 'rejected':
            return {
                icon: XCircle,
                title: 'Hồ sơ bị từ chối',
                description:
                    'Hồ sơ chưa đạt yêu cầu. Kiểm tra lý do từ chối, chỉnh sửa thông tin và gửi lại hồ sơ.',
                badge: 'Bị từ chối',
                badgeClass: 'bg-red-50 text-red-700 border-red-200',
                boxClass: 'bg-red-50 border-red-200',
            }

        case 'suspended':
            return {
                icon: ShieldAlert,
                title: 'Tài khoản seller bị tạm khóa',
                description:
                    'Tài khoản bán hàng đang bị tạm khóa. Vui lòng liên hệ quản trị viên để được xử lý.',
                badge: 'Tạm khóa',
                badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
                boxClass: 'bg-gray-50 border-gray-200',
            }

        default:
            return {
                icon: AlertCircle,
                title: 'Chưa đăng ký seller',
                description: 'Bạn chưa gửi hồ sơ đăng ký bán hàng.',
                badge: 'Chưa đăng ký',
                badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
                boxClass: 'bg-gray-50 border-gray-200',
            }
    }
}
function docStatusLabel(status: SellerDocument['verificationStatus']) {
    switch (status) {
        case 'approved':
            return 'Đã duyệt'
        case 'rejected':
            return 'Bị từ chối'
        case 'pending':
        default:
            return 'Chờ duyệt'
    }
}

function docStatusClass(status: SellerDocument['verificationStatus']) {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'rejected':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'pending':
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200'
    }
}

function RequiredDocChecklist({ profile }: { profile: SellerProfile }) {
    const uploadedTypes = new Set(profile.documents?.map((d) => d.documentType))

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
                Điều kiện hồ sơ
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                Hồ sơ cần đủ tất cả giấy tờ dưới đây để được xét duyệt.
            </p>

            <div className="mt-4 space-y-3">
                {REQUIRED_DOCS.map((item) => {
                    const done = uploadedTypes.has(item.type)

                    return (
                        <div
                            key={item.type}
                            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                {done ? (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                ) : (
                                    <XCircle className="text-red-500" size={20} />
                                )}

                                <span className="text-sm font-medium text-gray-800">
                                    {item.label}
                                </span>
                            </div>

                            <span
                                className={[
                                    'rounded-full border px-2.5 py-1 text-xs font-medium',
                                    done
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-red-200 bg-red-50 text-red-700',
                                ].join(' ')}
                            >
                                {done ? 'Đã upload' : 'Thiếu'}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function SellerStatusPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [uploadingType, setUploadingType] = useState<DocType | null>(null)

    const {
        setStatus,
        setSellerId,
        setRejection,
        setShop,
        reset,
    } = useSellerStore()

    const {
        data: profile,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['sellerMyProfile'],
        queryFn: sellerOnboardingApi.getMyProfile,
        retry: false,
        staleTime: 0,
    })

    const documentMap = useMemo(() => {
        const map = new Map<DocType, SellerDocument>()

        for (const doc of profile?.documents ?? []) {
            map.set(doc.documentType, doc)
        }

        return map
    }, [profile?.documents])

    const canChangeDocuments =
        profile?.verificationStatus === 'pending' ||
        profile?.verificationStatus === 'rejected'

    const handleUploadDocument = async (type: DocType, file: File) => {
        const fileError = validateFile(file)

        if (fileError) {
            toast.error(fileError)
            return
        }

        setUploadingType(type)

        try {
            await sellerOnboardingApi.uploadDocument(type, file)

            await queryClient.invalidateQueries({
                queryKey: ['sellerMyProfile'],
            })

            toast.success('Cập nhật giấy tờ thành công')
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Cập nhật giấy tờ thất bại')
        } finally {
            setUploadingType(null)
        }
    }

    useEffect(() => {
        if (profile) {
            setStatus(profile.verificationStatus)
            setSellerId(profile.sellerId)
            setRejection(profile.rejectionReason ?? null)

            if (profile.shopId) {
                setShop(
                    profile.shopId,
                    profile.shopName ?? '',
                    profile.shopSlug ?? ''
                )
            }

            return
        }

        if (!isLoading) {
            reset()
        }
    }, [
        profile,
        isLoading,
        setStatus,
        setSellerId,
        setRejection,
        setShop,
        reset,
    ])

    if (isLoading) {
        return (
            <div className="min-h-[70vh] bg-gray-100 px-4 py-10">
                <div className="mx-auto flex max-w-5xl items-center justify-center rounded-2xl bg-white p-12 text-gray-500 shadow-sm">
                    <Loader2 className="mr-2 animate-spin" size={22} />
                    Đang tải trạng thái hồ sơ...
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-[70vh] bg-gray-100 px-4 py-10">
                <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center shadow-sm">
                    <Store className="mx-auto mb-4 text-gray-300" size={64} />

                    <h1 className="text-2xl font-bold text-gray-900">
                        Bạn chưa đăng ký bán hàng
                    </h1>

                    <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                        Gửi hồ sơ đăng ký seller để bắt đầu mở shop và đăng sản phẩm trên hệ thống.
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                        <Link
                            to="/seller/apply"
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            Đăng ký seller
                            <ArrowRight size={17} />
                        </Link>

                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            <Home size={17} />
                            Trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const config = statusConfig(profile.verificationStatus)
    const StatusIcon = config.icon

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8">
            <div className="mx-auto max-w-6xl space-y-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/" className="hover:text-orange-600">
                        Trang chủ
                    </Link>
                    <span>/</span>
                    <span className="text-gray-700">Trạng thái seller</span>
                    {isFetching && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="animate-spin" size={13} />
              Đang cập nhật
            </span>
                    )}
                </div>

                <section
                    className={[
                        'rounded-2xl border p-6 shadow-sm',
                        config.boxClass,
                    ].join(' ')}
                >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                                <StatusIcon className="text-orange-500" size={28} />
                            </div>

                            <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {config.title}
                                    </h1>

                                    <span
                                        className={[
                                            'rounded-full border px-3 py-1 text-xs font-semibold',
                                            config.badgeClass,
                                        ].join(' ')}
                                    >
                    {config.badge}
                  </span>
                                </div>

                                <p className="max-w-3xl text-sm leading-6 text-gray-600">
                                    {config.description}
                                </p>

                                {profile.verificationStatus === 'rejected' &&
                                    profile.rejectionReason && (
                                        <div className="mt-4 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
                                            <p className="font-semibold">Lý do từ chối:</p>
                                            <p className="mt-1">{profile.rejectionReason}</p>
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            {profile.verificationStatus === 'approved' && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/seller/shop/setup')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Thiết lập shop
                                    <ArrowRight size={17} />
                                </button>
                            )}

                            {profile.verificationStatus === 'rejected' && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/seller/apply')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Nộp lại hồ sơ
                                    <ArrowRight size={17} />
                                </button>
                            )}

                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <Home size={17} />
                                Trang chủ
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Thông tin hồ sơ
                        </h2>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    Mã hồ sơ
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    #{profile.sellerId}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    Người đăng ký
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {profile.fullName}
                                </p>
                                <p className="text-xs text-gray-500">{profile.email}</p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    CCCD / CMND
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {profile.identityNumber || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    Mã số thuế
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {profile.taxCode || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    Ngày gửi hồ sơ
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {formatDate(profile.createdAt)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium uppercase text-gray-400">
                                    Ngày duyệt
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {formatDate(profile.verifiedAt)}
                                </p>
                            </div>
                        </div>
                    </section>

                    <RequiredDocChecklist profile={profile} />
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Giấy tờ đã upload
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Có thể xem, bổ sung hoặc thay đổi giấy tờ khi hồ sơ đang chờ duyệt hoặc bị từ chối.
                            </p>
                        </div>

                        <FileText className="text-gray-300" size={28} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {REQUIRED_DOCS.map((item) => {
                            const doc = documentMap.get(item.type)
                            const isUploading = uploadingType === item.type

                            return (
                                <div
                                    key={item.type}
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900">
                                                {item.label}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {item.hint}
                                            </p>

                                            {doc ? (
                                                <>
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        Upload: {formatDate(doc.uploadedAt)}
                                                    </p>

                                                    <a
                                                        href={doc.documentUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 inline-block text-sm font-medium text-orange-600 hover:underline"
                                                    >
                                                        Xem tài liệu
                                                    </a>
                                                </>
                                            ) : (
                                                <p className="mt-2 text-sm text-red-600">
                                                    Chưa upload giấy tờ này
                                                </p>
                                            )}
                                        </div>

                                        {doc ? (
                                            <span
                                                className={[
                                                    'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                    docStatusClass(doc.verificationStatus),
                                                ].join(' ')}
                                            >
                                {docStatusLabel(doc.verificationStatus)}
                            </span>
                                        ) : (
                                            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Thiếu
                            </span>
                                        )}
                                    </div>

                                    {canChangeDocuments ? (
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600">
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}

                                            <span>
                                {isUploading
                                    ? 'Đang upload...'
                                    : doc
                                        ? 'Thay đổi giấy tờ'
                                        : 'Upload giấy tờ'}
                            </span>

                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                disabled={isUploading || uploadingType !== null}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]

                                                    if (file) {
                                                        handleUploadDocument(item.type, file)
                                                    }

                                                    e.currentTarget.value = ''
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    ) : (
                                        <p className="mt-2 text-xs text-gray-400">
                                            Hồ sơ đã được xử lý, không thể thay đổi giấy tờ tại bước này.
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}