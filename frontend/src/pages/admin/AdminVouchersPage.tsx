import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Eye,
    Loader2,
    Plus,
    Power,
    Search,
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
    type AdminVoucherStatus,
} from '@/api/admin/adminVoucherApi'

const STATUS_OPTIONS: Array<{
    value: 'all' | AdminVoucherStatus
    label: string
}> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'upcoming', label: 'Sắp diễn ra' },
    { value: 'expired', label: 'Hết hạn' },
    { value: 'used_out', label: 'Hết lượt' },
    { value: 'inactive', label: 'Tạm tắt' },
]

const SCOPE_OPTIONS: Array<{
    value: 'all' | AdminVoucherScope
    label: string
}> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'platform', label: 'Toàn sàn' },
    { value: 'shop', label: 'Theo shop' },
]

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

const initialForm: VoucherFormState = {
    code: '',
    voucherName: '',
    discountType: 'fixed',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    scope: 'platform',
    shopId: '',
    usageLimit: '100',
    perUserLimit: '1',
    startTime: '',
    endTime: '',
    voucherStatus: 'active',
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

function discountText(voucher: AdminVoucher) {
    if (voucher.discountType === 'percent') {
        return `Giảm ${voucher.discountValue}%`
    }

    return `Giảm ${formatMoney(voucher.discountValue)}`
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

function StatCard({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

export default function AdminVouchersPage() {
    const queryClient = useQueryClient()

    const [scope, setScope] = useState<'all' | AdminVoucherScope>('all')
    const [status, setStatus] = useState<'all' | AdminVoucherStatus>('all')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [page, setPage] = useState(0)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [form, setForm] = useState<VoucherFormState>(initialForm)

    const shopIdValue = Number(form.shopId)

    const {
        data: shopLookup,
        isFetching: isCheckingShop,
        isError: isShopLookupError,
    } = useQuery({
        queryKey: ['adminVoucherShopLookup', form.shopId],
        queryFn: () => adminVoucherApi.getShopLookup(shopIdValue),
        enabled:
            form.scope === 'shop' &&
            !!form.shopId &&
            Number.isFinite(shopIdValue) &&
            shopIdValue > 0,
        retry: false,
        staleTime: 60 * 1000,
    })

    const statsQuery = useQuery({
        queryKey: ['adminVoucherStats'],
        queryFn: adminVoucherApi.getStats,
    })

    const vouchersQuery = useQuery({
        queryKey: ['adminVouchers', scope, status, keyword, page],
        queryFn: () =>
            adminVoucherApi.getVouchers({
                scope,
                status,
                keyword: keyword || undefined,
                page,
                size: 10,
            }),
    })

    const createMutation = useMutation({
        mutationFn: (payload: AdminVoucherPayload) =>
            adminVoucherApi.createVoucher(payload),
        onSuccess: () => {
            toast.success('Tạo mã giảm giá thành công')
            setForm(initialForm)
            setShowCreateForm(false)
            queryClient.invalidateQueries({ queryKey: ['adminVouchers'] })
            queryClient.invalidateQueries({ queryKey: ['adminVoucherStats'] })
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Không thể tạo voucher')
        },
    })

    const statusMutation = useMutation({
        mutationFn: ({
            voucherId,
            voucherStatus,
        }: {
            voucherId: number
            voucherStatus: AdminVoucherRawStatus
        }) => adminVoucherApi.updateVoucherStatus(voucherId, voucherStatus),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái voucher thành công')
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

    const data = vouchersQuery.data
    const vouchers = data?.content ?? []
    const stats = statsQuery.data

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleCreate = (e: FormEvent) => {
        e.preventDefault()

        if (form.scope === 'shop') {
            if (!form.shopId) {
                toast.error('Voucher shop cần nhập Shop ID')
                return
            }

            if (isCheckingShop) {
                toast.error('Đang kiểm tra thông tin shop')
                return
            }

            if (isShopLookupError || !shopLookup) {
                toast.error('Vui lòng nhập Shop ID hợp lệ')
                return
            }
        }

        createMutation.mutate(toPayload(form))
    }

    const handleToggleStatus = (voucher: AdminVoucher) => {
        const nextStatus: AdminVoucherRawStatus =
            voucher.rawStatus === 'inactive' ? 'active' : 'inactive'

        const ok = window.confirm(
            `${nextStatus === 'inactive' ? 'Tạm tắt' : 'Bật lại'} voucher ${voucher.code}?`
        )

        if (!ok) return

        statusMutation.mutate({
            voucherId: voucher.voucherId,
            voucherStatus: nextStatus,
        })
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý voucher
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý voucher toàn sàn và voucher theo shop.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateForm((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Plus size={17} />
                    Tạo voucher
                </button>
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Tổng mã giảm giá" value={stats.totalVouchers} />
                    <StatCard label="Đang hoạt động" value={stats.activeVouchers} />
                    <StatCard label="Theo shop" value={stats.shopVouchers} />
                    <StatCard label="Lượt lưu" value={stats.totalSavedVouchers} />
                </div>
            )}

            {showCreateForm && (
                <form
                    onSubmit={handleCreate}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                    <h2 className="mb-4 font-semibold text-gray-900">
                        Tạo mã giảm giá mới
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Mã voucher
                            </span>
                            <input
                                value={form.code}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        code: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                placeholder="VD: SALE10"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Tên voucher
                            </span>
                            <input
                                value={form.voucherName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        voucherName: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                placeholder="VD: Giảm 10% toàn sàn"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Loại giảm
                            </span>
                            <select
                                value={form.discountType}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        discountType: e.target
                                            .value as AdminVoucherDiscountType,
                                    }))
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
                                    setForm((prev) => ({
                                        ...prev,
                                        discountValue: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                placeholder="VD: 10000 hoặc 10"
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
                                    setForm((prev) => ({
                                        ...prev,
                                        maxDiscountAmount: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                placeholder="Chỉ cần với voucher %"
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
                                    setForm((prev) => ({
                                        ...prev,
                                        minOrderAmount: e.target.value,
                                    }))
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
                                onChange={(e) => {
                                    const nextScope = e.target.value as AdminVoucherScope

                                    setForm((prev) => ({
                                        ...prev,
                                        scope: nextScope,
                                        shopId:
                                            nextScope === 'platform'
                                                ? ''
                                                : prev.shopId,
                                    }))
                                }}
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            >
                                <option value="platform">Toàn sàn</option>
                                <option value="shop">Theo shop</option>
                            </select>
                        </label>

                        {form.scope === 'shop' && (
                            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Shop ID
                                    </label>

                                    <input
                                        type="number"
                                        min={1}
                                        value={form.shopId}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                shopId: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                        placeholder="Nhập ID shop"
                                    />

                                    {isShopLookupError && (
                                        <p className="mt-1 text-xs text-red-500">
                                            Không tìm thấy shop với ID này.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Tên shop
                                    </label>

                                    <input
                                        value={
                                            isCheckingShop
                                                ? 'Đang kiểm tra...'
                                                : shopLookup?.shopName ?? ''
                                        }
                                        readOnly
                                        className="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none"
                                        placeholder="Tên shop sẽ hiển thị sau khi nhập Shop ID"
                                    />

                                    {shopLookup?.shopStatus && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Trạng thái shop: {shopLookup.shopStatus}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Tổng lượt dùng
                            </span>
                            <input
                                type="number"
                                value={form.usageLimit}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        usageLimit: e.target.value,
                                    }))
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
                                    setForm((prev) => ({
                                        ...prev,
                                        perUserLimit: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">
                                Bắt đầu
                            </span>
                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        startTime: e.target.value,
                                    }))
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
                                    setForm((prev) => ({
                                        ...prev,
                                        endTime: e.target.value,
                                    }))
                                }
                                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                            />
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {createMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Lưu mã giảm giá
                        </button>
                    </div>
                </form>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="space-y-3 border-b border-gray-100 p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5">
                            <Search className="h-4 w-4 text-gray-400" />
                            <input
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                className="flex-1 text-sm outline-none"
                                placeholder="Tìm mã giảm giá, tên mã giảm giá, tên shop..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            Tìm
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={scope}
                            onChange={(e) => {
                                setScope(e.target.value as 'all' | AdminVoucherScope)
                                setPage(0)
                            }}
                            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                        >
                            {SCOPE_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as 'all' | AdminVoucherStatus)
                                setPage(0)
                            }}
                            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                        >
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {vouchersQuery.isLoading ? (
                    <div className="flex min-h-[260px] items-center justify-center text-gray-500">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tải mã giảm giá...
                    </div>
                ) : vouchersQuery.isError ? (
                    <div className="p-6 text-red-600">
                        Không thể tải danh sách voucher.
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <TicketPercent className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-3 font-medium">Không có mã giảm giá phù hợp.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Mã giảm giá</th>
                                    <th className="px-4 py-3">Phạm vi</th>
                                    <th className="px-4 py-3">Lượt dùng</th>
                                    <th className="px-4 py-3">Thời hạn</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vouchers.map((voucher) => (
                                    <tr key={voucher.voucherId}>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-gray-900">
                                                {voucher.code}
                                            </div>
                                            <div className="mt-0.5 text-gray-600">
                                                {voucher.voucherName}
                                            </div>
                                            <div className="mt-1 text-xs text-orange-600">
                                                {discountText(voucher)} · Đơn từ{' '}
                                                {formatMoney(
                                                    voucher.minOrderAmount
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {voucher.scope === 'shop' ? (
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Store size={14} />
                                                    {voucher.shopName ||
                                                        `Shop #${voucher.shopId}`}
                                                </div>
                                            ) : (
                                                <span>Toàn sàn</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            <div>
                                                {voucher.usedCount} /{' '}
                                                {voucher.usageLimit}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Đã lưu: {voucher.savedCount}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            <div>{formatDate(voucher.startTime)}</div>
                                            <div className="text-xs text-gray-400">
                                                đến {formatDate(voucher.endTime)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={[
                                                    'rounded-full px-2.5 py-1 text-xs font-medium',
                                                    statusClass(
                                                        voucher.voucherStatus
                                                    ),
                                                ].join(' ')}
                                            >
                                                {statusLabel(voucher.voucherStatus)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/admin/vouchers/${voucher.voucherId}`}
                                                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Eye size={15} />
                                                    Chi tiết
                                                </Link>
                                                <button
                                                    type="button"
                                                    disabled={statusMutation.isPending}
                                                    onClick={() =>
                                                        handleToggleStatus(voucher)
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                                >
                                                    <Power size={15} />
                                                    {voucher.rawStatus === 'inactive'
                                                        ? 'Bật'
                                                        : 'Tắt'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {data && data.totalPages > 1 && (
                    <div className="flex justify-center gap-2 border-t border-gray-100 p-4">
                        {Array.from({ length: data.totalPages }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setPage(i)}
                                className={[
                                    'h-9 w-9 rounded-xl text-sm font-medium',
                                    page === i
                                        ? 'bg-orange-500 text-white'
                                        : 'border bg-white text-gray-600 hover:border-orange-300',
                                ].join(' ')}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
