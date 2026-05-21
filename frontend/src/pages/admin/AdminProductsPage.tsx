import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Ban,
    CheckCircle2,
    Eye,
    Loader2,
    Package,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProductApi.ts'
import type {
    AdminProductResponse,
    ProductStatus,
} from '@/types/adminProduct.types'
import { formatPrice } from '@/utils/mask'

const STATUS_OPTIONS: Array<{ value: '' | ProductStatus; label: string }> = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Nháp' },
    { value: 'active', label: 'Đang bán' },
    { value: 'inactive', label: 'Đã ẩn' },
    { value: 'banned', label: 'Bị khóa' },
]

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Mới nhất' },
    { value: 'updatedAt', label: 'Cập nhật gần đây' },
    { value: 'soldCount', label: 'Bán chạy' },
    { value: 'averageRating', label: 'Đánh giá cao' },
    { value: 'productName', label: 'Tên sản phẩm' },
]

function statusLabel(status: ProductStatus) {
    switch (status) {
        case 'active':
            return 'Đang bán'
        case 'inactive':
            return 'Đã ẩn'
        case 'banned':
            return 'Bị khóa'
        case 'draft':
            return 'Nháp'
        default:
            return status
    }
}

function statusClass(status: ProductStatus) {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'inactive':
            return 'bg-gray-50 text-gray-600 border-gray-200'
        case 'banned':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'draft':
            return 'bg-amber-50 text-amber-700 border-amber-200'
        default:
            return 'bg-gray-50 text-gray-600 border-gray-200'
    }
}

function formatDate(value?: string) {
    if (!value) return '-'
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value))
}

function safePrice(value?: number) {
    if (value === undefined || value === null) return 'Chưa có giá'
    return formatPrice(value)
}

