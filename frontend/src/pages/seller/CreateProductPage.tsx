import {
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
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
    type CreateProductVariantPayload,
} from '@/api/sellerProductApi'

const MAX_IMAGES = 8
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

interface ImageItem {
    file: File
    previewUrl: string
}

interface VariantForm {
    variantName: string
    sku: string
    price: string
    originalPrice: string
    stockQuantity: string
    weight: string
    length: string
    width: string
    height: string
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
    }
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

function toNumber(value: string, fallback = 0) {
    if (!value.trim()) return fallback

    const n = Number(value)

    return Number.isFinite(n) ? n : fallback
}

function Field({
                   label,
                   children,
               }: {
    label: string
    children: ReactNode
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

export default function CreateProductPage() {
    const navigate = useNavigate()

    const [productName, setProductName] = useState('')
    const [description, setDescription] = useState('')

    const [parentCategoryId, setParentCategoryId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [brandId, setBrandId] = useState('')

    const [productStatus, setProductStatus] = useState<'active' | 'draft'>(
        'active'
    )

    const [images, setImages] = useState<ImageItem[]>([])
    const imagesRef = useRef<ImageItem[]>([])

    const [thumbnailIndex, setThumbnailIndex] = useState(0)

    const [variants, setVariants] = useState<VariantForm[]>([
        createEmptyVariant(),
    ])

    const {
        data: options,
        isLoading: isLoadingOptions,
        isError: isOptionsError,
    } = useQuery({
        queryKey: ['sellerProductOptions'],
        queryFn: sellerProductApi.getOptions,
        retry: false,
    })

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => {
                URL.revokeObjectURL(image.previewUrl)
            })
        }
    }, [])

    const createMutation = useMutation({
        mutationFn: sellerProductApi.createProduct,

        onSuccess: () => {
            toast.success('Thêm sản phẩm thành công')
            navigate('/seller/dashboard')
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Thêm sản phẩm thất bại'
            )
        },
    })

    const activeCategories = useMemo(() => {
        return options?.categories ?? []
    }, [options])

    const activeBrands = useMemo(() => {
        return options?.brands ?? []
    }, [options])

    const parentCategories = useMemo(() => {
        return activeCategories.filter(
            (category) => !category.parentCategoryId
        )
    }, [activeCategories])

    const childCategories = useMemo(() => {
        if (!parentCategoryId) return []

        return activeCategories.filter(
            (category) =>
                category.parentCategoryId === Number(parentCategoryId)
        )
    }, [activeCategories, parentCategoryId])

    const handleSelectImages = (files: FileList | null) => {
        if (!files) return

        const selected = Array.from(files)

        if (images.length + selected.length > MAX_IMAGES) {
            toast.error(`Tối đa ${MAX_IMAGES} ảnh sản phẩm`)
            return
        }

        const nextImages: ImageItem[] = []

        for (const file of selected) {
            const error = validateImage(file)

            if (error) {
                toast.error(error)
                continue
            }

            nextImages.push({
                file,
                previewUrl: URL.createObjectURL(file),
            })
        }

        setImages((prev) => [...prev, ...nextImages])
    }

    const removeImage = (index: number) => {
        setImages((prev) => {
            const target = prev[index]

            if (target) {
                URL.revokeObjectURL(target.previewUrl)
            }

            const next = prev.filter((_, i) => i !== index)

            if (thumbnailIndex >= next.length) {
                setThumbnailIndex(0)
            } else if (thumbnailIndex === index) {
                setThumbnailIndex(0)
            }

            return next
        })
    }

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

    const removeVariant = (index: number) => {
        setVariants((prev) => {
            if (prev.length === 1) {
                toast.error('Sản phẩm cần ít nhất 1 biến thể')
                return prev
            }

            return prev.filter((_, i) => i !== index)
        })
    }

    const buildVariantPayload = (): CreateProductVariantPayload[] => {
        return variants.map((variant) => {
            const originalPrice = variant.originalPrice.trim()
                ? toNumber(variant.originalPrice)
                : null

            return {
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

        if (!parentCategoryId) {
            toast.error('Chọn danh mục tổng')
            return false
        }

        if (!categoryId) {
            toast.error('Chọn danh mục sản phẩm')
            return false
        }

        const selectedParent = activeCategories.find(
            (category) =>
                category.categoryId === Number(parentCategoryId)
        )

        if (!selectedParent || selectedParent.parentCategoryId) {
            toast.error('Danh mục tổng không hợp lệ')
            return false
        }

        const selectedChild = activeCategories.find(
            (category) => category.categoryId === Number(categoryId)
        )

        if (
            !selectedChild ||
            selectedChild.parentCategoryId !== Number(parentCategoryId)
        ) {
            toast.error('Danh mục sản phẩm không khớp với danh mục tổng')
            return false
        }

        if (images.length === 0) {
            toast.error('Upload ít nhất 1 ảnh sản phẩm')
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
                toast.error('Thông tin kích thước/khối lượng không được âm')
                return false
            }
        }

        return true
    }

    const handleSubmit = () => {
        if (!validateForm()) return

        createMutation.mutate({
            productName: productName.trim(),
            description: description.trim() || undefined,
            parentCategoryId: Number(parentCategoryId),
            categoryId: Number(categoryId),
            brandId: brandId ? Number(brandId) : null,
            productStatus,
            thumbnailIndex,
            variants: buildVariantPayload(),
            images: images.map((image) => image.file),
        })
    }

    if (isLoadingOptions) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải dữ liệu...
            </div>
        )
    }

    if (isOptionsError) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                    Không thể tải danh mục/thương hiệu.
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <button
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
                <ArrowLeft size={16} />
                Quay lại dashboard
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Thêm sản phẩm
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Tạo sản phẩm mới cho cửa hàng của bạn.
                </p>
            </div>

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
                                    placeholder="VD: Áo thun nam cotton"
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
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
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Danh mục tổng{' '}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        value={parentCategoryId}
                                        onChange={(e) => {
                                            setParentCategoryId(e.target.value)
                                            setCategoryId('')
                                        }}
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    >
                                        <option value="">
                                            Chọn danh mục tổng
                                        </option>

                                        {parentCategories.map((category) => (
                                            <option
                                                key={category.categoryId}
                                                value={category.categoryId}
                                            >
                                                {category.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Danh mục sản phẩm{' '}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        value={categoryId}
                                        onChange={(e) =>
                                            setCategoryId(e.target.value)
                                        }
                                        disabled={!parentCategoryId}
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">
                                            {parentCategoryId
                                                ? 'Chọn danh mục sản phẩm'
                                                : 'Chọn danh mục tổng trước'}
                                        </option>

                                        {childCategories.map((category) => (
                                            <option
                                                key={category.categoryId}
                                                value={category.categoryId}
                                            >
                                                {category.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Thương hiệu
                                    </label>

                                    <select
                                        value={brandId}
                                        onChange={(e) =>
                                            setBrandId(e.target.value)
                                        }
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    >
                                        <option value="">
                                            Không chọn thương hiệu
                                        </option>

                                        {activeBrands.map((brand) => (
                                            <option
                                                key={brand.brandId}
                                                value={brand.brandId}
                                            >
                                                {brand.brandName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Trạng thái đăng
                                    </label>

                                    <select
                                        value={productStatus}
                                        onChange={(e) =>
                                            setProductStatus(
                                                e.target.value as
                                                    | 'active'
                                                    | 'draft'
                                            )
                                        }
                                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    >
                                        <option value="active">
                                            Đăng bán ngay
                                        </option>

                                        <option value="draft">
                                            Lưu nháp
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
                                {images.length}/{MAX_IMAGES}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {images.map((image, index) => (
                                <div
                                    key={image.previewUrl}
                                    className="relative overflow-hidden rounded-2xl border bg-gray-50"
                                >
                                    <img
                                        src={image.previewUrl}
                                        alt="preview"
                                        className="h-36 w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-700">
                                        <input
                                            type="radio"
                                            checked={thumbnailIndex === index}
                                            onChange={() =>
                                                setThumbnailIndex(index)
                                            }
                                        />
                                        Ảnh đại diện
                                    </label>
                                </div>
                            ))}

                            {images.length < MAX_IMAGES && (
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
                                            handleSelectImages(e.target.files)
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

                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                            >
                                <Plus size={16} />
                                Thêm biến thể
                            </button>
                        </div>

                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border bg-gray-50 p-4"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="font-medium text-gray-800">
                                            Biến thể #{index + 1}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeVariant(index)
                                            }
                                            className="text-sm text-red-500 hover:underline"
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Tên biến thể">
                                            <input
                                                value={variant.variantName}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'variantName',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="VD: Đen / Size L"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            />
                                        </Field>

                                        <Field label="SKU">
                                            <input
                                                value={variant.sku}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'sku',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Có thể để trống"
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            />
                                        </Field>

                                        <Field label="Giá bán *">
                                            <input
                                                value={variant.price}
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
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            />
                                        </Field>

                                        <Field label="Giá gốc">
                                            <input
                                                value={variant.originalPrice}
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
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            />
                                        </Field>

                                        <Field label="Tồn kho">
                                            <input
                                                value={variant.stockQuantity}
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
                                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            />
                                        </Field>

                                        <Field label="Khối lượng">
                                            <div className="relative">
                                                <input
                                                    value={variant.weight}
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
                                                    className="w-full rounded-xl border px-3 py-2 pr-12 text-sm outline-none focus:border-orange-500"
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
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500"
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
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500"
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
                                                    className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-orange-500"
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
                            Kiểm tra trước khi đăng
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
                                    parentCategoryId && categoryId
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }
                            >
                                ✓ Danh mục tổng và danh mục sản phẩm
                            </div>

                            <div
                                className={
                                    images.length > 0
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
                        disabled={createMutation.isPending}
                        onClick={handleSubmit}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={17} />
                                Lưu sản phẩm
                            </>
                        )}
                    </button>
                </aside>
            </div>
        </div>
    )
}