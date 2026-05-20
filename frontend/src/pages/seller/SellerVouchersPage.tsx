import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CalendarClock,
    Copy,
    Loader2,
    Percent,
    Plus,
    Search,
    Ticket,
    X,
} from 'lucide-react'
import {
    sellerVoucherApi,
    type SellerVoucher,
    type SellerVoucherDiscountType,
    type SellerVoucherPayload,
    type SellerVoucherStatus,
} from '@/api/sellerVoucherApi'

const STATUS_TABS: Array<{
    label: string
    value: 'all' | SellerVoucherStatus
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang chạy', value: 'active' },
    { label: 'Sắp diễn ra', value: 'upcoming' },
    { label: 'Hết hạn', value: 'expired' },
    { label: 'Hết lượt', value: 'used_up' },
]

interface VoucherFormState {
    code: string
    voucherName: string
    discountType: SellerVoucherDiscountType
    discountValue: string
    maxDiscountAmount: string
    minOrderAmount: string
    usageLimit: string
    perUserLimit: string
    startTime: string
    endTime: string
}

const EMPTY_FORM: VoucherFormState = {
    code: '',
    voucherName: '',
    discountType: 'fixed',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    usageLimit: '100',
    perUserLimit: '1',
    startTime: '',
    endTime: '',
}

function formatMoney(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0)
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

function toDateTimeLocal(value?: string | null) {
    if (!value) return ''

    return value.slice(0, 16)
}

