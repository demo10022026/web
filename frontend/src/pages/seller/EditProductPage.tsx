import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    ImagePlus,
    Loader2,
    Package,
    Plus,
    Save,
    Trash2,
} from 'lucide-react'
import {
    sellerProductApi,
    type SellerProductResponse,
    type SellerProductStatus,
    type UpdateSellerProductVariantPayload,
} from '@/api/sellerProductApi'

const MAX_IMAGES = 8
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

type EditableStatus = Exclude<SellerProductStatus, 'banned'>

interface VariantForm {
    variantId?: number
    variantName: string
    sku: string
    price: string
    originalPrice: string
    stockQuantity: string
    weight: string
    length: string
    width: string
    height: string
    isNew?: boolean
}

function createEmptyVariant(): VariantForm {
    return {
        variantName: '',
        sku: '',
        price: '',
        originalPrice: '',
        stockQuantity: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        isNew: true,
    }
}

function toNumber(value: string, fallback = 0) {
    if (!value.trim()) return fallback

    const n = Number(value)

    return Number.isFinite(n) ? n : fallback
}

function normalizeText(value: string) {
    return value.trim().toLowerCase()
}

function validateImage(file: File) {
    if (!file.type.startsWith('image/')) {
        return 'Chỉ được chọn file ảnh'
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return 'Ảnh tối đa 5MB'
    }

    return null
}

function toVariantForm(product: SellerProductResponse): VariantForm[] {
    if (!product.variants || product.variants.length === 0) {
        return [createEmptyVariant()]
    }

    return product.variants.map((variant) => ({
        variantId: variant.variantId,
        variantName: variant.variantName ?? '',
        sku: variant.sku ?? '',
        price: String(variant.price ?? ''),
        originalPrice:
            variant.originalPrice === null || variant.originalPrice === undefined
                ? ''
                : String(variant.originalPrice),
        stockQuantity: String(variant.stockQuantity ?? ''),
        weight: String(variant.weight ?? ''),
        length: String(variant.length ?? ''),
        width: String(variant.width ?? ''),
        height: String(variant.height ?? ''),
        isNew: false,
    }))
}

function Field({
                   label,
                   children,
               }: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
                {label}
            </label>

            {children}
        </div>
    )
}

