import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Check,
    Clipboard,
    Loader2,
    Search,
    ShoppingBag,
    Store,
    TicketPercent,
    Trash2,
} from 'lucide-react'
import {
    voucherApi,
    type Voucher,
    type VoucherScope,
} from '@/api/voucherApi'

type MainTab = 'available' | 'saved'
type SavedStatus = 'all' | 'usable' | 'expired' | 'used'
type ScopeFilter = 'all' | VoucherScope

const AVAILABLE_SCOPES: Array<{
    label: string
    value: ScopeFilter
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Toàn sàn', value: 'platform' },
    { label: 'Theo shop', value: 'shop' },
]

const SAVED_STATUSES: Array<{
    label: string
    value: SavedStatus
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Có thể dùng', value: 'usable' },
    { label: 'Hết hạn/Tạm dừng', value: 'expired' },
    { label: 'Đã dùng hết lượt', value: 'used' },
]

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

function discountText(voucher: Voucher) {
    if (voucher.discountType === 'percent') {
        return `Giảm ${voucher.discountValue}%`
    }

    return `Giảm ${formatMoney(voucher.discountValue)}`
}

function conditionText(voucher: Voucher) {
    const parts: string[] = []

    if ((voucher.minOrderAmount ?? 0) > 0) {
        parts.push(`Đơn tối thiểu ${formatMoney(voucher.minOrderAmount)}`)
    } else {
        parts.push('Không yêu cầu đơn tối thiểu')
    }

    if (
        voucher.discountType === 'percent' &&
        voucher.maxDiscountAmount &&
        voucher.maxDiscountAmount > 0
    ) {
        parts.push(`Tối đa ${formatMoney(voucher.maxDiscountAmount)}`)
    }

    if ((voucher.perUserLimit ?? 0) > 0) {
        parts.push(`Mỗi tài khoản ${voucher.perUserLimit} lượt`)
    }

    return parts.join(' · ')
}

function scopeText(voucher: Voucher) {
    if (voucher.scope === 'shop') {
        return voucher.shopName
            ? `Voucher shop: ${voucher.shopName}`
            : 'Voucher shop'
    }

    return 'Voucher toàn sàn'
}

function getShopPath(voucher: Voucher) {
    if (voucher.scope !== 'shop') return null

    const shopKey = voucher.shopSlug || voucher.shopId

    if (!shopKey) return null

    return `/shops/${shopKey}`
}

function isExpiredSoon(voucher: Voucher) {
    if (!voucher.endTime) return false

    const end = new Date(voucher.endTime).getTime()
    const now = Date.now()
    const diff = end - now

    return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000
}

function canSaveVoucher(voucher: Voucher) {
    if (voucher.saved) return false

    // @ts-ignore
    if (
        voucher.voucherStatus === 'inactive' ||
        voucher.voucherStatus === 'expired' ||
        voucher.voucherStatus === 'used_out' ||
        voucher.voucherStatus === 'upcoming'
    ) {
        return false
    }

    const usageLimit = voucher.usageLimit ?? 0
    const usedCount = voucher.usedCount ?? 0

    if (usageLimit > 0 && usedCount >= usageLimit) {
        return false
    }

    const perUserLimit = voucher.perUserLimit ?? 0
    const userUsedCount = voucher.userUsedCount ?? 0

    if (perUserLimit > 0 && userUsedCount >= perUserLimit) {
        return false
    }

    return true
}

function isVoucherVisuallyUsable(voucher: Voucher) {
    if (
        voucher.voucherStatus === 'inactive' ||
        voucher.voucherStatus === 'expired' ||
        voucher.voucherStatus === 'used_out'
    ) {
        return false
    }

    return true
}

function EmptyState({
                        mode,
                    }: {
    mode: MainTab
}) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <TicketPercent className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 font-semibold text-gray-800">
                {mode === 'available'
                    ? 'Chưa có voucher khả dụng'
                    : 'Bạn chưa lưu voucher nào'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                {mode === 'available'
                    ? 'Khi có chương trình khuyến mãi, voucher sẽ hiển thị tại đây.'
                    : 'Lưu voucher để dùng nhanh khi thanh toán.'}
            </p>
        </div>
    )
}

