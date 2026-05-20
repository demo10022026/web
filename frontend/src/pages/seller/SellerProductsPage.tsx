import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Eye,
    Loader2,
    Package,
    Pencil,
    Plus,
    Search,
    Store,
} from 'lucide-react'
import {
    sellerProductApi,
    type SellerProductResponse,
    type SellerProductStatus,
    type SellerProductVariant,
} from '@/api/sellerProductApi'

const STATUS_OPTIONS: Array<{
    label: string
    value: 'all' | SellerProductStatus
}> = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang bán', value: 'active' },
    { label: 'Nháp', value: 'draft' },
    { label: 'Đã ẩn', value: 'inactive' },
    { label: 'Bị khóa', value: 'banned' },
]

function formatMoney(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

function statusLabel(status?: string) {
    switch (status) {
        case 'active':
            return 'Đang bán'
        case 'draft':
            return 'Nháp'
        case 'inactive':
            return 'Đã ẩn'
        case 'banned':
            return 'Bị khóa'
        default:
            return 'Không rõ'
    }
}

function statusClass(status?: string) {
    switch (status) {
        case 'active':
            return 'bg-green-50 text-green-700'
        case 'draft':
            return 'bg-yellow-50 text-yellow-700'
        case 'inactive':
            return 'bg-gray-100 text-gray-600'
        case 'banned':
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

function getMinPrice(product: SellerProductResponse) {
    if (!product.variants || product.variants.length === 0) {
        return 0
    }

    return Math.min(...product.variants.map((variant) => variant.price ?? 0))
}

function getTotalStock(product: SellerProductResponse) {
    return product.variants.reduce(
        (total, variant) => total + (variant.stockQuantity ?? 0),
        0
    )
}

function ProductCard({
                         product,
                         onChangeStatus,
                         onUpdateStock,
                     }: {
    product: SellerProductResponse
    onChangeStatus: (
        product: SellerProductResponse,
        status: Exclude<SellerProductStatus, 'banned'>
    ) => void
    onUpdateStock: (
        product: SellerProductResponse,
        variant: SellerProductVariant
    ) => void
}) {
    const minPrice = getMinPrice(product)
    const totalStock = getTotalStock(product)

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-4 md:flex-row">
                <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 md:w-32">
                    {product.thumbnailUrl ? (
                        <img
                            src={product.thumbnailUrl}
                            alt={product.productName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="line-clamp-2 font-semibold text-gray-900">
                                    {product.productName}
                                </h3>

                                <span
                                    className={[
                                        'rounded-full px-2.5 py-1 text-xs font-medium',
                                        statusClass(product.productStatus),
                                    ].join(' ')}
                                >
                                    {statusLabel(product.productStatus)}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                #{product.productId}
                                {product.categoryName
                                    ? ` · ${product.categoryName}`
                                    : ''}
                                {product.brandName
                                    ? ` · ${product.brandName}`
                                    : ''}
                            </p>
                        </div>

                        <div className="shrink-0 text-left md:text-right">
                            <p className="text-lg font-semibold text-orange-600">
                                {formatMoney(minPrice)}
                            </p>

                            <p className="text-xs text-gray-400">
                                Tồn kho: {totalStock}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Đã bán</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {product.soldCount ?? 0}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Đánh giá</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {product.averageRating ?? 0}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-gray-400">Biến thể</p>
                            <p className="mt-1 font-semibold text-gray-800">
                                {product.variants.length}
                            </p>
                        </div>
                    </div>

                    {product.variants.length > 0 && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
                            {product.variants.map((variant) => (
                                <div
                                    key={variant.variantId}
                                    className="flex flex-col gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-gray-800">
                                            {variant.variantName ||
                                                variant.sku ||
                                                'Biến thể mặc định'}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            SKU: {variant.sku || '-'} · Giá:{' '}
                                            {formatMoney(variant.price)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">
                                            Tồn: {variant.stockQuantity ?? 0}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateStock(product, variant)
                                            }
                                            className="rounded-lg border px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                        >
                                            Sửa tồn
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Link
                            to={`/products/${product.productId}`}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Eye size={15} />
                            Xem public
                        </Link>

                        <Link
                            to={`/seller/products/${product.productId}/edit`}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Pencil size={15} />
                            Sửa sản phẩm
                        </Link>

                        <button
                            type="button"
                            disabled={product.productStatus === 'banned'}
                            onClick={() => {
                                const next =
                                    product.productStatus === 'active'
                                        ? 'inactive'
                                        : 'active'

                                onChangeStatus(product, next)
                            }}
                            className="rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {product.productStatus === 'active'
                                ? 'Ẩn sản phẩm'
                                : 'Đăng bán'}
                        </button>

                        <button
                            type="button"
                            disabled={product.productStatus === 'banned'}
                            onClick={() => onChangeStatus(product, 'draft')}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Pencil size={15} />
                            Chuyển nháp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SellerProductsPage() {
    const queryClient = useQueryClient()

    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [status, setStatus] = useState<'all' | SellerProductStatus>('all')
    const [page, setPage] = useState(0)

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerProducts', keyword, status, page],
        queryFn: () =>
            sellerProductApi.getMyProducts({
                keyword: keyword || undefined,
                status: status === 'all' ? undefined : status,
                page,
                size: 12,
            }),
        staleTime: 0,
    })

    const products = data?.content ?? []

    const updateStatusMutation = useMutation({
        mutationFn: ({
                         productId,
                         productStatus,
                     }: {
            productId: number
            productStatus: Exclude<SellerProductStatus, 'banned'>
        }) => sellerProductApi.updateProductStatus(productId, productStatus),

        onSuccess: () => {
            toast.success('Cập nhật trạng thái thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                'Không thể cập nhật trạng thái'
            )
        },
    })

    const updateStockMutation = useMutation({
        mutationFn: ({
                         productId,
                         variantId,
                         stockQuantity,
                     }: {
            productId: number
            variantId: number
            stockQuantity: number
        }) =>
            sellerProductApi.updateVariantStock(
                productId,
                variantId,
                stockQuantity
            ),

        onSuccess: () => {
            toast.success('Cập nhật tồn kho thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật tồn kho'
            )
        },
    })

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleStatusChange = (next: 'all' | SellerProductStatus) => {
        setStatus(next)
        setPage(0)
    }

    const handleChangeProductStatus = (
        product: SellerProductResponse,
        productStatus: Exclude<SellerProductStatus, 'banned'>
    ) => {
        updateStatusMutation.mutate({
            productId: product.productId,
            productStatus,
        })
    }

    const handleUpdateStock = (
        product: SellerProductResponse,
        variant: SellerProductVariant
    ) => {
        const value = window.prompt(
            `Nhập tồn kho mới cho "${variant.variantName || variant.sku || 'Biến thể'}"`,
            String(variant.stockQuantity ?? 0)
        )

        if (value === null) return

        const stock = Number(value)

        if (!Number.isInteger(stock) || stock < 0) {
            toast.error('Tồn kho phải là số nguyên không âm')
            return
        }

        updateStockMutation.mutate({
            productId: product.productId,
            variantId: variant.variantId,
            stockQuantity: stock,
        })
    }

    const totalActive = useMemo(() => {
        return products.filter((item) => item.productStatus === 'active').length
    }, [products])

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý sản phẩm
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Xem, ẩn/hiện sản phẩm và cập nhật tồn kho biến thể.
                    </p>
                </div>

                <Link
                    to="/seller/products/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Plus size={17} />
                    Thêm sản phẩm
                </Link>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Trang hiện tại</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {products.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Đang bán trong trang</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                        {totalActive}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {data?.totalElements ?? 0}
                    </p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2"
                    >
                        <Search className="h-4 w-4 text-gray-400" />

                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tìm theo tên sản phẩm, danh mục, thương hiệu..."
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
                    </form>

                    <div className="flex gap-2 overflow-x-auto">
                        {STATUS_OPTIONS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => handleStatusChange(item.value)}
                                className={[
                                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium',
                                    status === item.value
                                        ? 'bg-orange-500 text-white'
                                        : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                                ].join(' ')}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải sản phẩm...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải danh sách sản phẩm.
                </div>
            ) : products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                    <Store className="mx-auto h-12 w-12 text-gray-300" />

                    <h2 className="mt-4 font-semibold text-gray-800">
                        Chưa có sản phẩm phù hợp
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Thử đổi bộ lọc hoặc thêm sản phẩm mới.
                    </p>

                    <Link
                        to="/seller/products/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        <Plus size={17} />
                        Thêm sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.productId}
                            product={product}
                            onChangeStatus={handleChangeProductStatus}
                            onUpdateStock={handleUpdateStock}
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

            {(updateStatusMutation.isPending || updateStockMutation.isPending) && (
                <div className="fixed bottom-4 right-4 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
                    Đang cập nhật...
                </div>
            )}

        </div>
    )
}