export default function EditProductPage() {
    const { id } = useParams()
    const productId = Number(id)

    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [initializedProductId, setInitializedProductId] = useState<
        number | null
    >(null)

    const [productName, setProductName] = useState('')
    const [description, setDescription] = useState('')
    const [parentCategoryName, setParentCategoryName] = useState('')
    const [categoryName, setCategoryName] = useState('')
    const [brandName, setBrandName] = useState('')
    const [productStatus, setProductStatus] = useState<EditableStatus>('active')
    const [variants, setVariants] = useState<VariantForm[]>([])

    const {
        data: product,
        isLoading: isLoadingProduct,
        isError: isProductError,
    } = useQuery({
        queryKey: ['sellerProductDetail', productId],
        queryFn: () => sellerProductApi.getMyProductDetail(productId),
        enabled: Number.isFinite(productId),
        retry: false,
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
        const name = normalizeText(parentCategoryName)

        if (!name) return null

        return (
            parentCategories.find(
                (category) => normalizeText(category.categoryName) === name
            ) ?? null
        )
    }, [parentCategories, parentCategoryName])

    const childCategories = useMemo(() => {
        if (!selectedParentCategory) return []

        return activeCategories.filter(
            (category) =>
                category.parentCategoryId === selectedParentCategory.categoryId
        )
    }, [activeCategories, selectedParentCategory])

    const selectedChildCategory = useMemo(() => {
        const name = normalizeText(categoryName)

        if (!name || !selectedParentCategory) return null

        return (
            childCategories.find(
                (category) => normalizeText(category.categoryName) === name
            ) ?? null
        )
    }, [childCategories, categoryName, selectedParentCategory])

    const sameNameParentAsChild = useMemo(() => {
        const name = normalizeText(parentCategoryName)

        if (!name || selectedParentCategory) return null

        return (
            activeCategories.find(
                (category) =>
                    normalizeText(category.categoryName) === name &&
                    category.parentCategoryId != null
            ) ?? null
        )
    }, [activeCategories, parentCategoryName, selectedParentCategory])

    const sameNameChildInOtherPlace = useMemo(() => {
        const name = normalizeText(categoryName)

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
        categoryName,
        selectedChildCategory,
        selectedParentCategory,
    ])

    useEffect(() => {
        if (!product || initializedProductId === product.productId) return

        const selectedCategory = activeCategories.find(
            (category) => category.categoryId === product.categoryId
        )

        const selectedParent = activeCategories.find(
            (category) =>
                category.categoryId ===
                (product.parentCategoryId ?? selectedCategory?.parentCategoryId)
        )

        setProductName(product.productName ?? '')
        setDescription(product.description ?? '')
        setParentCategoryName(
            product.parentCategoryName ?? selectedParent?.categoryName ?? ''
        )
        setCategoryName(product.categoryName ?? selectedCategory?.categoryName ?? '')
        setBrandName(product.brandName ?? '')

        if (product.productStatus !== 'banned') {
            setProductStatus(product.productStatus)
        } else {
            setProductStatus('inactive')
        }

        setVariants(toVariantForm(product))
        setInitializedProductId(product.productId)
    }, [product, activeCategories, initializedProductId])

    const updateMutation = useMutation({
        mutationFn: ({
                         productId,
                         payload,
                     }: {
            productId: number
            payload: Parameters<typeof sellerProductApi.updateProduct>[1]
        }) => sellerProductApi.updateProduct(productId, payload),

        onSuccess: () => {
            toast.success('Cập nhật sản phẩm thành công')

            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerProductDetail', productId],
            })

            navigate('/seller/products')
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật sản phẩm'
            )
        },
    })

    const addImagesMutation = useMutation({
        mutationFn: ({
                         productId,
                         images,
                     }: {
            productId: number
            images: File[]
        }) => sellerProductApi.addProductImages(productId, images),

        onSuccess: () => {
            toast.success('Thêm ảnh sản phẩm thành công')
            queryClient.invalidateQueries({
                queryKey: ['sellerProductDetail', productId],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể thêm ảnh sản phẩm'
            )
        },
    })

    const deleteImageMutation = useMutation({
        mutationFn: ({
                         productId,
                         imageId,
                     }: {
            productId: number
            imageId: number
        }) => sellerProductApi.deleteProductImage(productId, imageId),

        onSuccess: () => {
            toast.success('Đã xóa ảnh sản phẩm')
            queryClient.invalidateQueries({
                queryKey: ['sellerProductDetail', productId],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể xóa ảnh sản phẩm'
            )
        },
    })

    const setThumbnailMutation = useMutation({
        mutationFn: ({
                         productId,
                         imageId,
                     }: {
            productId: number
            imageId: number
        }) => sellerProductApi.setProductThumbnail(productId, imageId),

        onSuccess: () => {
            toast.success('Đã đặt ảnh đại diện')
            queryClient.invalidateQueries({
                queryKey: ['sellerProductDetail', productId],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerProducts'],
            })
            queryClient.invalidateQueries({
                queryKey: ['sellerDashboard'],
            })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể đặt ảnh đại diện'
            )
        },
    })

    const updateVariant = (
        index: number,
        field: keyof VariantForm,
        value: string
    ) => {
        setVariants((prev) =>
            prev.map((variant, i) =>
                i === index
                    ? {
                        ...variant,
                        [field]: value,
                    }
                    : variant
            )
        )
    }

    const addVariant = () => {
        setVariants((prev) => [...prev, createEmptyVariant()])
    }

    const removeNewVariant = (index: number) => {
        setVariants((prev) => {
            const target = prev[index]

            if (!target?.isNew) {
                toast.error('Pha này chưa hỗ trợ xóa biến thể đã tồn tại')
                return prev
            }

            if (prev.length === 1) {
                toast.error('Sản phẩm cần ít nhất 1 biến thể')
                return prev
            }

            return prev.filter((_, i) => i !== index)
        })
    }

    const buildVariantPayload = (): UpdateSellerProductVariantPayload[] => {
        return variants.map((variant) => {
            const originalPrice = variant.originalPrice.trim()
                ? toNumber(variant.originalPrice)
                : null

            return {
                variantId: variant.variantId,
                variantName: variant.variantName.trim() || undefined,
                sku: variant.sku.trim() || undefined,
                price: toNumber(variant.price),
                originalPrice,
                stockQuantity: toNumber(variant.stockQuantity),
                weight: toNumber(variant.weight),
                length: toNumber(variant.length),
                width: toNumber(variant.width),
                height: toNumber(variant.height),
            }
        })
    }

    const validateForm = () => {
        if (!productName.trim()) {
            toast.error('Nhập tên sản phẩm')
            return false
        }

        if (!parentCategoryName.trim()) {
            toast.error('Nhập danh mục tổng')
            return false
        }

        if (parentCategoryName.trim().length > 100) {
            toast.error('Danh mục tổng tối đa 100 ký tự')
            return false
        }

        if (!categoryName.trim()) {
            toast.error('Nhập danh mục sản phẩm')
            return false
        }

        if (categoryName.trim().length > 100) {
            toast.error('Danh mục sản phẩm tối đa 100 ký tự')
            return false
        }

        if (normalizeText(parentCategoryName) === normalizeText(categoryName)) {
            toast.error('Danh mục sản phẩm không được trùng với danh mục tổng')
            return false
        }

        if (sameNameParentAsChild) {
            toast.error('Tên danh mục tổng đã tồn tại ở danh mục con')
            return false
        }

        if (sameNameChildInOtherPlace) {
            toast.error('Tên danh mục sản phẩm đã tồn tại ở danh mục khác')
            return false
        }

        if (variants.length === 0) {
            toast.error('Sản phẩm cần ít nhất 1 biến thể')
            return false
        }

        const payload = buildVariantPayload()

        for (const variant of payload) {
            if (!variant.price || variant.price <= 0) {
                toast.error('Giá bán phải lớn hơn 0')
                return false
            }

            if (
                variant.originalPrice &&
                variant.originalPrice < variant.price
            ) {
                toast.error('Giá gốc không được nhỏ hơn giá bán')
                return false
            }

            if (variant.stockQuantity < 0) {
                toast.error('Tồn kho không được âm')
                return false
            }

            if (
                (variant.weight ?? 0) < 0 ||
                (variant.length ?? 0) < 0 ||
                (variant.width ?? 0) < 0 ||
                (variant.height ?? 0) < 0
            ) {
                toast.error('Kích thước/khối lượng không được âm')
                return false
            }
        }

        return true
    }

    const handleSubmit = () => {
        if (!product) return
        if (!validateForm()) return

        updateMutation.mutate({
            productId: product.productId,
            payload: {
                productName: productName.trim(),
                description: description.trim() || undefined,
                parentCategoryName: parentCategoryName.trim(),
                categoryName: categoryName.trim(),
                brandName: brandName.trim() || null,
                productStatus,
                variants: buildVariantPayload(),
            },
        })
    }

    const handleAddImages = (files: FileList | null) => {
        if (!product || !files) return

        const selected = Array.from(files)

        if (selected.length === 0) return

        if ((product.images?.length ?? 0) + selected.length > MAX_IMAGES) {
            toast.error(`Tối đa ${MAX_IMAGES} ảnh sản phẩm`)
            return
        }

        for (const file of selected) {
            const error = validateImage(file)

            if (error) {
                toast.error(error)
                return
            }
        }

        addImagesMutation.mutate({
            productId: product.productId,
            images: selected,
        })
    }

    const handleDeleteImage = (imageId: number) => {
        if (!product) return

        const ok = window.confirm('Bạn chắc chắn muốn xóa ảnh này?')

        if (!ok) return

        deleteImageMutation.mutate({
            productId: product.productId,
            imageId,
        })
    }

    const handleSetThumbnail = (imageId: number) => {
        if (!product) return

        setThumbnailMutation.mutate({
            productId: product.productId,
            imageId,
        })
    }

    const isLoading = isLoadingProduct || isLoadingOptions
    const isBanned = product?.productStatus === 'banned'
    const isSaving =
        updateMutation.isPending ||
        addImagesMutation.isPending ||
        deleteImageMutation.isPending ||
        setThumbnailMutation.isPending

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải sản phẩm...
            </div>
        )
    }

    if (isProductError || isOptionsError || !product) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                    Không thể tải thông tin sản phẩm.
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <button
                type="button"
                onClick={() => navigate('/seller/products')}
                className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
                <ArrowLeft size={16} />
                Quay lại quản lý sản phẩm
            </button>

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Chỉnh sửa sản phẩm
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Sửa thông tin, biến thể và ảnh sản phẩm.
                    </p>
                </div>

                <Link
                    to={`/products/${product.productId}`}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Xem trang public
                </Link>
            </div>

            {isBanned && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    Sản phẩm đang bị khóa. Seller không thể chỉnh sửa trạng thái hoặc lưu thay đổi.
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <Package size={18} />
                            Thông tin cơ bản
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Tên sản phẩm{' '}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    value={productName}
                                    onChange={(e) =>
                                        setProductName(e.target.value)
                                    }
                                    maxLength={150}
                                    disabled={isBanned}
                                    placeholder="VD: Áo thun nam cotton"
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Mô tả sản phẩm
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    rows={5}
                                    disabled={isBanned}
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Danh mục tổng{' '}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        value={parentCategoryName}
                                        disabled={isBanned}
                                        onChange={(e) => {
                                            setParentCategoryName(e.target.value)
                                            setCategoryName('')
                                        }}
                                        list="edit-parent-category-options"
                                        maxLength={100}
                                        placeholder="Nhập hoặc chọn danh mục tổng"
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                    />

                                    <datalist id="edit-parent-category-options">
                                        {parentCategories.map((category) => (
                                            <option
                                                key={category.categoryId}
                                                value={category.categoryName}
                                            />
                                        ))}
                                    </datalist>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {parentCategoryName.trim()
                                            ? selectedParentCategory
                                                ? 'Đã chọn danh mục tổng có sẵn.'
                                                : 'Danh mục tổng mới sẽ được tạo khi lưu.'
                                            : 'Nhập hoặc chọn danh mục tổng.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Danh mục sản phẩm{' '}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        value={categoryName}
                                        disabled={isBanned}
                                        onChange={(e) =>
                                            setCategoryName(e.target.value)
                                        }
                                        list="edit-child-category-options"
                                        maxLength={100}
                                        placeholder="Nhập hoặc chọn danh mục sản phẩm"
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
                                    />

                                    <datalist id="edit-child-category-options">
                                        {childCategories.map((category) => (
                                            <option
                                                key={category.categoryId}
                                                value={category.categoryName}
                                            />
                                        ))}
                                    </datalist>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {categoryName.trim()
                                            ? selectedChildCategory
                                                ? 'Đã chọn danh mục sản phẩm có sẵn.'
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
                                        value={brandName}
                                        onChange={(e) =>
                                            setBrandName(e.target.value)
                                        }
                                        maxLength={100}
                                        disabled={isBanned}
                                        placeholder="VD: Nike, Apple, Samsung..."
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Trạng thái
                                    </label>

                                    <select
                                        value={productStatus}
                                        disabled={isBanned}
                                        onChange={(e) =>
                                            setProductStatus(
                                                e.target.value as EditableStatus
                                            )
                                        }
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                    >
                                        <option value="active">
                                            Đang bán
                                        </option>
                                        <option value="draft">
                                            Nháp
                                        </option>
                                        <option value="inactive">
                                            Đã ẩn
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">
                                Ảnh sản phẩm
                            </h2>

                            <span className="text-xs text-gray-400">
                                {product.images?.length ?? 0}/{MAX_IMAGES}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {product.images.map((image) => (
                                <div
                                    key={image.imageId}
                                    className="relative overflow-hidden rounded-2xl border bg-gray-50"
                                >
                                    <img
                                        src={image.imageUrl}
                                        alt="product"
                                        className="h-36 w-full object-cover"
                                    />

                                    {!isBanned && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteImage(image.imageId)
                                            }
                                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}

                                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-700">
                                        <input
                                            type="radio"
                                            checked={image.isThumbnail}
                                            disabled={isBanned}
                                            onChange={() =>
                                                handleSetThumbnail(image.imageId)
                                            }
                                        />
                                        Ảnh đại diện
                                    </label>
                                </div>
                            ))}

                            {!isBanned &&
                                (product.images?.length ?? 0) < MAX_IMAGES && (
                                    <label className="flex h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50 text-gray-500 hover:border-orange-400 hover:text-orange-500">
                                        <ImagePlus size={28} />

                                        <span className="mt-2 text-sm font-medium">
                                            Thêm ảnh
                                        </span>

                                        <span className="mt-1 text-xs">
                                            JPG, PNG, WEBP
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                handleAddImages(e.target.files)
                                                e.currentTarget.value = ''
                                            }}
                                        />
                                    </label>
                                )}
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">
                                Biến thể, giá và tồn kho
                            </h2>

                            {!isBanned && (
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                                >
                                    <Plus size={16} />
                                    Thêm biến thể
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div
                                    key={variant.variantId ?? `new-${index}`}
                                    className="rounded-2xl border bg-gray-50 p-4"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="font-medium text-gray-800">
                                            Biến thể #{index + 1}
                                        </p>

                                        {!isBanned && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewVariant(index)
                                                }
                                                className="text-sm text-red-500 hover:underline"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Tên biến thể">
                                            <input
                                                value={variant.variantName}
                                                disabled={isBanned}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'variantName',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="VD: Đen / Size L"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            />
                                        </Field>

                                        <Field label="SKU">
                                            <input
                                                value={variant.sku}
                                                disabled={isBanned}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'sku',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Có thể để trống"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            />
                                        </Field>

                                        <Field label="Giá bán *">
                                            <input
                                                value={variant.price}
                                                disabled={isBanned}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'price',
                                                        e.target.value
                                                    )
                                                }
                                                type="number"
                                                min="0"
                                                placeholder="VD: 150000"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            />
                                        </Field>

                                        <Field label="Giá gốc">
                                            <input
                                                value={variant.originalPrice}
                                                disabled={isBanned}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'originalPrice',
                                                        e.target.value
                                                    )
                                                }
                                                type="number"
                                                min="0"
                                                placeholder="VD: 200000"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            />
                                        </Field>

                                        <Field label="Tồn kho">
                                            <input
                                                value={variant.stockQuantity}
                                                disabled={isBanned}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'stockQuantity',
                                                        e.target.value
                                                    )
                                                }
                                                type="number"
                                                min="0"
                                                placeholder="VD: 100"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            />
                                        </Field>

                                        <Field label="Khối lượng">
                                            <div className="relative">
                                                <input
                                                    value={variant.weight}
                                                    disabled={isBanned}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            index,
                                                            'weight',
                                                            e.target.value
                                                        )
                                                    }
                                                    type="number"
                                                    min="0"
                                                    placeholder="VD: 500"
                                                    className="w-full rounded-xl border px-3 py-2 pr-12 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                                />

                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    gram
                                                </span>
                                            </div>
                                        </Field>

                                        <Field label="Chiều dài">
                                            <div className="relative">
                                                <input
                                                    value={variant.length}
                                                    disabled={isBanned}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            index,
                                                            'length',
                                                            e.target.value
                                                        )
                                                    }
                                                    type="number"
                                                    min="0"
                                                    placeholder="VD: 20"
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                                />

                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    cm
                                                </span>
                                            </div>
                                        </Field>

                                        <Field label="Chiều rộng">
                                            <div className="relative">
                                                <input
                                                    value={variant.width}
                                                    disabled={isBanned}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            index,
                                                            'width',
                                                            e.target.value
                                                        )
                                                    }
                                                    type="number"
                                                    min="0"
                                                    placeholder="VD: 15"
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                                />

                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    cm
                                                </span>
                                            </div>
                                        </Field>

                                        <Field label="Chiều cao">
                                            <div className="relative">
                                                <input
                                                    value={variant.height}
                                                    disabled={isBanned}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            index,
                                                            'height',
                                                            e.target.value
                                                        )
                                                    }
                                                    type="number"
                                                    min="0"
                                                    placeholder="VD: 10"
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                                />

                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    cm
                                                </span>
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-900">
                            Kiểm tra trước khi lưu
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <div
                                className={
                                    productName.trim()
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }
                            >
                                ✓ Tên sản phẩm
                            </div>

                            <div
                                className={
                                    parentCategoryName.trim() &&
                                    categoryName.trim()
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }
                            >
                                ✓ Danh mục tổng và danh mục sản phẩm
                            </div>

                            <div
                                className={
                                    (product.images?.length ?? 0) > 0
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }
                            >
                                ✓ Ảnh sản phẩm
                            </div>

                            <div
                                className={
                                    variants.some((v) => Number(v.price) > 0)
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }
                            >
                                ✓ Giá bán
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={isBanned || updateMutation.isPending}
                        onClick={handleSubmit}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {updateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={17} />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </aside>
            </div>

            {isSaving && (
                <div className="fixed bottom-4 right-4 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
                    Đang cập nhật...
                </div>
            )}
        </div>
    )
}