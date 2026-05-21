import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ChevronLeft,
    Loader2,
    MessageSquare,
    Star,
    Store,
} from 'lucide-react'
import { productApi } from '@/api/productApi'
import {
    reviewApi,
    type ProductReview,
    type ProductReviewStats,
} from '@/api/reviewApi'

const STAR_OPTIONS = [5, 4, 3, 2, 1]

function formatDate(value?: string | null) {
    if (!value) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function displayName(review: ProductReview) {
    return review.userFullName || review.username || 'Người dùng'
}

function RatingStars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
    const rounded = Math.round(value || 0)

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={size}
                    fill={i < rounded ? '#facc15' : 'none'}
                    stroke={i < rounded ? '#facc15' : '#d1d5db'}
                />
            ))}
        </div>
    )
}

function ratingCount(stats: ProductReviewStats | undefined, rating: number) {
    if (!stats?.ratingCounts) return 0

    return stats.ratingCounts[String(rating)] ?? stats.ratingCounts[rating] ?? 0
}

function ReviewItem({ review }: { review: ProductReview }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                {review.userAvatarUrl ? (
                    <img
                        src={review.userAvatarUrl}
                        alt={displayName(review)}
                        className="h-11 w-11 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-600">
                        {displayName(review).charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-800">
                            {displayName(review)}
                        </p>
                        {review.verifiedPurchase && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                                Đã mua hàng
                            </span>
                        )}
                        <span className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                        </span>
                    </div>

                    <div className="mt-1">
                        <RatingStars value={review.rating} />
                    </div>

                    {review.reviewContent ? (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                            {review.reviewContent}
                        </p>
                    ) : (
                        <p className="mt-3 text-sm italic text-gray-400">
                            Người mua không để lại nội dung đánh giá.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ProductReviewsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const productId = Number(id)
    const productIdValid = Number.isFinite(productId) && productId > 0

    const [selectedRatings, setSelectedRatings] = useState<number[]>([])
    const [page, setPage] = useState(0)

    const ratingsKey = selectedRatings.join(',') || 'all'

    const { data: product, isLoading: isProductLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: () => productApi.getDetail(productId),
        enabled: productIdValid,
        retry: 1,
    })

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['productReviewStats', productId],
        queryFn: () => reviewApi.getProductReviewStats(productId),
        enabled: productIdValid,
        staleTime: 60 * 1000,
    })

    const {
        data: reviewsPage,
        isLoading: isReviewsLoading,
        isError,
    } = useQuery({
        queryKey: ['productReviews', productId, ratingsKey, page],
        queryFn: () =>
            reviewApi.getProductReviews(productId, {
                ratings: selectedRatings,
                page,
                size: 10,
            }),
        enabled: productIdValid,
        staleTime: 0,
    })

    const reviews = reviewsPage?.content ?? []
    const totalPages = reviewsPage?.totalPages ?? 0
    const totalElements = reviewsPage?.totalElements ?? 0
    const reviewCount = stats?.reviewCount ?? 0
    const averageRating = stats?.averageRating ?? product?.averageRating ?? 0

    const selectedLabel = useMemo(() => {
        if (selectedRatings.length === 0) return 'Tất cả đánh giá'
        if (selectedRatings.length === 1) return `${selectedRatings[0]} sao`
        return `${selectedRatings.slice().sort((a, b) => b - a).join(', ')} sao`
    }, [selectedRatings])

    const setSingleRating = (rating: number) => {
        setSelectedRatings([rating])
        setPage(0)
    }

    const toggleRating = (rating: number) => {
        setSelectedRatings((prev) => {
            const next = prev.includes(rating)
                ? prev.filter((item) => item !== rating)
                : [...prev, rating]

            return next.sort((a, b) => b - a)
        })
        setPage(0)
    }

    const clearRatings = () => {
        setSelectedRatings([])
        setPage(0)
    }

    if (isProductLoading || isStatsLoading) {
        return (
            <div className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center px-4 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải đánh giá...
            </div>
        )
    }

    if (!product || !stats) {
        return (
            <div className="py-20 text-center">
                <p className="mb-2 text-gray-400">Không tìm thấy sản phẩm</p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-sm text-orange-500 hover:underline"
                >
                    ← Quay lại
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="mx-auto max-w-6xl px-4 py-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Quay lại
                </button>

                <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-4">
                            <Link
                                to={`/products/${product.productId}`}
                                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
                            >
                                <img
                                    src={product.thumbnailUrl || 'https://placehold.co/120x120'}
                                    alt={product.productName}
                                    className="h-full w-full object-cover"
                                />
                            </Link>

                            <div className="min-w-0">
                                <Link
                                    to={`/products/${product.productId}`}
                                    className="line-clamp-2 text-lg font-bold text-gray-900 hover:text-orange-600"
                                >
                                    {product.productName}
                                </Link>

                                {product.shop && (
                                    <Link
                                        to={`/shop/${product.shop.shopSlug || product.shop.shopId}`}
                                        className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600"
                                    >
                                        <Store className="h-4 w-4" />
                                        {product.shop.shopName}
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-orange-50 px-5 py-4 text-center">
                            <p className="text-3xl font-bold text-orange-600">
                                {Number(averageRating || 0).toFixed(1)}
                            </p>
                            <div className="mt-1 flex justify-center">
                                <RatingStars value={averageRating} />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {reviewCount} đánh giá
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 p-5 lg:grid-cols-[280px_1fr]">
                        <div className="space-y-2">
                            {STAR_OPTIONS.map((rating) => {
                                const count = ratingCount(stats, rating)
                                const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0

                                return (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setSingleRating(rating)}
                                        className="grid w-full grid-cols-[56px_1fr_44px] items-center gap-2 text-sm text-gray-600 hover:text-orange-600"
                                    >
                                        <span>{rating} sao</span>
                                        <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                                            <span
                                                className="block h-full rounded-full bg-orange-400"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </span>
                                        <span className="text-right text-gray-400">
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <div>
                            <div className="mb-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={clearRatings}
                                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                                        selectedRatings.length === 0
                                            ? 'bg-orange-500 text-white'
                                            : 'border border-gray-200 text-gray-600 hover:border-orange-300'
                                    }`}
                                >
                                    Tất cả
                                </button>

                                {STAR_OPTIONS.map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setSingleRating(rating)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                                            selectedRatings.length === 1 &&
                                            selectedRatings[0] === rating
                                                ? 'bg-orange-500 text-white'
                                                : 'border border-gray-200 text-gray-600 hover:border-orange-300'
                                        }`}
                                    >
                                        {rating} sao
                                    </button>
                                ))}
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Tổ hợp tùy chỉnh
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {STAR_OPTIONS.map((rating) => (
                                        <label
                                            key={rating}
                                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                                                selectedRatings.includes(rating)
                                                    ? 'border-orange-300 bg-orange-50 text-orange-600'
                                                    : 'border-gray-200 bg-white text-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRatings.includes(rating)}
                                                onChange={() => toggleRating(rating)}
                                                className="accent-orange-500"
                                            />
                                            {rating} sao
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {selectedLabel}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {totalElements} kết quả phù hợp
                        </p>
                    </div>
                </div>

                {isReviewsLoading ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tải danh sách đánh giá...
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                        Không thể tải danh sách đánh giá.
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                        <h2 className="mt-4 font-semibold text-gray-800">
                            Chưa có đánh giá phù hợp
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Thử đổi bộ lọc sao hoặc quay lại tất cả đánh giá.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <ReviewItem key={review.reviewId} review={review} />
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setPage(index)}
                                className={`h-9 w-9 rounded-xl text-sm font-medium ${
                                    page === index
                                        ? 'bg-orange-500 text-white'
                                        : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                                }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
