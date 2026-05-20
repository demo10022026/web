import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Loader2, Store } from 'lucide-react'
import { sellerShopApi } from '@/api/sellerShopApi'
import { useSellerStore } from '@/store/sellerStore'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const schema = z.object({
    shopName: z
        .string()
        .min(3, 'Tên shop tối thiểu 3 ký tự')
        .max(150, 'Tên shop tối đa 150 ký tự'),

    description: z
        .string()
        .max(1000, 'Mô tả tối đa 1000 ký tự')
        .optional(),
})

type FormValues = z.infer<typeof schema>

function validateImage(file: File) {
    if (!file.type.startsWith('image/')) {
        return 'Chỉ được chọn file ảnh'
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return 'Ảnh tối đa 5MB'
    }

    return null
}

export default function ShopSetupPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { setShop } = useSellerStore()

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [bannerFile, setBannerFile] = useState<File | null>(null)

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)

    const {
        data: existingShop,
        isLoading,
    } = useQuery({
        queryKey: ['sellerMyShop'],
        queryFn: sellerShopApi.getMyShop,
        retry: false,
        staleTime: 0,
    })

    useEffect(() => {
        if (existingShop) {
            setShop(
                existingShop.shopId,
                existingShop.shopName,
                existingShop.shopSlug
            )

            navigate('/seller/dashboard', { replace: true })
        }
    }, [existingShop, navigate, setShop])

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview)
            }

            if (bannerPreview) {
                URL.revokeObjectURL(bannerPreview)
            }
        }
    }, [avatarPreview, bannerPreview])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            shopName: '',
            description: '',
        },
    })

    const handleSelectImage = (
        file: File | undefined,
        type: 'avatar' | 'banner'
    ) => {
        if (!file) return

        const error = validateImage(file)

        if (error) {
            toast.error(error)
            return
        }

        const previewUrl = URL.createObjectURL(file)

        if (type === 'avatar') {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview)
            }

            setAvatarFile(file)
            setAvatarPreview(previewUrl)
            return
        }

        if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview)
        }

        setBannerFile(file)
        setBannerPreview(previewUrl)
    }

    const createMutation = useMutation({
        mutationFn: sellerShopApi.createShop,

        onSuccess: (shop) => {
            setShop(shop.shopId, shop.shopName, shop.shopSlug)

            queryClient.setQueryData(['sellerMyShop'], shop)
            queryClient.invalidateQueries({
                queryKey: ['sellerMyShop'],
            })

            toast.success('Tạo shop thành công')
            navigate('/seller/dashboard', { replace: true })
        },

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Tạo shop thất bại'
            )
        },
    })

    const onSubmit = (values: FormValues) => {
        createMutation.mutate({
            shopName: values.shopName,
            description: values.description || undefined,
            avatar: avatarFile,
            banner: bannerFile,
        })
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang kiểm tra shop...
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        <Store size={24} />
                    </div>

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Tạo shop của bạn
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Hồ sơ seller đã được duyệt. Hoàn tất thông tin shop để bắt đầu bán hàng.
                        </p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
            >
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tên shop <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register('shopName')}
                        placeholder="VD: Huy Store"
                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />

                    {errors.shopName && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.shopName.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Mô tả shop
                    </label>

                    <textarea
                        {...register('description')}
                        rows={4}
                        placeholder="Giới thiệu ngắn về shop..."
                        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                    />

                    {errors.description && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Ảnh đại diện shop
                    </label>

                    <div className="flex items-center gap-4">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-gray-50">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Store className="text-gray-300" size={32} />
                            )}
                        </div>

                        <label className="cursor-pointer rounded-xl border border-dashed px-4 py-2 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600">
                            Chọn avatar
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={createMutation.isPending}
                                onChange={(e) => {
                                    handleSelectImage(
                                        e.target.files?.[0],
                                        'avatar'
                                    )

                                    e.currentTarget.value = ''
                                }}
                            />
                        </label>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                        Khuyên dùng ảnh vuông, tối đa 5MB.
                    </p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Ảnh bìa shop
                    </label>

                    <div className="overflow-hidden rounded-2xl border bg-gray-50">
                        {bannerPreview ? (
                            <img
                                src={bannerPreview}
                                alt="Banner preview"
                                className="h-44 w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                                Chưa chọn ảnh bìa
                            </div>
                        )}
                    </div>

                    <label className="mt-3 inline-block cursor-pointer rounded-xl border border-dashed px-4 py-2 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600">
                        Chọn banner
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={createMutation.isPending}
                            onChange={(e) => {
                                handleSelectImage(
                                    e.target.files?.[0],
                                    'banner'
                                )

                                e.currentTarget.value = ''
                            }}
                        />
                    </label>

                    <p className="mt-1 text-xs text-gray-400">
                        Khuyên dùng ảnh ngang, ví dụ 1200x300, tối đa 5MB.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                    {createMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tạo shop...
                        </>
                    ) : (
                        'Tạo shop'
                    )}
                </button>
            </form>
        </div>
    )
}