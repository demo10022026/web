import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ChevronRight,
    Loader2,
    Minus,
    PackageOpen,
    Plus,
    ShoppingCart,
    Store,
    Trash2,
} from 'lucide-react'
import { cartApi } from '@/api/cartApi'
import { useCartStore } from '@/store/cartStore'
import type { CartItem } from '@/types/cart.types'
import { formatPrice } from '@/utils/mask'

export default function CartPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const setItemCount = useCartStore((state) => state.setItemCount)

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    const { data: cart, isLoading, isFetching } = useQuery({
        queryKey: ['cart'],
        queryFn: cartApi.getCart,
        retry: 1,
    })

    useEffect(() => {
        if (!cart) return
        setItemCount(cart.totalQuantity || 0)
    }, [cart, setItemCount])

    const allItems = useMemo(() => {
        return cart?.shops.flatMap((shop) => shop.items) ?? []
    }, [cart])

    const selectedItems = useMemo(() => {
        return allItems.filter((item) => selectedIds.has(item.cartItemId))
    }, [allItems, selectedIds])

    const selectedTotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            return sum + item.price * item.quantity
        }, 0)
    }, [selectedItems])

    const allSelected =
        allItems.length > 0 && selectedIds.size === allItems.length

    const updateMutation = useMutation({
        mutationFn: ({
                         cartItemId,
                         quantity,
                     }: {
            cartItemId: number
            quantity: number
        }) => cartApi.updateItem(cartItemId, { quantity }),
        onSuccess: (data) => {
            queryClient.setQueryData(['cart'], data)
            setItemCount(data.totalQuantity || 0)
        },
        onError: () => {
            toast.error('Không thể cập nhật số lượng')
        },
    })

    const removeMutation = useMutation({
        mutationFn: (cartItemId: number) => cartApi.removeItem(cartItemId),
        onSuccess: (data) => {
            queryClient.setQueryData(['cart'], data)
            setItemCount(data.totalQuantity || 0)
        },
        onError: () => {
            toast.error('Không thể xóa sản phẩm')
        },
    })

    const clearMutation = useMutation({
        mutationFn: cartApi.clearCart,
        onSuccess: (data) => {
            queryClient.setQueryData(['cart'], data)
            setItemCount(0)
            setSelectedIds(new Set())
            toast.success('Đã xóa toàn bộ giỏ hàng')
        },
        onError: () => {
            toast.error('Không thể xóa giỏ hàng')
        },
    })

    const toggleItem = (cartItemId: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)

            if (next.has(cartItemId)) {
                next.delete(cartItemId)
            } else {
                next.add(cartItemId)
            }

            return next
        })
    }

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
            return
        }

        setSelectedIds(new Set(allItems.map((item) => item.cartItemId)))
    }

    const handleUpdateQuantity = (item: CartItem, nextQuantity: number) => {
        if (nextQuantity < 1) return

        if (nextQuantity > item.stockQuantity) {
            toast.error(`Chỉ còn ${item.stockQuantity} sản phẩm`)
            return
        }

        updateMutation.mutate({
            cartItemId: item.cartItemId,
            quantity: nextQuantity,
        })
    }

    const handleRemove = (item: CartItem) => {
        const ok = window.confirm(`Xóa "${item.productName}" khỏi giỏ hàng?`)
        if (!ok) return

        removeMutation.mutate(item.cartItemId)

        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(item.cartItemId)
            return next
        })
    }

    const handleClear = () => {
        const ok = window.confirm('Xóa toàn bộ sản phẩm trong giỏ hàng?')
        if (!ok) return

        clearMutation.mutate()
    }

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn sản phẩm để mua')
            return
        }

        navigate('/checkout', {
            state: {
                cartItemIds: selectedItems.map((item) => item.cartItemId),
            },
        })
    }

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="flex h-72 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm">
                    <Loader2 className="mr-2 animate-spin" size={22} />
                    Đang tải giỏ hàng...
                </div>
            </div>
        )
    }

    if (!cart || allItems.length === 0) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
                    <PackageOpen className="mx-auto mb-4 text-gray-300" size={64} />
                    <h1 className="text-xl font-semibold text-gray-900">
                        Giỏ hàng đang trống
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Thêm sản phẩm vào giỏ để tiếp tục mua hàng.
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-100">
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/" className="hover:text-orange-600">
                        Trang chủ
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-gray-700">Giỏ hàng</span>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {cart.totalItems} sản phẩm, {cart.totalQuantity} số lượng
                            {isFetching ? ' · đang cập nhật...' : ''}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={clearMutation.isPending}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Xóa toàn bộ
                    </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <section className="space-y-4">
                        <div className="rounded-2xl bg-white shadow-sm">
                            <div className="grid grid-cols-[40px_1fr_150px_150px_100px] items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="h-4 w-4 accent-orange-500"
                                />
                                <span>Sản phẩm</span>
                                <span className="text-center">Đơn giá</span>
                                <span className="text-center">Số lượng</span>
                                <span className="text-right">Thao tác</span>
                            </div>
                        </div>

                        {cart.shops.map((shop) => (
                            <div
                                key={shop.shopId}
                                className="overflow-hidden rounded-2xl bg-white shadow-sm"
                            >
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-800">
                                    <Store size={17} className="text-orange-500" />
                                    <span>{shop.shopName}</span>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {shop.items.map((item) => (
                                        <div
                                            key={item.cartItemId}
                                            className="grid grid-cols-[40px_1fr_150px_150px_100px] items-center gap-3 px-4 py-4"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(item.cartItemId)}
                                                onChange={() => toggleItem(item.cartItemId)}
                                                className="h-4 w-4 accent-orange-500"
                                            />

                                            <div className="flex min-w-0 gap-3">
                                                <Link to={`/products/${item.productId}`}>
                                                    <img
                                                        src={
                                                            item.variantImageUrl ||
                                                            item.thumbnailUrl ||
                                                            'https://placehold.co/90x90?text=No+Image'
                                                        }
                                                        alt={item.productName}
                                                        className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                'https://placehold.co/90x90?text=No+Image'
                                                        }}
                                                    />
                                                </Link>

                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/products/${item.productId}`}
                                                        className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-orange-600"
                                                    >
                                                        {item.productName}
                                                    </Link>

                                                    {item.variantName && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Phân loại: {item.variantName}
                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Còn {item.stockQuantity} sản phẩm
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="font-medium text-orange-600">
                                                    {formatPrice(item.price)}
                                                </div>

                                                {item.originalPrice &&
                                                    item.originalPrice > item.price && (
                                                        <div className="text-xs text-gray-400 line-through">
                                                            {formatPrice(item.originalPrice)}
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="mx-auto flex w-fit items-center overflow-hidden rounded-xl border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateQuantity(item, item.quantity - 1)
                                                    }
                                                    disabled={
                                                        item.quantity <= 1 || updateMutation.isPending
                                                    }
                                                    className="px-3 py-2 text-gray-500 hover:text-orange-600 disabled:text-gray-300"
                                                >
                                                    <Minus size={14} />
                                                </button>

                                                <span className="min-w-10 px-2 text-center text-sm">
                          {item.quantity}
                        </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateQuantity(item, item.quantity + 1)
                                                    }
                                                    disabled={
                                                        item.quantity >= item.stockQuantity ||
                                                        updateMutation.isPending
                                                    }
                                                    className="px-3 py-2 text-gray-500 hover:text-orange-600 disabled:text-gray-300"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item)}
                                                    disabled={removeMutation.isPending}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={15} />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <ShoppingCart className="text-orange-500" size={20} />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Tóm tắt giỏ hàng
                            </h2>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Sản phẩm đã chọn</span>
                                <span>{selectedItems.length}</span>
                            </div>

                            <div className="flex justify-between text-gray-600">
                                <span>Tổng số lượng</span>
                                <span>
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
                            </div>

                            <div className="border-t border-gray-100 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Tổng tiền</span>
                                    <span className="text-2xl font-bold text-orange-600">
                    {formatPrice(selectedTotal)}
                  </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCheckout}
                            className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            Mua hàng
                        </button>

                        <p className="mt-3 text-center text-xs text-gray-400">
                            Checkout sẽ làm ở bước tiếp theo.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    )
}