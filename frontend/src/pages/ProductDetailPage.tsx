import {useState, useEffect, useMemo} from 'react'   // ← thêm useEffect
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingCart, Zap, Star, Store, ChevronRight,
  Minus, Plus, Shield, Truck, Loader2, MessageSquare
} from 'lucide-react'
import { cartApi } from '@/api/cartApi'
import { useCartStore } from '@/store/cartStore'
import { productApi }    from '@/api/productApi'
import { reviewApi, type ProductReview } from '@/api/reviewApi'
import { useAuthStore }  from '@/store/authStore'
import { formatPrice }   from '@/utils/mask'
import toast             from 'react-hot-toast'
import type { VariantDto } from '@/types/product.types'

function formatReviewDate(value?: string | null) {
  if (!value) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function reviewDisplayName(review: ProductReview) {
  return review.userFullName || review.username || 'Người dùng'
}

function RatingStars({ value, size = 'h-3.5 w-3.5' }: { value: number; size?: string }) {
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


export default function ProductDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const productId = Number(id)
  const productIdValid = Number.isFinite(productId) && productId > 0
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const setItemCount = useCartStore((state) => state.setItemCount)
  const { isAuthenticated } = useAuthStore()

  const [selectedVariant, setSelectedVariant] = useState<VariantDto | null>(null)
  const [quantity,   setQuantity]   = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  //mutantion
  const addToCartMutation = useMutation({
    mutationFn: () =>
        cartApi.addItem({
          variantId: selectedVariant!.variantId,
          quantity,
        }),
    onSuccess: (data) => {
      setItemCount(data.totalQuantity || 0)
      queryClient.setQueryData(['cart'], data)
      toast.success('Đã thêm vào giỏ hàng')
    },
    onError: () => {
      toast.error('Không thể thêm vào giỏ hàng')
    },
  })

  const buyNowMutation = useMutation({
    mutationFn: ({
                   variantId,
                   quantity,
                 }: {
      variantId: number
      quantity: number
    }) =>
        cartApi.addItem({
          variantId,
          quantity,
        }),

    onSuccess: (data, variables) => {
      setItemCount(data.totalQuantity || 0)
      queryClient.setQueryData(['cart'], data)

      const cartData = data as any
      const cartItem = cartData.shops
          ?.flatMap((shop: any) => shop.items ?? [])
          ?.find((item: any) => item.variantId === variables.variantId)

      if (!cartItem?.cartItemId) {
        toast.error('Không tìm thấy sản phẩm trong giỏ hàng')
        return
      }

      navigate(`/checkout?items=${cartItem.cartItemId}`)
    },

    onError: () => {
      toast.error('Không thể mua ngay')
    },
  })

  // ── Bỏ onSuccess, dùng useEffect thay thế (React Query v5) ──
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => productApi.getDetail(productId),
    enabled:  productIdValid,
    retry:    1,
  })

  const { data: latestReviews = [] } = useQuery({
    queryKey: ['productReviewsLatest', productId, 5],
    queryFn: () => reviewApi.getLatestProductReviews(productId, 5),
    enabled: productIdValid && !!product,
    staleTime: 60 * 1000,
  })

  const { data: reviewStats } = useQuery({
    queryKey: ['productReviewStats', productId],
    queryFn: () => reviewApi.getProductReviewStats(productId),
    enabled: productIdValid && !!product,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

  const allImages = useMemo(() => {
    if (!product) return []

    const urls = [
      product.thumbnailUrl,
      ...(product.images ?? []),
    ].filter((url): url is string => {
      return Boolean(url && url.trim())
    })

    return Array.from(new Set(urls))
  }, [product])

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            {[80, 60, 40, 90, 60].map((w, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
  )

  if (isError || !product) return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-2">Không tìm thấy sản phẩm</p>
        <button onClick={() => navigate(-1)}
                className="text-sm text-orange-500 hover:underline">
          ← Quay lại
        </button>
      </div>
  )

  const price     = selectedVariant?.price     ?? product.variants[0]?.price
  const origPrice = selectedVariant?.originalPrice ?? product.variants[0]?.originalPrice
  const discount  = selectedVariant?.discountPercent ?? 0
  const stock     = selectedVariant?.stockQuantity ?? 0
  const displayRating = reviewStats?.averageRating ?? product?.averageRating ?? 0
  const displayReviewCount = reviewStats?.reviewCount ?? 0

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!selectedVariant) {
      toast.error('Vui lòng chọn phân loại')
      return
    }

    if (stock === 0) {
      toast.error('Sản phẩm đã hết hàng')
      return
    }

    addToCartMutation.mutate()
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!selectedVariant) {
      toast.error('Vui lòng chọn phân loại')
      return
    }

    if (stock === 0) {
      toast.error('Sản phẩm đã hết hàng')
      return
    }

    buyNowMutation.mutate({
      variantId: selectedVariant.variantId,
      quantity,
    })
  }

  return (
      <div className="bg-gray-50 min-h-screen pb-10">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-1 text-sm text-gray-400">
          <Link to="/" className="hover:text-orange-500">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          {product.categoryName && (
              <>
                <Link to={`/search?category=${product.categoryName}`}
                      className="hover:text-orange-500">{product.categoryName}</Link>
                <ChevronRight className="h-3 w-3" />
              </>
          )}
          <span className="text-gray-600 truncate max-w-48">{product.productName}</span>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

              {/* Images */}
              <div className="p-5 border-r border-gray-100">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img
                      src={allImages[activeImage] || 'https://placehold.co/500x500'}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/500x500' }}
                  />
                </div>
                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {allImages.map((img, i) => (
                          <button key={i} onClick={() => setActiveImage(i)}
                                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors
                        ${activeImage === i ? 'border-orange-400' : 'border-transparent'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-4">
                {product.shop && (
                    <Link to={`/shop/${product.shop.shopSlug || product.shop.shopId}`}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500">
                      <Store className="h-4 w-4" />
                      {product.shop.shopName}
                    </Link>
                )}

                <h1 className="text-xl font-bold text-gray-800 leading-snug">
                  {product.productName}
                </h1>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <RatingStars value={displayRating} />
                    <span className="text-gray-500 ml-1">
                      ({Number(displayRating || 0).toFixed(1)})
                    </span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <Link
                      to={`/products/${product.productId}/reviews`}
                      className="text-gray-500 hover:text-orange-500"
                  >
                    {displayReviewCount} đánh giá
                  </Link>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Đã bán {product.soldCount ?? 0}</span>
                </div>

                {/* Price */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-orange-500">
                    {price ? formatPrice(price) : 'Liên hệ'}
                  </span>
                    {discount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded mb-1">
                      -{discount}%
                    </span>
                    )}
                  </div>
                  {origPrice && origPrice > (price ?? 0) && (
                      <p className="text-sm text-gray-400 line-through mt-0.5">
                        {formatPrice(origPrice)}
                      </p>
                  )}
                </div>

                {/* Variants */}
                {product.variants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Phân loại hàng
                        {selectedVariant && (
                            <span className="font-normal text-orange-500 ml-2">
                        — {selectedVariant.variantName}
                      </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map(v => (
                            <button key={v.variantId}
                                    onClick={() => { setSelectedVariant(v); setQuantity(1) }}
                                    disabled={v.stockQuantity === 0}
                                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors
                          ${v.stockQuantity === 0
                                        ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                                        : selectedVariant?.variantId === v.variantId
                                            ? 'border-orange-400 text-orange-600 bg-orange-50'
                                            : 'border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                              {v.variantName}
                              {v.stockQuantity === 0 && <span className="ml-1 text-xs">(Hết)</span>}
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Số lượng</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3 py-2 text-gray-500 hover:text-orange-500 transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-gray-800">
                    {quantity}
                  </span>
                    <button onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                            className="px-3 py-2 text-gray-500 hover:text-orange-500 transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                  {stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
                </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={addToCartMutation.isPending}
                      className={`
    flex flex-1 items-center justify-center gap-2 rounded-xl
    border-2 border-orange-500 px-4 py-3 text-sm font-semibold
    text-orange-500 transition-colors
    hover:bg-orange-50
    disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent
  `}
                  >
                    {addToCartMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang thêm...
                        </>
                    ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Thêm vào giỏ
                        </>
                    )}
                  </button>
                  <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={buyNowMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                             bg-orange-500 hover:bg-orange-600 text-white font-semibold
                             rounded-xl transition-colors text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {buyNowMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                    ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Mua ngay
                        </>
                    )}
                  </button>
                </div>

                <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-green-500" /> Hàng chính hãng
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-blue-500" /> Giao hàng toàn quốc
                  </div>
                </div>
              </div>
            </div>

            {product.description && (
                <div className="p-5 border-t border-gray-100">
                  <h2 className="font-bold text-gray-800 mb-3">Mô tả sản phẩm</h2>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </div>
                </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-800">
                  Đánh giá sản phẩm
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {displayReviewCount > 0
                      ? `${displayReviewCount} đánh giá từ người mua`
                      : 'Chưa có đánh giá nào cho sản phẩm này'}
                </p>
              </div>

              <Link
                  to={`/products/${product.productId}/reviews`}
                  className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                Xem tất cả
              </Link>
            </div>

            {latestReviews.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  <MessageSquare className="h-5 w-5 text-gray-300" />
                  Sản phẩm chưa có đánh giá từ người mua.
                </div>
            ) : (
                <div className="space-y-4">
                  {latestReviews.map((review) => (
                      <div
                          key={review.reviewId}
                          className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          {review.userAvatarUrl ? (
                              <img
                                  src={review.userAvatarUrl}
                                  alt={reviewDisplayName(review)}
                                  className="h-10 w-10 rounded-full object-cover"
                              />
                          ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
                                {reviewDisplayName(review).charAt(0).toUpperCase()}
                              </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-gray-800">
                                {reviewDisplayName(review)}
                              </p>

                              {review.verifiedPurchase && (
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                                    Đã mua hàng
                                  </span>
                              )}

                              <span className="text-xs text-gray-400">
                                {formatReviewDate(review.createdAt)}
                              </span>
                            </div>

                            <div className="mt-1">
                              <RatingStars value={review.rating} size="h-3 w-3" />
                            </div>

                            {review.reviewContent && (
                                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                                  {review.reviewContent}
                                </p>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {product.shop && (
              <div className="bg-white rounded-2xl shadow-sm p-5 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {product.shop.avatarUrl ? (
                      <img src={product.shop.avatarUrl} alt={product.shop.shopName}
                           className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  ) : (
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Store className="h-6 w-6 text-orange-400" />
                      </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{product.shop.shopName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
                    {product.shop.rating?.toFixed(1)}
                  </span>
                      <span>{product.shop.followerCount} người theo dõi</span>
                    </div>
                  </div>
                </div>
                <Link to={`/shop/${product.shop.shopSlug || product.shop.shopId}`}
                      className="px-4 py-2 border border-orange-400 text-orange-500 text-sm
                         rounded-lg hover:bg-orange-50 transition-colors">
                  Xem shop
                </Link>
              </div>
          )}
        </div>
      </div>
  )
}
