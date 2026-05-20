import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Loader2,
    MapPin,
    Package,
    ShieldCheck,
    Store,
    TicketPercent,
    Truck,
} from 'lucide-react'
import { addressApi, type UserAddress } from '@/api/addressApi'
import { checkoutApi, type CheckoutSummaryResponse } from '@/api/checkoutApi'
import { voucherApi, type Voucher } from '@/api/voucherApi'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/utils/mask'

function parseCartItemIds(
    stateIds: unknown,
    queryValue: string | null
) {
    if (Array.isArray(stateIds)) {
        return stateIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0)
    }

    if (!queryValue) return []

    return queryValue
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
}

function fullAddress(address: UserAddress) {
    return [
        address.addressLine,
        address.wardName,
        address.districtName,
        address.provinceName,
    ]
        .filter(Boolean)
        .join(', ')
}

function voucherDiscountText(voucher: Voucher) {
    if (voucher.discountType === 'percent') {
        return `Giảm ${voucher.discountValue}%`
    }

    return `Giảm ${formatPrice(voucher.discountValue)}`
}

function getVoucherApplicableSubtotal(
    summary: CheckoutSummaryResponse | undefined,
    voucher: Voucher
) {
    if (!summary) return 0

    if (voucher.scope === 'platform') {
        return summary.subtotalAmount
    }

    const shop = summary.shops.find((item) => item.shopId === voucher.shopId)

    return shop?.shopSubtotal ?? 0
}

function canUseVoucher(
    summary: CheckoutSummaryResponse | undefined,
    voucher: Voucher
) {
    if (!summary) return false

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

    const applicableSubtotal = getVoucherApplicableSubtotal(summary, voucher)
    const minOrderAmount = voucher.minOrderAmount ?? 0

    return applicableSubtotal >= minOrderAmount
}

function voucherConditionText(voucher: Voucher) {
    const parts: string[] = []

    if ((voucher.minOrderAmount ?? 0) > 0) {
        parts.push(`Đơn từ ${formatPrice(voucher.minOrderAmount ?? 0)}`)
    } else {
        parts.push('Không yêu cầu đơn tối thiểu')
    }

    if (
        voucher.discountType === 'percent' &&
        voucher.maxDiscountAmount &&
        voucher.maxDiscountAmount > 0
    ) {
        parts.push(`Tối đa ${formatPrice(voucher.maxDiscountAmount ?? 0)}`)
    }

    return parts.join(' · ')
}