function VoucherCard({
                         voucher,
                         mode,
                         onSave,
                         onRemove,
                         saving,
                         removing,
                     }: {
    voucher: Voucher
    mode: MainTab
    onSave: (voucher: Voucher) => void
    onRemove: (voucher: Voucher) => void
    saving: boolean
    removing: boolean
}) {
    const canSave = canSaveVoucher(voucher)
    const visuallyUsable = isVoucherVisuallyUsable(voucher)

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(voucher.code)
            toast.success('Đã sao chép mã voucher')
        } catch {
            toast.error('Không thể sao chép mã')
        }
    }

    return (
        <div
            className={[
                'overflow-hidden rounded-2xl border bg-white shadow-sm',
                visuallyUsable
                    ? 'border-gray-100'
                    : 'border-gray-200 opacity-75',
            ].join(' ')}
        >
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr]">
                <div className="relative flex flex-col items-center justify-center bg-orange-50 p-4 text-center">
                    <div className="absolute bottom-[-8px] right-[-8px] h-4 w-4 rounded-full bg-gray-50" />
                    <div className="absolute right-[-8px] top-[-8px] h-4 w-4 rounded-full bg-gray-50" />

                    <TicketPercent className="h-8 w-8 text-orange-500" />

                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-orange-500">
                        {voucher.scope === 'platform' ? 'Toàn sàn' : 'Shop'}
                    </p>

                    <p className="mt-1 text-lg font-bold text-orange-600">
                        {voucher.discountType === 'percent'
                            ? `${voucher.discountValue}%`
                            : formatMoney(voucher.discountValue)}
                    </p>
                </div>

                <div className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <h3 className="line-clamp-2 font-semibold text-gray-900">
                                {voucher.voucherName}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-orange-600">
                                {discountText(voucher)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                {conditionText(voucher)}
                            </p>
                        </div>

                        <div className="shrink-0">
                            {voucher.saved ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                    <Check size={13} />
                                    Đã lưu
                                </span>
                            ) : (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                                    Chưa lưu
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-gray-500 md:grid-cols-2">
                        <div className="flex items-center gap-1">
                            {voucher.scope === 'shop' ? (
                                <Store size={14} />
                            ) : (
                                <ShoppingBag size={14} />
                            )}

                            {voucher.scope === 'shop' && getShopPath(voucher) ? (
                                <Link
                                    to={getShopPath(voucher)!}
                                    className="font-medium text-orange-600 hover:underline"
                                >
                                    {voucher.shopName
                                        ? `Voucher shop: ${voucher.shopName}`
                                        : 'Voucher shop'}
                                </Link>
                            ) : (
                                <span>{scopeText(voucher)}</span>
                            )}
                        </div>

                        <div>Hết hạn: {formatDate(voucher.endTime)}</div>

                        <div>
                            Đã dùng: {voucher.usedCount ?? 0}
                            {voucher.usageLimit
                                ? ` / ${voucher.usageLimit}`
                                : ''}
                        </div>

                        <div>
                            Lượt của bạn: {voucher.userUsedCount ?? 0} /{' '}
                            {voucher.perUserLimit ?? 1}
                        </div>
                    </div>

                    {isExpiredSoon(voucher) && visuallyUsable && (
                        <div className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                            Voucher sắp hết hạn.
                        </div>
                    )}

                    {!visuallyUsable && voucher.unavailableReason && (
                        <div className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-600">
                            {voucher.unavailableReason}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex max-w-full items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-mono font-semibold text-gray-800">
                                {voucher.code}
                            </span>

                            <button
                                type="button"
                                onClick={copyCode}
                                className="text-gray-400 hover:text-orange-500"
                                title="Sao chép mã"
                            >
                                <Clipboard size={15} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            {voucher.scope === 'shop' && voucher.shopSlug && (
                                <Link
                                    to={`/shops/${voucher.shopSlug}`}
                                    className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Xem shop
                                </Link>
                            )}

                            {mode === 'available' ? (
                                <button
                                    type="button"
                                    disabled={saving || !canSave}
                                    onClick={() => onSave(voucher)}
                                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {voucher.saved
                                        ? 'Đã lưu'
                                        : saving
                                            ? 'Đang lưu...'
                                            : 'Lưu voucher'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={
                                        removing ||
                                        (voucher.userUsedCount ?? 0) > 0
                                    }
                                    onClick={() => onRemove(voucher)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {removing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 size={15} />
                                    )}
                                    Bỏ lưu
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function VouchersPage() {
    const queryClient = useQueryClient()

    const [mainTab, setMainTab] = useState<MainTab>('available')
    const [scope, setScope] = useState<ScopeFilter>('all')
    const [savedStatus, setSavedStatus] = useState<SavedStatus>('all')
    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')

    const availableQuery = useQuery({
        queryKey: ['availableVouchers', scope],
        queryFn: () =>
            voucherApi.getAvailable({
                scope,
            }),
        enabled: mainTab === 'available',
        staleTime: 0,
    })

    const myQuery = useQuery({
        queryKey: ['myVouchers', savedStatus],
        queryFn: () =>
            voucherApi.getMyVouchers({
                status: savedStatus,
            }),
        enabled: mainTab === 'saved',
        staleTime: 0,
    })

    const saveMutation = useMutation({
        mutationFn: voucherApi.saveVoucher,
        onSuccess: () => {
            toast.success('Đã lưu voucher')
            queryClient.invalidateQueries({
                queryKey: ['availableVouchers'],
            })
            queryClient.invalidateQueries({
                queryKey: ['myVouchers'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể lưu voucher'
            )
        },
    })

    const removeMutation = useMutation({
        mutationFn: voucherApi.removeSavedVoucher,
        onSuccess: () => {
            toast.success('Đã bỏ lưu voucher')
            queryClient.invalidateQueries({
                queryKey: ['availableVouchers'],
            })
            queryClient.invalidateQueries({
                queryKey: ['myVouchers'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể bỏ lưu voucher'
            )
        },
    })

    const sourceData =
        mainTab === 'available'
            ? availableQuery.data ?? []
            : myQuery.data ?? []

    const filteredVouchers = useMemo(() => {
        const cleanKeyword = keyword.trim().toLowerCase()

        if (!cleanKeyword) return sourceData

        return sourceData.filter((voucher) => {
            return (
                voucher.code.toLowerCase().includes(cleanKeyword) ||
                voucher.voucherName.toLowerCase().includes(cleanKeyword) ||
                (voucher.shopName ?? '').toLowerCase().includes(cleanKeyword)
            )
        })
    }, [sourceData, keyword])

    const isLoading =
        mainTab === 'available'
            ? availableQuery.isLoading
            : myQuery.isLoading

    const isError =
        mainTab === 'available'
            ? availableQuery.isError
            : myQuery.isError

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
    }

    const handleSave = (voucher: Voucher) => {
        saveMutation.mutate(voucher.voucherId)
    }

    const handleRemove = (voucher: Voucher) => {
        const ok = window.confirm(`Bỏ lưu voucher "${voucher.code}"?`)

        if (!ok) return

        removeMutation.mutate(voucher.voucherId)
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">
                    Voucher của tôi
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Lưu mã giảm giá để dùng khi thanh toán.
                </p>
            </div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => setMainTab('available')}
                        className={[
                            'flex-1 border-b-2 px-4 py-4 text-sm font-semibold',
                            mainTab === 'available'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-600 hover:text-orange-600',
                        ].join(' ')}
                    >
                        Kho voucher
                    </button>

                    <button
                        type="button"
                        onClick={() => setMainTab('saved')}
                        className={[
                            'flex-1 border-b-2 px-4 py-4 text-sm font-semibold',
                            mainTab === 'saved'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-600 hover:text-orange-600',
                        ].join(' ')}
                    >
                        Đã lưu
                    </button>
                </div>

                <div className="space-y-3 p-4">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center gap-3"
                    >
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                            <Search className="h-4 w-4 text-gray-400" />

                            <input
                                value={keywordInput}
                                onChange={(e) =>
                                    setKeywordInput(e.target.value)
                                }
                                placeholder="Tìm theo mã voucher, tên voucher hoặc tên shop..."
                                className="flex-1 text-sm outline-none"
                            />

                            {keyword && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKeyword('')
                                        setKeywordInput('')
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

                    {mainTab === 'available' ? (
                        <div className="flex gap-2 overflow-x-auto">
                            {AVAILABLE_SCOPES.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setScope(item.value)}
                                    className={[
                                        'shrink-0 rounded-full px-4 py-2 text-sm font-medium',
                                        scope === item.value
                                            ? 'bg-orange-500 text-white'
                                            : 'border border-gray-200 text-gray-600 hover:border-orange-300',
                                    ].join(' ')}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto">
                            {SAVED_STATUSES.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setSavedStatus(item.value)
                                    }
                                    className={[
                                        'shrink-0 rounded-full px-4 py-2 text-sm font-medium',
                                        savedStatus === item.value
                                            ? 'bg-orange-500 text-white'
                                            : 'border border-gray-200 text-gray-600 hover:border-orange-300',
                                    ].join(' ')}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải voucher...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải danh sách voucher.
                </div>
            ) : filteredVouchers.length === 0 ? (
                <EmptyState mode={mainTab} />
            ) : (
                <div className="space-y-4">
                    {filteredVouchers.map((voucher) => (
                        <VoucherCard
                            key={voucher.voucherId}
                            voucher={voucher}
                            mode={mainTab}
                            onSave={handleSave}
                            onRemove={handleRemove}
                            saving={
                                saveMutation.isPending &&
                                saveMutation.variables === voucher.voucherId
                            }
                            removing={
                                removeMutation.isPending &&
                                removeMutation.variables === voucher.voucherId
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}