function statusLabel(status?: string) {
    switch (status) {
        case 'active':
            return 'Đang chạy'
        case 'upcoming':
            return 'Sắp diễn ra'
        case 'expired':
            return 'Hết hạn'
        case 'used_up':
            return 'Hết lượt'
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
            return 'bg-gray-100 text-gray-600'
        case 'used_up':
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

function discountText(voucher: SellerVoucher) {
    if (voucher.discountType === 'percent') {
        return `Giảm ${voucher.discountValue}%`
    }

    return `Giảm ${formatMoney(voucher.discountValue)}`
}

function conditionText(voucher: SellerVoucher) {
    const parts = [`Đơn tối thiểu ${formatMoney(voucher.minOrderAmount)}`]

    if (
        voucher.discountType === 'percent' &&
        voucher.maxDiscountAmount !== null &&
        voucher.maxDiscountAmount !== undefined
    ) {
        parts.push(`Tối đa ${formatMoney(voucher.maxDiscountAmount)}`)
    }

    parts.push(`Mỗi tài khoản ${voucher.perUserLimit} lượt`)

    return parts.join(' · ')
}

function toForm(voucher: SellerVoucher): VoucherFormState {
    return {
        code: voucher.code ?? '',
        voucherName: voucher.voucherName ?? '',
        discountType: voucher.discountType ?? 'fixed',
        discountValue: String(voucher.discountValue ?? ''),
        maxDiscountAmount:
            voucher.maxDiscountAmount === null ||
            voucher.maxDiscountAmount === undefined
                ? ''
                : String(voucher.maxDiscountAmount),
        minOrderAmount: String(voucher.minOrderAmount ?? 0),
        usageLimit: String(voucher.usageLimit ?? 100),
        perUserLimit: String(voucher.perUserLimit ?? 1),
        startTime: toDateTimeLocal(voucher.startTime),
        endTime: toDateTimeLocal(voucher.endTime),
    }
}

function numberValue(value: string, fallback = 0) {
    const n = Number(value)

    return Number.isFinite(n) ? n : fallback
}

function buildPayload(form: VoucherFormState): SellerVoucherPayload {
    const discountValue = numberValue(form.discountValue)
    const maxDiscountAmount =
        form.discountType === 'percent'
            ? numberValue(form.maxDiscountAmount)
            : discountValue

    return {
        code: form.code.trim().replace(/\s+/g, '').toUpperCase(),
        voucherName: form.voucherName.trim(),
        discountType: form.discountType,
        discountValue,
        maxDiscountAmount,
        minOrderAmount: numberValue(form.minOrderAmount),
        usageLimit: numberValue(form.usageLimit, 1),
        perUserLimit: numberValue(form.perUserLimit, 1),
        startTime: form.startTime,
        endTime: form.endTime,
    }
}

function VoucherModal({
    open,
    editingVoucher,
    onClose,
}: {
    open: boolean
    editingVoucher: SellerVoucher | null
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<VoucherFormState>(EMPTY_FORM)

    useEffect(() => {
        if (!open) return

        if (editingVoucher) {
            setForm(toForm(editingVoucher))
        } else {
            setForm(EMPTY_FORM)
        }
    }, [open, editingVoucher])

    const createMutation = useMutation({
        mutationFn: sellerVoucherApi.createVoucher,
        onSuccess: () => {
            toast.success('Tạo voucher thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerVouchers'],
            })
            onClose()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Không thể tạo voucher')
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({
            voucherId,
            payload,
        }: {
            voucherId: number
            payload: SellerVoucherPayload
        }) => sellerVoucherApi.updateVoucher(voucherId, payload),
        onSuccess: () => {
            toast.success('Cập nhật voucher thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerVouchers'],
            })
            onClose()
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật voucher'
            )
        },
    })

    if (!open) return null

    const isPending = createMutation.isPending || updateMutation.isPending

    const validateForm = () => {
        const payload = buildPayload(form)

        if (!payload.code) {
            toast.error('Nhập mã voucher')
            return false
        }

        if (!payload.voucherName) {
            toast.error('Nhập tên voucher')
            return false
        }

        if (payload.discountValue <= 0) {
            toast.error('Giá trị giảm phải lớn hơn 0')
            return false
        }

        if (payload.discountType === 'percent') {
            if (payload.discountValue > 100) {
                toast.error('Voucher phần trăm không được vượt quá 100%')
                return false
            }

            if (!payload.maxDiscountAmount || payload.maxDiscountAmount <= 0) {
                toast.error('Nhập mức giảm tối đa')
                return false
            }
        }

        if (payload.minOrderAmount < 0) {
            toast.error('Đơn tối thiểu không được âm')
            return false
        }

        if (payload.usageLimit < 1) {
            toast.error('Số lượt sử dụng tối thiểu là 1')
            return false
        }

        if (payload.perUserLimit < 1) {
            toast.error('Số lượt mỗi tài khoản tối thiểu là 1')
            return false
        }

        if (payload.perUserLimit > payload.usageLimit) {
            toast.error('Lượt mỗi tài khoản không được lớn hơn tổng lượt')
            return false
        }

        if (!payload.startTime || !payload.endTime) {
            toast.error('Chọn thời gian bắt đầu và kết thúc')
            return false
        }

        if (new Date(payload.endTime).getTime() <= new Date(payload.startTime).getTime()) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
            return false
        }

        return true
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        const payload = buildPayload(form)

        if (editingVoucher) {
            updateMutation.mutate({
                voucherId: editingVoucher.voucherId,
                payload,
            })
        } else {
            createMutation.mutate(payload)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher shop'}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Voucher tạo tại đây chỉ áp dụng cho sản phẩm thuộc shop của bạn.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Mã voucher
                            </label>

                            <input
                                value={form.code}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        code: e.target.value.toUpperCase(),
                                    }))
                                }
                                maxLength={50}
                                placeholder="VD: SHOPSALE50"
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tên voucher
                            </label>

                            <input
                                value={form.voucherName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        voucherName: e.target.value,
                                    }))
                                }
                                maxLength={150}
                                placeholder="VD: Giảm 50K cho đơn từ 300K"
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Loại giảm
                            </label>

                            <select
                                value={form.discountType}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        discountType: e.target
                                            .value as SellerVoucherDiscountType,
                                    }))
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            >
                                <option value="fixed">Giảm tiền cố định</option>
                                <option value="percent">Giảm theo phần trăm</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Giá trị giảm
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.discountValue}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        discountValue: e.target.value,
                                    }))
                                }
                                placeholder={
                                    form.discountType === 'percent'
                                        ? 'VD: 10'
                                        : 'VD: 50000'
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Giảm tối đa
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={
                                    form.discountType === 'fixed'
                                        ? form.discountValue
                                        : form.maxDiscountAmount
                                }
                                disabled={form.discountType === 'fixed'}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        maxDiscountAmount: e.target.value,
                                    }))
                                }
                                placeholder="VD: 30000"
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Đơn tối thiểu
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.minOrderAmount}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        minOrderAmount: e.target.value,
                                    }))
                                }
                                placeholder="VD: 300000"
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tổng lượt sử dụng
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={form.usageLimit}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        usageLimit: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Lượt mỗi tài khoản
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={form.perUserLimit}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        perUserLimit: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Bắt đầu
                            </label>

                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        startTime: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Kết thúc
                            </label>

                            <input
                                type="datetime-local"
                                value={form.endTime}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        endTime: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">
                        <div className="font-semibold">
                            Xem trước
                        </div>

                        <div className="mt-1">
                            {form.discountType === 'percent'
                                ? `Giảm ${form.discountValue || 0}% tối đa ${formatMoney(numberValue(form.maxDiscountAmount))}`
                                : `Giảm ${formatMoney(numberValue(form.discountValue))}`}
                            {' '}cho đơn từ {formatMoney(numberValue(form.minOrderAmount))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {editingVoucher ? 'Cập nhật' : 'Tạo voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function VoucherCard({
    voucher,
    onEdit,
    onExpire,
    expiring,
}: {
    voucher: SellerVoucher
    onEdit: (voucher: SellerVoucher) => void
    onExpire: (voucher: SellerVoucher) => void
    expiring: boolean
}) {
    const canExpire = voucher.status === 'active' || voucher.status === 'upcoming'

    const handleCopy = async () => {
        await navigator.clipboard.writeText(voucher.code)
        toast.success('Đã sao chép mã voucher')
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid md:grid-cols-[190px_1fr]">
                <div className="flex flex-col items-center justify-center bg-orange-50 p-6 text-orange-600">
                    <Ticket size={34} />

                    <div className="mt-3 text-sm font-semibold">
                        SHOP
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                        {voucher.discountType === 'percent'
                            ? `${voucher.discountValue}%`
                            : formatMoney(voucher.discountValue)}
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                    {voucher.voucherName}
                                </h3>

                                <span
                                    className={[
                                        'rounded-full px-2.5 py-1 text-xs font-medium',
                                        statusClass(voucher.status),
                                    ].join(' ')}
                                >
                                    {statusLabel(voucher.status)}
                                </span>
                            </div>

                            <p className="mt-1 text-sm font-medium text-orange-600">
                                {discountText(voucher)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {conditionText(voucher)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                        >
                            {voucher.code}
                            <Copy size={13} />
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Đã dùng</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {voucher.usedCount} / {voucher.usageLimit}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Còn lại</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {voucher.remainingCount}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Mỗi tài khoản</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {voucher.perUserLimit} lượt
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-1">
                            <CalendarClock size={14} />
                            {formatDateTime(voucher.startTime)} -{' '}
                            {formatDateTime(voucher.endTime)}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => onEdit(voucher)}
                                className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Sửa
                            </button>

                            {canExpire && (
                                <button
                                    type="button"
                                    disabled={expiring}
                                    onClick={() => onExpire(voucher)}
                                    className="rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                    Kết thúc
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SellerVouchersPage() {
    const queryClient = useQueryClient()

    const [status, setStatus] = useState<'all' | SellerVoucherStatus>('all')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [page, setPage] = useState(0)

    const [modalOpen, setModalOpen] = useState(false)
    const [editingVoucher, setEditingVoucher] =
        useState<SellerVoucher | null>(null)

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerVouchers', status, keyword, page],
        queryFn: () =>
            sellerVoucherApi.getMyShopVouchers({
                status: status === 'all' ? undefined : status,
                keyword: keyword || undefined,
                page,
                size: 10,
            }),
        staleTime: 0,
    })

    const expireMutation = useMutation({
        mutationFn: sellerVoucherApi.expireVoucher,
        onSuccess: () => {
            toast.success('Đã kết thúc voucher')
            queryClient.invalidateQueries({
                queryKey: ['sellerVouchers'],
            })
            queryClient.invalidateQueries({
                queryKey: ['vouchers'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể kết thúc voucher'
            )
        },
    })

    const vouchers = data?.content ?? []

    const openCreate = () => {
        setEditingVoucher(null)
        setModalOpen(true)
    }

    const openEdit = (voucher: SellerVoucher) => {
        setEditingVoucher(voucher)
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingVoucher(null)
    }

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleStatus = (nextStatus: 'all' | SellerVoucherStatus) => {
        setStatus(nextStatus)
        setPage(0)
    }

    const handleExpire = (voucher: SellerVoucher) => {
        const ok = window.confirm(
            `Kết thúc voucher ${voucher.code}? Voucher sẽ không còn dùng được.`
        )

        if (!ok) return

        expireMutation.mutate(voucher.voucherId)
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Voucher của shop
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Tạo và quản lý mã giảm giá áp dụng cho shop của bạn.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Plus size={17} />
                    Tạo voucher
                </button>
            </div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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

                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 p-4 md:flex-row md:items-center"
                >
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                        <Search className="h-4 w-4 text-gray-400" />

                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tìm mã voucher hoặc tên voucher..."
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

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải voucher...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải danh sách voucher.
                </div>
            ) : vouchers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <Percent className="mx-auto h-12 w-12 text-gray-300" />

                    <h2 className="mt-4 font-semibold text-gray-800">
                        Chưa có voucher phù hợp
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Tạo voucher để khuyến khích khách mua hàng trong shop.
                    </p>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        <Plus size={17} />
                        Tạo voucher
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {vouchers.map((voucher) => (
                        <VoucherCard
                            key={voucher.voucherId}
                            voucher={voucher}
                            onEdit={openEdit}
                            onExpire={handleExpire}
                            expiring={expireMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: data.totalPages }).map((_, i) => (
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

            <VoucherModal
                open={modalOpen}
                editingVoucher={editingVoucher}
                onClose={closeModal}
            />
        </div>
    )
}