export default function AdminProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryClient = useQueryClient()

    const page = Number(searchParams.get('page') || 0)
    const status = (searchParams.get('status') || '') as '' | ProductStatus
    const keyword = searchParams.get('keyword') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const direction = (searchParams.get('direction') || 'desc') as 'asc' | 'desc'

    const [keywordInput, setKeywordInput] = useState(keyword)
    const [shopIdInput, setShopIdInput] = useState(searchParams.get('shopId') || '')
    const [categoryIdInput, setCategoryIdInput] = useState(
        searchParams.get('categoryId') || ''
    )
    const [brandIdInput, setBrandIdInput] = useState(
        searchParams.get('brandId') || ''
    )

    const filters = useMemo(() => {
        const shopId = searchParams.get('shopId')
        const categoryId = searchParams.get('categoryId')
        const brandId = searchParams.get('brandId')

        return {
            keyword: keyword || undefined,
            status: status || undefined,
            shopId: shopId ? Number(shopId) : undefined,
            categoryId: categoryId ? Number(categoryId) : undefined,
            brandId: brandId ? Number(brandId) : undefined,
            page,
            size: 10,
            sortBy,
            direction,
        }
    }, [searchParams, keyword, status, page, sortBy, direction])

    const {
        data,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['adminProducts', filters],
        queryFn: () => adminProductApi.getProducts(filters),
        staleTime: 30 * 1000,
    })

    const statusMutation = useMutation({
        mutationFn: ({
                         productId,
                         productStatus,
                         reason,
                     }: {
            productId: number
            productStatus: ProductStatus
            reason?: string
        }) =>
            adminProductApi.updateStatus(productId, {
                productStatus,
                reason,
            }),
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái sản phẩm')
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
        },
        onError: () => {
            toast.error('Không thể cập nhật trạng thái')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (productId: number) => adminProductApi.softDelete(productId),
        onSuccess: () => {
            toast.success('Đã ẩn sản phẩm')
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
        },
        onError: () => {
            toast.error('Không thể ẩn sản phẩm')
        },
    })

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams)

        if (value) next.set(key, value)
        else next.delete(key)

        if (key !== 'page') {
            next.set('page', '0')
        }

        setSearchParams(next)
    }

    const handleSearch = () => {
        const next = new URLSearchParams(searchParams)

        if (keywordInput.trim()) next.set('keyword', keywordInput.trim())
        else next.delete('keyword')

        if (shopIdInput.trim()) next.set('shopId', shopIdInput.trim())
        else next.delete('shopId')

        if (categoryIdInput.trim()) next.set('categoryId', categoryIdInput.trim())
        else next.delete('categoryId')

        if (brandIdInput.trim()) next.set('brandId', brandIdInput.trim())
        else next.delete('brandId')

        next.set('page', '0')
        setSearchParams(next)
    }

    const clearFilters = () => {
        setKeywordInput('')
        setShopIdInput('')
        setCategoryIdInput('')
        setBrandIdInput('')
        setSearchParams({})
    }

    const handleChangeStatus = (
        product: AdminProductResponse,
        nextStatus: ProductStatus
    ) => {
        if (product.productStatus === nextStatus) return

        const ok = window.confirm(
            `Đổi trạng thái "${product.productName}" sang "${statusLabel(nextStatus)}"?`
        )

        if (!ok) return

        statusMutation.mutate({
            productId: product.productId,
            productStatus: nextStatus,
            reason: `Admin đổi trạng thái từ frontend sang ${nextStatus}`,
        })
    }

    const handleSoftDelete = (product: AdminProductResponse) => {
        const ok = window.confirm(`Ẩn sản phẩm "${product.productName}"?`)
        if (!ok) return

        deleteMutation.mutate(product.productId)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quản lý sản phẩm
                        </h1>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw
                        size={16}
                        className={isFetching ? 'animate-spin' : undefined}
                    />
                    Làm mới
                </button>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-5">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch()
                                }}
                                placeholder="Tên sản phẩm hoặc tên shop"
                                className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                            Trạng thái
                        </label>
                        <select
                            value={status}
                            onChange={(e) => updateParam('status', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        >
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value || 'all'} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                            Sắp xếp
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => updateParam('sortBy', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        >
                            {SORT_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                            Chiều
                        </label>
                        <select
                            value={direction}
                            onChange={(e) => updateParam('direction', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        >
                            <option value="desc">Giảm dần</option>
                            <option value="asc">Tăng dần</option>
                        </select>
                    </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-5">
                    <input
                        value={shopIdInput}
                        onChange={(e) => setShopIdInput(e.target.value)}
                        type="number"
                        placeholder="Shop ID"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    <input
                        value={categoryIdInput}
                        onChange={(e) => setCategoryIdInput(e.target.value)}
                        type="number"
                        placeholder="Category ID"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    <input
                        value={brandIdInput}
                        onChange={(e) => setBrandIdInput(e.target.value)}
                        type="number"
                        placeholder="Brand ID"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />

                    <button
                        type="button"
                        onClick={handleSearch}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                    >
                        Áp dụng
                    </button>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Xóa lọc
                    </button>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package size={17} />
                        <span>
              {data ? `${data.totalElements} sản phẩm` : 'Danh sách sản phẩm'}
            </span>
                    </div>

                    {isFetching && !isLoading && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Đang cập nhật
            </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-60 items-center justify-center text-gray-500">
                        <Loader2 className="mr-2 animate-spin" size={20} />
                        Đang tải sản phẩm...
                    </div>
                ) : !data?.content?.length ? (
                    <div className="flex h-60 flex-col items-center justify-center text-gray-500">
                        <Package size={36} className="mb-2 text-gray-300" />
                        Không có sản phẩm phù hợp.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Sản phẩm</th>
                                <th className="px-4 py-3">Shop</th>
                                <th className="px-4 py-3">Danh mục</th>
                                <th className="px-4 py-3">Giá</th>
                                <th className="px-4 py-3">Kho</th>
                                <th className="px-4 py-3">Đã bán</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Ngày tạo</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {data.content.map((product) => (
                                <tr key={product.productId} className="hover:bg-gray-50/70">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    product.thumbnailUrl ||
                                                    'https://placehold.co/64x64?text=No+Image'
                                                }
                                                alt={product.productName}
                                                className="h-14 w-14 rounded-xl border border-gray-100 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        'https://placehold.co/64x64?text=No+Image'
                                                }}
                                            />
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 font-medium text-gray-900">
                                                    {product.productName}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    ID: {product.productId} ·{' '}
                                                    {product.variantCount || 0} biến thể ·{' '}
                                                    {product.imageCount || 0} ảnh
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {product.shopName || '-'}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {product.categoryName || '-'}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {safePrice(product.minPrice)}
                                        </div>
                                        {product.originalPrice &&
                                            product.originalPrice > (product.minPrice || 0) && (
                                                <div className="text-xs text-gray-400 line-through">
                                                    {formatPrice(product.originalPrice)}
                                                </div>
                                            )}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {product.totalStock ?? 0}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {product.soldCount ?? 0}
                                    </td>

                                    <td className="px-4 py-3">
                      <span
                          className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              statusClass(product.productStatus),
                          ].join(' ')}
                      >
                        {statusLabel(product.productStatus)}
                      </span>
                                    </td>

                                    <td className="px-4 py-3 text-gray-500">
                                        {formatDate(product.createdAt)}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <Link
                                                to={`/admin/products/${product.productId}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-orange-600"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleChangeStatus(product, 'active')}
                                                disabled={statusMutation.isPending}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-emerald-600"
                                                title="Cho bán"
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleChangeStatus(product, 'banned')}
                                                disabled={statusMutation.isPending}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-red-600"
                                                title="Khóa"
                                            >
                                                <Ban size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleSoftDelete(product)}
                                                disabled={deleteMutation.isPending}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-gray-900"
                                                title="Ẩn"
                                            >
                                                <Trash2 size={16} />
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
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                        <p className="text-sm text-gray-500">
                            Trang {data.number + 1} / {data.totalPages}
                        </p>

                        <div className="flex gap-1">
                            {Array.from({ length: data.totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => updateParam('page', String(index))}
                                    className={[
                                        'h-9 min-w-9 rounded-lg px-3 text-sm font-medium',
                                        index === page
                                            ? 'bg-orange-500 text-white'
                                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                                    ].join(' ')}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}