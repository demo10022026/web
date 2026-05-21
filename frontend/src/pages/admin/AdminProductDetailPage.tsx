import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    ImageIcon,
    Loader2,
    Package,
    Save,
    ShieldAlert,
    Trash2,
} from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProductApi.ts'
import { sellerProductApi } from '@/api/sellerProductApi'
import type {
    AdminProductUpdateRequest,
    ProductStatus,
} from '@/types/adminProduct.types'
import { formatPrice } from '@/utils/mask'
import { useAuthStore } from '@/store/authStore'

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

function normalizeText(value: string) {
    return value.trim().toLowerCase()
}

export default function AdminProductDetailPage() {
    const { productId } = useParams<{ productId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const user = useAuthStore((state) => state.user)
    const isAdmin = user?.role === 'admin'

    const id = Number(productId)

    const [form, setForm] = useState({
        productName: '',
        description: '',
        thumbnailUrl: '',
        parentCategoryName: '',
        categoryName: '',
        brandName: '',
        productStatus: 'draft' as ProductStatus,
    })

    const {
        data: product,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminProductDetail', id],
        queryFn: () => adminProductApi.getProductDetail(id),
        enabled: Number.isFinite(id),
    })

    const {
        data: options,
        isLoading: isLoadingOptions,
        isError: isOptionsError,
    } = useQuery({
        queryKey: ['sellerProductOptions'],
        queryFn: sellerProductApi.getOptions,
        retry: false,
    })

    const activeCategories = useMemo(() => {
        return options?.categories ?? []
    }, [options])

    const parentCategories = useMemo(() => {
        return activeCategories.filter(
            (category) => !category.parentCategoryId
        )
    }, [activeCategories])

    const selectedParentCategory = useMemo(() => {
        const name = normalizeText(form.parentCategoryName)

        if (!name) return null

        return (
            parentCategories.find(
                (category) => normalizeText(category.categoryName) === name
            ) ?? null
        )
    }, [form.parentCategoryName, parentCategories])

    const childCategories = useMemo(() => {
        if (!selectedParentCategory) return []

        return activeCategories.filter(
            (category) =>
                category.parentCategoryId === selectedParentCategory.categoryId
        )
    }, [activeCategories, selectedParentCategory])

    const selectedChildCategory = useMemo(() => {
        const name = normalizeText(form.categoryName)

        if (!name || !selectedParentCategory) return null

        return (
            childCategories.find(
                (category) => normalizeText(category.categoryName) === name
            ) ?? null
        )
    }, [childCategories, form.categoryName, selectedParentCategory])

    const sameNameParentAsChild = useMemo(() => {
        const name = normalizeText(form.parentCategoryName)

        if (!name || selectedParentCategory) return null

        return (
            activeCategories.find(
                (category) =>
                    normalizeText(category.categoryName) === name &&
                    category.parentCategoryId != null
            ) ?? null
        )
    }, [activeCategories, form.parentCategoryName, selectedParentCategory])

    const sameNameChildInOtherPlace = useMemo(() => {
        const name = normalizeText(form.categoryName)

        if (!name || selectedChildCategory) return null

        if (!selectedParentCategory) {
            return (
                activeCategories.find(
                    (category) =>
                        normalizeText(category.categoryName) === name
                ) ?? null
            )
        }

        return (
            activeCategories.find(
                (category) =>
                    normalizeText(category.categoryName) === name &&
                    category.parentCategoryId !== selectedParentCategory.categoryId
            ) ?? null
        )
    }, [
        activeCategories,
        form.categoryName,
        selectedChildCategory,
        selectedParentCategory,
    ])

    useEffect(() => {
        if (!product) return

        const productAny = product as typeof product & {
            parentCategoryId?: number | null
            parentCategoryName?: string | null
        }

        const selectedCategory = activeCategories.find(
            (category) => category.categoryId === product.categoryId
        )

        const selectedParent = activeCategories.find(
            (category) =>
                category.categoryId ===
                (productAny.parentCategoryId ??
                    selectedCategory?.parentCategoryId)
        )

        setForm({
            productName: product.productName || '',
            description: product.description || '',
            thumbnailUrl: product.thumbnailUrl || '',
            parentCategoryName:
                productAny.parentCategoryName ??
                selectedParent?.categoryName ??
                '',
            categoryName:
                product.categoryName ?? selectedCategory?.categoryName ?? '',
            brandName: product.brandName || '',
            productStatus: product.productStatus,
        })
    }, [product, activeCategories])

    const updateMutation = useMutation({
        mutationFn: (body: AdminProductUpdateRequest) =>
            adminProductApi.updateProduct(id, body),

        onSuccess: () => {
            toast.success('Đã cập nhật sản phẩm')
            queryClient.invalidateQueries({
                queryKey: ['adminProductDetail', id],
            })
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
            queryClient.invalidateQueries({ queryKey: ['sellerProductOptions'] })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật sản phẩm'
            )
        },
    })

    const statusMutation = useMutation({
        mutationFn: (status: ProductStatus) =>
            adminProductApi.updateStatus(id, {
                productStatus: status,
                reason: `Admin đổi trạng thái sang ${status}`,
            }),

        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái')
            queryClient.invalidateQueries({
                queryKey: ['adminProductDetail', id],
            })
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
        },

        onError: () => {
            toast.error('Không thể cập nhật trạng thái')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => adminProductApi.softDelete(id),

        onSuccess: () => {
            toast.success('Đã ẩn sản phẩm')
            queryClient.invalidateQueries({
                queryKey: ['adminProductDetail', id],
            })
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
        },

        onError: () => {
            toast.error('Không thể ẩn sản phẩm')
        },
    })

    const permanentDeleteMutation = useMutation({
        mutationFn: () => adminProductApi.permanentDelete(id),

        onSuccess: () => {
            toast.success('Đã xóa vĩnh viễn sản phẩm')
            queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
            navigate('/admin/products')
        },

        onError: () => {
            toast.error('Không thể xóa vĩnh viễn sản phẩm')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.productName.trim()) {
            toast.error('Nhập tên sản phẩm')
            return
        }

        if (!form.parentCategoryName.trim()) {
            toast.error('Nhập danh mục tổng')
            return
        }

        if (form.parentCategoryName.trim().length > 100) {
            toast.error('Danh mục tổng tối đa 100 ký tự')
            return
        }

        if (!form.categoryName.trim()) {
            toast.error('Nhập danh mục sản phẩm')
            return
        }

        if (form.categoryName.trim().length > 100) {
            toast.error('Danh mục sản phẩm tối đa 100 ký tự')
            return
        }

        if (
            normalizeText(form.parentCategoryName) ===
            normalizeText(form.categoryName)
        ) {
            toast.error('Danh mục sản phẩm không được trùng với danh mục tổng')
            return
        }

        if (sameNameParentAsChild) {
            toast.error('Tên danh mục tổng đã tồn tại ở danh mục con')
            return
        }

        if (sameNameChildInOtherPlace) {
            toast.error('Tên danh mục sản phẩm đã tồn tại ở danh mục khác')
            return
        }

        const body: AdminProductUpdateRequest = {
            productName: form.productName.trim(),
            description: form.description.trim() || undefined,
            thumbnailUrl: product?.thumbnailUrl || form.thumbnailUrl || null,
            parentCategoryName: form.parentCategoryName.trim(),
            categoryName: form.categoryName.trim(),
            brandName: form.brandName.trim() || null,
            productStatus: form.productStatus,
        }

        updateMutation.mutate(body)
    }

    const handleStatus = (status: ProductStatus) => {
        if (!product || product.productStatus === status) return

        const ok = window.confirm(
            `Đổi trạng thái sản phẩm sang "${statusLabel(status)}"?`
        )

        if (!ok) return

        statusMutation.mutate(status)
    }

    const handleSoftDelete = () => {
        const ok = window.confirm('Ẩn sản phẩm này?')

        if (!ok) return

        deleteMutation.mutate()
    }

    const handlePermanentDelete = () => {
        if (!isAdmin) {
            toast.error('Chỉ admin mới được xóa vĩnh viễn')
            return
        }

        const firstConfirm = window.confirm(
            'Xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác.'
        )

        if (!firstConfirm) return

        const secondConfirm = window.confirm(
            `Xác nhận lần cuối: xóa vĩnh viễn "${product?.productName}" khỏi database?`
        )

        if (!secondConfirm) return

        permanentDeleteMutation.mutate()
    }

    if (isLoading || isLoadingOptions) {
        return (
            <div className="flex h-72 items-center justify-center rounded-2xl bg-white text-gray-500">
                <Loader2 className="mr-2 animate-spin" size={20} />
                Đang tải chi tiết sản phẩm...
            </div>
        )
    }

    if (isError || isOptionsError || !product) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <Package className="mx-auto mb-3 text-gray-300" size={40} />

                <h2 className="text-lg font-semibold text-gray-900">
                    Không tìm thấy sản phẩm hoặc không thể tải danh mục
                </h2>

                <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                    Quay lại danh sách
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Link
                        to="/admin/products"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600"
                    >
                        <ArrowLeft size={16} />
                        Quay lại danh sách
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Chi tiết sản phẩm #{product.productId}
                    </h1>

                    <div className="mt-2 flex items-center gap-2">
                        <span
                            className={[
                                'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                                statusClass(product.productStatus),
                            ].join(' ')}
                        >
                            {statusLabel(product.productStatus)}
                        </span>

                        <span className="text-sm text-gray-500">
                            Tạo lúc {formatDate(product.createdAt)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleStatus('active')}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                        <CheckCircle2 size={17} />
                        Cho bán
                    </button>

                    <button
                        type="button"
                        onClick={() => handleStatus('banned')}
                        disabled={statusMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                        <Ban size={17} />
                        Khóa
                    </button>

                    <button
                        type="button"
                        onClick={handleSoftDelete}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Trash2 size={17} />
                        Ẩn
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handlePermanentDelete}
                            disabled={permanentDeleteMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                        >
                            {permanentDeleteMutation.isPending ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <ShieldAlert size={17} />
                            )}
                            Xóa vĩnh viễn
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Thông tin cơ bản
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tên sản phẩm
                            </label>

                            <input
                                value={form.productName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        productName: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Mô tả
                            </label>

                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={7}
                                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Thumbnail URL
                            </label>

                            <input
                                value={form.thumbnailUrl || '-'}
                                readOnly
                                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none"
                            />

                            <p className="mt-1 text-xs text-gray-400">
                                Chỉ xem. Ảnh đại diện được quản lý ở phần ảnh sản phẩm.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Danh mục tổng
                                </label>

                                <input
                                    value={form.parentCategoryName}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            parentCategoryName: e.target.value,
                                            categoryName: '',
                                        }))
                                    }
                                    list="admin-parent-category-options"
                                    maxLength={100}
                                    placeholder="Nhập hoặc chọn danh mục tổng"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                                <datalist id="admin-parent-category-options">
                                    {parentCategories.map((category) => (
                                        <option
                                            key={category.categoryId}
                                            value={category.categoryName}
                                        />
                                    ))}
                                </datalist>

                                <p className="mt-1 text-xs text-gray-400">
                                    {form.parentCategoryName.trim()
                                        ? selectedParentCategory
                                            ? 'Đã chọn danh mục tổng có sẵn.'
                                            : 'Danh mục tổng mới sẽ được tạo khi lưu.'
                                        : 'Nhập hoặc chọn danh mục tổng.'}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Danh mục sản phẩm
                                </label>

                                <input
                                    value={form.categoryName}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            categoryName: e.target.value,
                                        }))
                                    }
                                    list="admin-child-category-options"
                                    maxLength={100}
                                    placeholder="Nhập hoặc chọn danh mục sản phẩm"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                                <datalist id="admin-child-category-options">
                                    {childCategories.map((category) => (
                                        <option
                                            key={category.categoryId}
                                            value={category.categoryName}
                                        />
                                    ))}
                                </datalist>

                                <p className="mt-1 text-xs text-gray-400">
                                    {form.categoryName.trim()
                                        ? selectedChildCategory
                                            ? `Đã chọn: ${selectedChildCategory.categoryName} #${selectedChildCategory.categoryId}`
                                            : 'Danh mục sản phẩm mới sẽ được tạo khi lưu.'
                                        : 'Nhập hoặc chọn danh mục sản phẩm.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Thương hiệu
                                </label>

                                <input
                                    value={form.brandName}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            brandName: e.target.value,
                                        }))
                                    }
                                    maxLength={100}
                                    placeholder="VD: Nike, Apple, Samsung..."
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                                <p className="mt-1 text-xs text-gray-400">
                                    Có thể để trống nếu sản phẩm không có thương hiệu.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Trạng thái
                                </label>

                                <select
                                    value={form.productStatus}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            productStatus: e.target.value as ProductStatus,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                >
                                    <option value="draft">Nháp</option>
                                    <option value="active">Đang bán</option>
                                    <option value="inactive">Đã ẩn</option>
                                    <option value="banned">Bị khóa</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-70"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <Save size={17} />
                            )}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>

                <aside className="space-y-5">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Tổng quan
                        </h2>

                        <div className="overflow-hidden rounded-xl border border-gray-100">
                            <img
                                src={
                                    product.thumbnailUrl ||
                                    'https://placehold.co/500x500?text=No+Image'
                                }
                                alt={product.productName}
                                className="h-72 w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        'https://placehold.co/500x500?text=No+Image'
                                }}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-gray-500">Giá thấp nhất</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {product.minPrice
                                        ? formatPrice(product.minPrice)
                                        : '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-gray-500">Tồn kho</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {product.totalStock ?? 0}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-gray-500">Đã bán</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {product.soldCount ?? 0}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-gray-500">Đánh giá</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {product.averageRating ?? 0}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">
                            <p className="text-gray-500">Shop</p>
                            <p className="mt-1 font-medium text-gray-900">
                                {product.shopName || '-'}
                            </p>
                            <p className="text-xs text-gray-400">
                                Shop ID: {product.shopId || '-'}
                            </p>
                        </div>
                    </section>
                </aside>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Biến thể sản phẩm
                </h2>

                {!product.variants?.length ? (
                    <p className="text-sm text-gray-500">Chưa có biến thể.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Biến thể</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Giá</th>
                                <th className="px-4 py-3">Giá gốc</th>
                                <th className="px-4 py-3">Giảm</th>
                                <th className="px-4 py-3">Kho</th>
                                <th className="px-4 py-3">Kích thước</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {product.variants.map((variant) => (
                                <tr key={variant.variantId}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {variant.imageUrl ? (
                                                <img
                                                    src={variant.imageUrl}
                                                    alt={variant.variantName}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                                    <ImageIcon size={17} />
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {variant.variantName}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    ID: {variant.variantId}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {variant.sku || '-'}
                                    </td>

                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {formatPrice(variant.price)}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {variant.originalPrice
                                            ? formatPrice(variant.originalPrice)
                                            : '-'}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {variant.discountPercent || 0}%
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {variant.stockQuantity}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {[
                                            variant.length,
                                            variant.width,
                                            variant.height,
                                        ]
                                            .filter(Boolean)
                                            .join(' x ') || '-'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Ảnh sản phẩm
                </h2>

                {!product.images?.length ? (
                    <p className="text-sm text-gray-500">Chưa có ảnh phụ.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {product.images.map((image) => (
                            <div
                                key={image.imageId}
                                className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                            >
                                <img
                                    src={image.imageUrl}
                                    alt={`Ảnh ${image.imageId}`}
                                    className="h-32 w-full object-cover"
                                />

                                <div className="p-2 text-xs text-gray-500">
                                    ID: {image.imageId}
                                    {image.isThumbnail && (
                                        <span className="ml-1 rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">
                                            thumbnail
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}