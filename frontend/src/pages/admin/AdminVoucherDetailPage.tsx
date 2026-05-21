import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Loader2,
    Power,
    Save,
    Store,
    TicketPercent,
} from 'lucide-react'
import {
    adminVoucherApi,
    type AdminVoucher,
    type AdminVoucherDiscountType,
    type AdminVoucherPayload,
    type AdminVoucherRawStatus,
    type AdminVoucherScope,
} from '@/api/admin/adminVoucherApi'

interface VoucherFormState {
    code: string
    voucherName: string
    discountType: AdminVoucherDiscountType
    discountValue: string
    maxDiscountAmount: string
    minOrderAmount: string
    scope: AdminVoucherScope
    shopId: string
    usageLimit: string
    perUserLimit: string
    startTime: string
    endTime: string
    voucherStatus: AdminVoucherRawStatus
}

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

function toDatetimeLocal(value?: string | null) {
    if (!value) return ''

    return value.slice(0, 16)
}

function statusLabel(status?: string) {
    switch (status) {
        case 'active':
            return 'Đang hoạt động'
        case 'upcoming':
            return 'Sắp diễn ra'
        case 'expired':
            return 'Hết hạn'
        case 'used_out':
            return 'Hết lượt'
        case 'inactive':
            return 'Tạm tắt'
        default:
            return 'Không rõ'
    }
}

