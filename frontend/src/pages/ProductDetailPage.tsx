import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cartApi } from '@/api/cartApi'
import { productApi } from '@/api/productApi'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { VariantDto } from '@/types/product.types'
import { formatPrice } from '@/utils/mask'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const setItemCount = useCartStore((state) => state.setItemCount)
  const { isAuthenticated } = useAuthStore()

  const [selectedVariant, setSelectedVariant] =
      useState<VariantDto | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getDetail(Number(id)),
    enabled: !!id,
    retry: 1,
  })

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

  useEffect(() => {
    if (!product) return

    if (product.variants?.length) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant(null)
    }

    setQuantity(1)
    setActiveImage(0)
  }, [product])

  useEffect(() => {
    if (allImages.length === 0) {
      setActiveImage(0)
      return
    }

    if (activeImage >= allImages.length) {
      setActiveImage(0)
    }
  }, [allImages, activeImage])

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

  const price = selectedVariant?.price ?? product?.variants?.[0]?.price
  const origPrice =
      selectedVariant?.originalPrice ?? product?.variants?.[0]?.originalPrice
  const discount = selectedVariant?.discountPercent ?? 0
  const stock = selectedVariant?.stockQuantity ?? 0

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

    toast.success('Chức năng thanh toán — Sprint 3')
  }

  if (isLoading) {
    return (
        <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-2xl bg-gray-200" />

            <div className="space-y-4">
              {[80, 60, 40, 90, 60].map((w, i) => (
                  <div
                      key={i}
                      className="h-4 rounded bg-gray-200"
                      style={{ width: `${w}%` }}
                  />
              ))}
            </div>
          </div>
        </div>
    )
  }

  if (isError || !product) {
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
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3 text-sm text-gray-400">
          <Link to="/" className="hover:text-orange-500">
            Trang chủ
          </Link>

          <ChevronRight className="h-3 w-3" />

          {product.categoryName && (
              <>
                <Link
                    to={`/search?q=${encodeURIComponent(product.categoryName)}`}
                    className="hover:text-orange-500"
                >
                  {product.categoryName}
                </Link>

                <ChevronRight className="h-3 w-3" />
              </>
          )}

          <span className="max-w-48 truncate text-gray-600">
                    {product.productName}
                </span>
        </div>

        <div className="mx-auto max-w-5xl px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              <div className="border-r border-gray-100 p-5">
                <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <img
                      src={
                          allImages[activeImage] ||
                          'https://placehold.co/500x500'
                      }
                      alt={product.productName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(
                            e.target as HTMLImageElement
                        ).src = 'https://placehold.co/500x500'
                      }}
                  />
                </div>

                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {allImages.map((img, i) => (
                          <button
                              key={img}
                              type="button"
                              onClick={() => setActiveImage(i)}
                              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                  activeImage === i
                                      ? 'border-orange-400'
                                      : 'border-transparent'
                              }`}
                          >
                            <img
                                src={img}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                          </button>
                      ))}
                    </div>
                )}
              </div>

              <div className="flex flex-col gap-4 p-5">
                {product.shop && (
                    <Link
                        to={`/shop/${
                            product.shop.shopSlug ||
                            product.shop.shopId
                        }`}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500"
                    >
                      <Store className="h-4 w-4" />
                      {product.shop.shopName}
                    </Link>
                )}

                <h1 className="text-xl font-bold leading-snug text-gray-800">
                  {product.productName}
                </h1>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className="h-3.5 w-3.5"
                            fill={
                              i <
                              Math.round(
                                  product.averageRating ?? 0
                              )
                                  ? '#facc15'
                                  : 'none'
                            }
                            stroke={
                              i <
                              Math.round(
                                  product.averageRating ?? 0
                              )
                                  ? '#facc15'
                                  : '#d1d5db'
                            }
                        />
                    ))}

                    <span className="ml-1 text-gray-500">
                                        (
                      {product.averageRating?.toFixed(1) ||
                          0}
                      )
                                    </span>
                  </div>

                  <span className="text-gray-400">|</span>

                  <span className="text-gray-500">
                                    Đã bán {product.soldCount ?? 0}
                                </span>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <div className="flex items-end gap-3">
                                    <span className="text-3xl font-bold text-orange-500">
                                        {price
                                            ? formatPrice(price)
                                            : 'Liên hệ'}
                                    </span>

                    {discount > 0 && (
                        <span className="mb-1 rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                                            -{discount}%
                                        </span>
                    )}
                  </div>

                  {origPrice && origPrice > (price ?? 0) && (
                      <p className="mt-0.5 text-sm text-gray-400 line-through">
                        {formatPrice(origPrice)}
                      </p>
                  )}
                </div>

                {product.variants.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        Phân loại hàng

                        {selectedVariant && (
                            <span className="ml-2 font-normal text-orange-500">
                                                —{' '}
                              {selectedVariant.variantName}
                                            </span>
                        )}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                            <button
                                key={v.variantId}
                                type="button"
                                onClick={() => {
                                  setSelectedVariant(v)
                                  setQuantity(1)
                                }}
                                disabled={
                                    v.stockQuantity === 0
                                }
                                className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-colors ${
                                    v.stockQuantity === 0
                                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                                        : selectedVariant?.variantId ===
                                        v.variantId
                                            ? 'border-orange-400 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-700 hover:border-orange-300'
                                }`}
                            >
                              {v.variantName}

                              {v.stockQuantity === 0 && (
                                  <span className="ml-1 text-xs">
                                                        (Hết)
                                                    </span>
                              )}
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                    Số lượng
                                </span>

                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                        type="button"
                        onClick={() =>
                            setQuantity(
                                Math.max(1, quantity - 1)
                            )
                        }
                        className="px-3 py-2 text-gray-500 transition-colors hover:text-orange-500"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>

                    <span className="w-10 text-center text-sm font-medium text-gray-800">
                                        {quantity}
                                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setQuantity(
                                Math.min(
                                    stock || 99,
                                    quantity + 1
                                )
                            )
                        }
                        className="px-3 py-2 text-gray-500 transition-colors hover:text-orange-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="text-xs text-gray-400">
                                    {stock > 0
                                        ? `Còn ${stock} sản phẩm`
                                        : 'Hết hàng'}
                                </span>
                </div>

                <div className="flex gap-3">
                  <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={addToCartMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 px-4 py-3 text-sm font-semibold text-orange-500 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
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
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    <Zap className="h-4 w-4" />
                    Mua ngay
                  </button>
                </div>

                <div className="flex gap-4 border-t border-gray-100 pt-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-green-500" />
                    Hàng chính hãng
                  </div>

                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-blue-500" />
                    Giao hàng toàn quốc
                  </div>
                </div>
              </div>
            </div>

            {product.description && (
                <div className="border-t border-gray-100 p-5">
                  <h2 className="mb-3 font-bold text-gray-800">
                    Mô tả sản phẩm
                  </h2>

                  <div className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {product.description}
                  </div>
                </div>
            )}
          </div>

          {product.shop && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  {product.shop.avatarUrl ? (
                      <img
                          src={product.shop.avatarUrl}
                          alt={product.shop.shopName}
                          className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                      />
                  ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                        <Store className="h-6 w-6 text-orange-400" />
                      </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-800">
                      {product.shop.shopName}
                    </p>

                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-0.5">
                                        <Star
                                            className="h-3 w-3 text-yellow-400"
                                            fill="currentColor"
                                        />
                                      {product.shop.rating?.toFixed(1)}
                                    </span>

                      <span>
                                        {product.shop.followerCount} người theo
                                        dõi
                                    </span>
                    </div>
                  </div>
                </div>

                <Link
                    to={`/shop/${
                        product.shop.shopSlug || product.shop.shopId
                    }`}
                    className="rounded-lg border border-orange-400 px-4 py-2 text-sm text-orange-500 transition-colors hover:bg-orange-50"
                >
                  Xem shop
                </Link>
              </div>
          )}
        </div>
      </div>
  )
}