export default function CheckoutPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const setItemCount = useCartStore((state) => state.setItemCount)

    const cartItemIds = useMemo(() => {
        return parseCartItemIds(
            (location.state as { cartItemIds?: number[] } | null)?.cartItemIds,
            searchParams.get('items')
        )
    }, [location.state, searchParams])

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
    const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)

    const {
        data: addresses = [],
        isLoading: isLoadingAddresses,
    } = useQuery({
        queryKey: ['addresses'],
        queryFn: addressApi.getMyAddresses,
        retry: 1,
    })

    const {
        data: savedVouchers = [],
        isLoading: isLoadingVouchers,
    } = useQuery({
        queryKey: ['myVouchers', 'usable'],
        queryFn: () => voucherApi.getMyVouchers({ status: 'usable' }),
        retry: 1,
    })

    const {
        data: summary,
        isLoading: isLoadingSummary,
        isFetching: isFetchingSummary,
        isError: isSummaryError,
        error: summaryError,
    } = useQuery({
        queryKey: ['checkoutSummary', cartItemIds, selectedVoucherId],
        queryFn: () =>
            checkoutApi.getSummary({
                cartItemIds,
                voucherId: selectedVoucherId,
                paymentMethod: 'cod',
            }),
        enabled: cartItemIds.length > 0,
        retry: false,
    })

    useEffect(() => {
        if (selectedAddressId || addresses.length === 0) return

        const defaultAddress = addresses.find((address) => address.isDefault)
        setSelectedAddressId(
            defaultAddress?.addressId ?? addresses[0]?.addressId ?? null
        )
    }, [addresses, selectedAddressId])

    const usableVouchers = useMemo(() => {
        return savedVouchers.filter((voucher) => canUseVoucher(summary, voucher))
    }, [savedVouchers, summary])

    const selectedAddress = useMemo(() => {
        return addresses.find((address) => address.addressId === selectedAddressId)
    }, [addresses, selectedAddressId])

    const placeOrderMutation = useMutation({
        mutationFn: checkoutApi.placeOrder,
        onSuccess: (data) => {
            toast.success(`Đặt hàng thành công: ${data.orderCode}`)
            queryClient.invalidateQueries({ queryKey: ['cart'] })
            queryClient.invalidateQueries({ queryKey: ['myOrders'] })
            queryClient.invalidateQueries({ queryKey: ['myVouchers'] })
            setItemCount(0)
            navigate('/orders', {
                replace: true,
                state: {
                    createdOrderCode: data.orderCode,
                },
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể đặt hàng'
            )
        },
    })

    const handlePlaceOrder = () => {
        if (cartItemIds.length === 0) {
            toast.error('Không có sản phẩm để thanh toán')
            return
        }

        if (!selectedAddressId) {
            toast.error('Vui lòng chọn địa chỉ nhận hàng')
            return
        }

        placeOrderMutation.mutate({
            cartItemIds,
            addressId: selectedAddressId,
            voucherId: selectedVoucherId,
            paymentMethod: 'cod',
        })
    }

    if (cartItemIds.length === 0) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                    <Package className="mx-auto h-14 w-14 text-gray-300" />
                    <h1 className="mt-4 text-xl font-semibold text-gray-900">
                        Chưa có sản phẩm thanh toán
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Quay lại giỏ hàng và chọn sản phẩm cần mua.
                    </p>
                    <Link
                        to="/cart"
                        className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Quay lại giỏ hàng
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/" className="hover:text-orange-600">
                        Trang chủ
                    </Link>
                    <ChevronRight size={16} />
                    <Link to="/cart" className="hover:text-orange-600">
                        Giỏ hàng
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-gray-700">Thanh toán</span>
                </div>

                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Thanh toán
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kiểm tra địa chỉ, sản phẩm, voucher và phương thức thanh toán.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-5">
                        <section className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-orange-500" />
                                    <h2 className="font-semibold text-gray-900">
                                        Địa chỉ nhận hàng
                                    </h2>
                                </div>

                                <Link
                                    to="/addresses"
                                    className="text-sm font-medium text-orange-600 hover:underline"
                                >
                                    Quản lý địa chỉ
                                </Link>
                            </div>

                            {isLoadingAddresses ? (
                                <div className="flex items-center py-6 text-sm text-gray-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tải địa chỉ...
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                                    <p className="text-sm text-gray-500">
                                        Bạn chưa có địa chỉ nhận hàng.
                                    </p>
                                    <Link
                                        to="/addresses"
                                        className="mt-3 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                    >
                                        Thêm địa chỉ
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((address) => (
                                        <label
                                            key={address.addressId}
                                            className={[
                                                'block cursor-pointer rounded-2xl border p-4 transition-colors',
                                                selectedAddressId === address.addressId
                                                    ? 'border-orange-400 bg-orange-50'
                                                    : 'border-gray-100 hover:border-orange-200',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    checked={selectedAddressId === address.addressId}
                                                    onChange={() =>
                                                        setSelectedAddressId(address.addressId)
                                                    }
                                                    className="mt-1 h-4 w-4 accent-orange-500"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-gray-900">
                                                            {address.receiverName}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {address.receiverPhone}
                                                        </span>
                                                        {address.isDefault && (
                                                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {fullAddress(address)}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5 text-orange-500" />
                                <h2 className="font-semibold text-gray-900">
                                    Sản phẩm đặt mua
                                </h2>
                                {isFetchingSummary && (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                )}
                            </div>

                            {isLoadingSummary ? (
                                <div className="flex items-center py-10 text-sm text-gray-500">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Đang tải sản phẩm...
                                </div>
                            ) : isSummaryError ? (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                                    {(summaryError as any)?.response?.data?.message ||
                                        'Không thể tải thông tin thanh toán.'}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {summary?.shops.map((shop) => (
                                        <div
                                            key={shop.shopId}
                                            className="overflow-hidden rounded-2xl border border-gray-100"
                                        >
                                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                    <Store className="h-4 w-4 text-orange-500" />
                                                    {shop.shopName}
                                                </div>
                                                <span className="text-sm font-medium text-orange-600">
                                                    {formatPrice(shop.shopSubtotal)}
                                                </span>
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {shop.items.map((item) => (
                                                    <div
                                                        key={item.cartItemId}
                                                        className="flex gap-3 p-4"
                                                    >
                                                        <Link
                                                            to={`/products/${item.productId}`}
                                                            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
                                                        >
                                                            <img
                                                                src={
                                                                    item.variantImageUrl ||
                                                                    item.thumbnailUrl ||
                                                                    'https://placehold.co/90x90?text=No+Image'
                                                                }
                                                                alt={item.productName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </Link>
                                                        <div className="min-w-0 flex-1">
                                                            <Link
                                                                to={`/products/${item.productId}`}
                                                                className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-orange-600"
                                                            >
                                                                {item.productName}
                                                            </Link>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Phân loại:{' '}
                                                                {item.variantName || item.sku || 'Mặc định'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                Còn {item.stockQuantity} sản phẩm
                                                            </p>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-medium text-orange-600">
                                                                {formatPrice(item.price)}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                x{item.quantity}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                                {formatPrice(item.lineTotal)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <TicketPercent className="h-5 w-5 text-orange-500" />
                                <h2 className="font-semibold text-gray-900">
                                    Voucher đã lưu
                                </h2>
                            </div>

                            {isLoadingVouchers ? (
                                <div className="flex items-center py-5 text-sm text-gray-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tải voucher...
                                </div>
                            ) : savedVouchers.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                                    Chưa có voucher đã lưu.
                                    <Link
                                        to="/vouchers"
                                        className="ml-1 font-medium text-orange-600 hover:underline"
                                    >
                                        Đi lưu voucher
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label
                                        className={[
                                            'block cursor-pointer rounded-2xl border p-4 transition-colors',
                                            selectedVoucherId === null
                                                ? 'border-orange-400 bg-orange-50'
                                                : 'border-gray-100 hover:border-orange-200',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="voucher"
                                                checked={selectedVoucherId === null}
                                                onChange={() => setSelectedVoucherId(null)}
                                                className="h-4 w-4 accent-orange-500"
                                            />
                                            <span className="text-sm font-medium text-gray-800">
                                                Không dùng voucher
                                            </span>
                                        </div>
                                    </label>

                                    {savedVouchers.map((voucher) => {
                                        const usable = canUseVoucher(summary, voucher)
                                        return (
                                            <label
                                                key={voucher.voucherId}
                                                className={[
                                                    'block rounded-2xl border p-4 transition-colors',
                                                    usable
                                                        ? 'cursor-pointer hover:border-orange-200'
                                                        : 'cursor-not-allowed opacity-60',
                                                    selectedVoucherId === voucher.voucherId
                                                        ? 'border-orange-400 bg-orange-50'
                                                        : 'border-gray-100',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="voucher"
                                                        disabled={!usable}
                                                        checked={selectedVoucherId === voucher.voucherId}
                                                        onChange={() => setSelectedVoucherId(voucher.voucherId)}
                                                        className="mt-1 h-4 w-4 accent-orange-500 disabled:opacity-50"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-sm font-semibold text-orange-600">
                                                                {voucher.code}
                                                            </span>
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                                {voucher.scope === 'shop'
                                                                    ? voucher.shopName || 'Voucher shop'
                                                                    : 'Toàn sàn'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-medium text-gray-900">
                                                            {voucher.voucherName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {voucherDiscountText(voucher)} · {voucherConditionText(voucher)}
                                                        </p>
                                                        {!usable && (
                                                            <p className="mt-1 text-xs text-red-500">
                                                                Không áp dụng cho đơn hiện tại.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-orange-500" />
                                <h2 className="font-semibold text-gray-900">
                                    Phương thức thanh toán
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        checked
                                        readOnly
                                        className="h-4 w-4 accent-orange-500"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Thanh toán khi nhận hàng — COD
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Chuyển khoản/VietQR có thể tích hợp sau khi luồng đặt hàng ổn định.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-orange-500" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Tóm tắt thanh toán
                            </h2>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Sản phẩm</span>
                                <span>{summary?.totalItems ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tổng số lượng</span>
                                <span>{summary?.totalQuantity ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tạm tính</span>
                                <span>{formatPrice(summary?.subtotalAmount ?? 0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    Phí vận chuyển
                                </span>
                                <span>{formatPrice(summary?.shippingFee ?? 0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Giảm giá</span>
                                <span className="text-green-600">
                                    -{formatPrice(summary?.discountAmount ?? 0)}
                                </span>
                            </div>

                            {summary?.appliedVoucher && (
                                <div className="rounded-xl bg-green-50 p-3 text-xs text-green-700">
                                    Đã áp dụng voucher{' '}
                                    <span className="font-semibold">
                                        {summary.appliedVoucher.code}
                                    </span>
                                </div>
                            )}

                            {selectedAddress && (
                                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                                    Giao đến:{' '}
                                    <span className="font-medium text-gray-800">
                                        {selectedAddress.receiverName}
                                    </span>
                                    <br />
                                    {fullAddress(selectedAddress)}
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">
                                        Tổng thanh toán
                                    </span>
                                    <span className="text-2xl font-bold text-orange-600">
                                        {formatPrice(summary?.totalAmount ?? 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={
                                placeOrderMutation.isPending ||
                                isLoadingSummary ||
                                isSummaryError ||
                                !summary ||
                                !selectedAddressId
                            }
                            onClick={handlePlaceOrder}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {placeOrderMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang đặt hàng...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Đặt hàng
                                </>
                            )}
                        </button>

                        <p className="mt-3 text-center text-xs text-gray-400">
                            Khi đặt hàng, hệ thống sẽ trừ tồn kho và xóa sản phẩm đã chọn khỏi giỏ hàng.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    )
}