function statusClass(status?: string) {
    switch (status) {
        case 'active':
            return 'bg-green-50 text-green-700'
        case 'upcoming':
            return 'bg-blue-50 text-blue-700'
        case 'expired':
            return 'bg-gray-100 text-gray-700'
        case 'used_out':
            return 'bg-yellow-50 text-yellow-700'
        case 'inactive':
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function makeForm(voucher: AdminVoucher): VoucherFormState {
    return {
        code: voucher.code,
        voucherName: voucher.voucherName,
        discountType: voucher.discountType,
        discountValue: String(voucher.discountValue ?? ''),
        maxDiscountAmount: voucher.maxDiscountAmount
            ? String(voucher.maxDiscountAmount)
            : '',
        minOrderAmount: String(voucher.minOrderAmount ?? 0),
        scope: voucher.scope,
        shopId: voucher.shopId ? String(voucher.shopId) : '',
        usageLimit: String(voucher.usageLimit ?? 1),
        perUserLimit: String(voucher.perUserLimit ?? 1),
        startTime: toDatetimeLocal(voucher.startTime),
        endTime: toDatetimeLocal(voucher.endTime),
        voucherStatus: voucher.rawStatus === 'inactive' ? 'inactive' : 'active',
    }
}

function toPayload(form: VoucherFormState): AdminVoucherPayload {
    return {
        code: form.code.trim().toUpperCase(),
        voucherName: form.voucherName.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount
            ? Number(form.maxDiscountAmount)
            : null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        scope: form.scope,
        shopId: form.scope === 'shop' ? Number(form.shopId) : null,
        usageLimit: Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit),
        startTime: form.startTime,
        endTime: form.endTime,
        voucherStatus: form.voucherStatus,
    }
}

function Metric({
    label,
    value,
}: {
    label: string
    value: string | number
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

export default function AdminVoucherDetailPage() {
    const { voucherId } = useParams<{ voucherId: string }>()
    const id = Number(voucherId)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [form, setForm] = useState<VoucherFormState | null>(null)

    const {
        data: voucher,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminVoucherDetail', id],
        queryFn: () => adminVoucherApi.getVoucherDetail(id),
        enabled: Number.isFinite(id),
    })

    useEffect(() => {
        if (voucher) {
            setForm(makeForm(voucher))
        }
    }, [voucher])

    const updateMutation = useMutation({
        mutationFn: (payload: AdminVoucherPayload) =>
            adminVoucherApi.updateVoucher(id, payload),
        onSuccess: (data) => {
            toast.success('Cập nhật voucher thành công')
            queryClient.setQueryData(['adminVoucherDetail', id], data)
            queryClient.invalidateQueries({ queryKey: ['adminVouchers'] })
            queryClient.invalidateQueries({ queryKey: ['adminVoucherStats'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật voucher'
            )
        },
    })

    const statusMutation = useMutation({
        mutationFn: (voucherStatus: AdminVoucherRawStatus) =>
            adminVoucherApi.updateVoucherStatus(id, voucherStatus),
        onSuccess: (data) => {
            toast.success('Cập nhật trạng thái voucher thành công')
            queryClient.setQueryData(['adminVoucherDetail', id], data)
            queryClient.invalidateQueries({ queryKey: ['adminVouchers'] })
            queryClient.invalidateQueries({ queryKey: ['adminVoucherStats'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật trạng thái voucher'
            )
        },
    })

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (!form) return

        if (form.scope === 'shop' && !form.shopId) {
            toast.error('Voucher shop cần nhập shop ID')
            return
        }

        updateMutation.mutate(toPayload(form))
    }

    const handleToggleStatus = () => {
        if (!voucher) return

        const nextStatus: AdminVoucherRawStatus =
            voucher.rawStatus === 'inactive' ? 'active' : 'inactive'

        const ok = window.confirm(
            `${nextStatus === 'inactive' ? 'Tạm tắt' : 'Bật lại'} voucher ${voucher.code}?`
        )

        if (!ok) return

        statusMutation.mutate(nextStatus)
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải voucher...
            </div>
        )
    }

    if (isError || !voucher || !form) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                Không thể tải thông tin voucher.
            </div>
        )
    }

    return (
        <div className="space-y-5">
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
                        {voucher.code}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {voucher.voucherName}
                    </p>
                </div>

                <div className="flex gap-2">
                    {voucher.scope === 'shop' && voucher.shopId && (
                        <Link
                            to={`/shops/${voucher.shopSlug || voucher.shopId}`}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            <Store size={17} />
                            Xem shop
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={handleToggleStatus}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        {statusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Power size={17} />
                        )}
                        {voucher.rawStatus === 'inactive' ? 'Bật lại' : 'Tạm tắt'}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Metric
                    label="Trạng thái"
                    value={statusLabel(voucher.voucherStatus)}
                />
                <Metric
                    label="Đã dùng"
                    value={`${voucher.usedCount} / ${voucher.usageLimit}`}
                />
                <Metric label="Đã lưu" value={voucher.savedCount} />
                <Metric
                    label="Giảm"
                    value={
                        voucher.discountType === 'percent'
                            ? `${voucher.discountValue}%`
                            : formatMoney(voucher.discountValue)
                    }
                />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <TicketPercent className="h-5 w-5 text-orange-500" />
                    <h2 className="font-semibold text-gray-900">
                        Chỉnh sửa voucher
                    </h2>
                    <span
                        className={[
                            'ml-auto rounded-full px-2.5 py-1 text-xs font-medium',
                            statusClass(voucher.voucherStatus),
                        ].join(' ')}
                    >
                        {statusLabel(voucher.voucherStatus)}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Mã voucher
                            </span>
                            <input
                                value={form.code}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? { ...prev, code: e.target.value }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Tên voucher
                            </span>
                            <input
                                value={form.voucherName}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  voucherName: e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Loại giảm
                            </span>
                            <select
                                value={form.discountType}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  discountType: e.target
                                                      .value as AdminVoucherDiscountType,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            >
                                <option value="fixed">Giảm tiền</option>
                                <option value="percent">Giảm phần trăm</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Giá trị giảm
                            </span>
                            <input
                                type="number"
                                value={form.discountValue}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  discountValue: e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Giảm tối đa
                            </span>
                            <input
                                type="number"
                                value={form.maxDiscountAmount}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  maxDiscountAmount:
                                                      e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Đơn tối thiểu
                            </span>
                            <input
                                type="number"
                                value={form.minOrderAmount}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  minOrderAmount:
                                                      e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Phạm vi
                            </span>
                            <select
                                value={form.scope}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  scope: e.target
                                                      .value as AdminVoucherScope,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            >
                                <option value="platform">Toàn sàn</option>
                                <option value="shop">Theo shop</option>
                            </select>
                        </label>

                        {form.scope === 'shop' && (
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">
                                    Shop ID
                                </span>
                                <input
                                    type="number"
                                    value={form.shopId}
                                    onChange={(e) =>
                                        setForm((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      shopId: e.target.value,
                                                  }
                                                : prev
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                />
                            </label>
                        )}

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Tổng lượt dùng
                            </span>
                            <input
                                type="number"
                                value={form.usageLimit}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  usageLimit: e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Lượt mỗi tài khoản
                            </span>
                            <input
                                type="number"
                                value={form.perUserLimit}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  perUserLimit:
                                                      e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Trạng thái gốc
                            </span>
                            <select
                                value={form.voucherStatus}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  voucherStatus: e.target
                                                      .value as AdminVoucherRawStatus,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Bắt đầu
                            </span>
                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  startTime: e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Kết thúc
                            </span>
                            <input
                                type="datetime-local"
                                value={form.endTime}
                                onChange={(e) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  endTime: e.target.value,
                                              }
                                            : prev
                                    )
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                        <p>
                            Thời hạn: {formatDate(voucher.startTime)} →{' '}
                            {formatDate(voucher.endTime)}
                        </p>
                        <p className="mt-1">
                            Đã dùng {voucher.usedCount}/{voucher.usageLimit}, còn{' '}
                            {voucher.remainingCount} lượt.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save size={17} />
                            )}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
