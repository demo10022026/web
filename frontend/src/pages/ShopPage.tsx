import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    CalendarDays,
    Heart,
    Loader2,
    Package,
    Search,
    Star,
    Store,
    Users,
} from 'lucide-react'
import { shopApi } from '@/api/shopApi'
import { productApi } from '@/api/productApi'
import { shopFollowApi } from '@/api/shopFollowApi'
import ProductCard from '@/components/ui/ProductCard'
import ContactSellerButton from '@/components/chat/ContactSellerButton'

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

export default function ShopPage() {
    const { shopSlugOrId } = useParams<{ shopSlugOrId: string }>()
    const [page, setPage] = useState(0)

    const {
        data: shop,
        isLoading: isLoadingShop,
        isError: isShopError,
    } = useQuery({
        queryKey: ['publicShop', shopSlugOrId],
        queryFn: () => shopApi.getPublicShop(shopSlugOrId!),
        enabled: !!shopSlugOrId,
        retry: false,
    })

    const {
        data: products,
        isLoading: isLoadingProducts,
    } = useQuery({
        queryKey: ['publicShopProducts', shop?.shopName, page],
        queryFn: () =>
            productApi.getProducts({
                shopName: shop?.shopName,
                page,
                size: 20,
                sort: 'newest',
            }),
        enabled: !!shop?.shopName,
        staleTime: 60 * 1000,
    })

    const queryClient = useQueryClient()

    const { data: followStatus } = useQuery({
        queryKey: ['shopFollowStatus', shop?.shopId],
        queryFn: () => shopFollowApi.getFollowStatus(shop!.shopId),
        enabled: !!shop?.shopId,
        retry: false,
    })

    const followMutation = useMutation({
        mutationFn: () =>
            followStatus?.following
                ? shopFollowApi.unfollowShop(shop!.shopId)
                : shopFollowApi.followShop(shop!.shopId),
        onSuccess: (data) => {
            queryClient.setQueryData(
                ['shopFollowStatus', shop?.shopId],
                data,
            )

            queryClient.invalidateQueries({
                queryKey: ['publicShop', shopSlugOrId],
            })
        },
    })

    if (isLoadingShop) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải thông tin shop...
            </div>
        )
    }

    if (isShopError || !shop) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <Store className="mx-auto h-14 w-14 text-gray-300" />
                <h1 className="mt-4 text-xl font-semibold text-gray-800">
                    Không tìm thấy shop
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                    Shop không tồn tại hoặc đang tạm ẩn.
                </p>
                <Link
                    to="/"
                    className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    Về trang chủ
                </Link>
            </div>
        )
    }

    const productList = products?.content ?? []

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="relative h-56 bg-gradient-to-r from-orange-400 to-orange-600">
                        {shop.bannerUrl && (
                            <img
                                src={shop.bannerUrl}
                                alt={shop.shopName}
                                className="h-full w-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="relative flex flex-col gap-5 px-6 pb-6 md:flex-row md:items-end md:justify-between">
                        <div className="flex gap-4">
                            <div className="relative -mt-16 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-orange-50 shadow-lg">
                                {shop.avatarUrl ? (
                                    <img
                                        src={shop.avatarUrl}
                                        alt={shop.shopName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Store className="h-10 w-10 text-orange-400" />
                                )}
                            </div>

                            <div className="pt-4">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {shop.shopName}
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    @{shop.shopSlug}
                                </p>

                                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                                    {shop.description || 'Shop chưa có mô tả.'}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        {shop.rating ?? 0} đánh giá
                                    </span>

                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        {shop.followerCount ?? 0} người theo dõi
                                    </span>

                                    <span className="inline-flex items-center gap-1">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        {shop.activeProductCount ?? 0} sản phẩm
                                    </span>

                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays className="h-4 w-4 text-gray-400" />
                                        Tham gia {formatDate(shop.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 pb-1 md:pb-0">
                            <button
                                type="button"
                                onClick={() => followMutation.mutate()}
                                disabled={followMutation.isPending}
                                className={[
                                    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                                    followStatus?.following
                                        ? 'border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        : 'border border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600',
                                ].join(' ')}
                            >
                                {followMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Heart
                                        className={[
                                            'h-4 w-4 transition-colors',
                                            followStatus?.following
                                                ? 'fill-orange-500 text-orange-500'
                                                : 'text-gray-400',
                                        ].join(' ')}
                                    />
                                )}

                                {followStatus?.following
                                    ? 'Đang theo dõi'
                                    : 'Theo dõi'}
                            </button>

                            <ContactSellerButton
                                shopId={shop.shopId}
                                shopSlug={shop.shopSlug}
                            >
                                Liên hệ shop
                            </ContactSellerButton>
                        </div>
                    </div>
                </div>

                <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Sản phẩm của shop
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Các sản phẩm đang bán công khai.
                            </p>
                        </div>

                        <Link
                            to={`/search?shopName=${encodeURIComponent(shop.shopName)}`}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Search className="h-4 w-4" />
                            Tìm trong shop
                        </Link>
                    </div>

                    {isLoadingProducts ? (
                        <div className="flex min-h-[220px] items-center justify-center text-gray-500">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang tải sản phẩm...
                        </div>
                    ) : productList.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-3 text-sm text-gray-500">
                                Shop chưa có sản phẩm đang bán.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {productList.map((product) => (
                                    <ProductCard
                                        key={product.productId}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {products && products.totalPages > 1 && (
                                <div className="mt-6 flex justify-center gap-2">
                                    {Array.from({
                                        length: products.totalPages,
                                    }).map((_, i) => (
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
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}