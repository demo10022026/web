import { useState, useEffect }  from 'react'   // ← thêm useEffect
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery }            from '@tanstack/react-query'
import {
  ShoppingCart, Zap, Star, Store, ChevronRight,
  Minus, Plus, Shield, Truck
} from 'lucide-react'
import { productApi }    from '@/api/productApi'
import { useAuthStore }  from '@/store/authStore'
import { formatPrice }   from '@/utils/mask'
import toast             from 'react-hot-toast'
import type { VariantDto } from '@/types/product.types'

export default function ProductDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [selectedVariant, setSelectedVariant] = useState<VariantDto | null>(null)
  const [quantity,   setQuantity]   = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  // ── Bỏ onSuccess, dùng useEffect thay thế (React Query v5) ──
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => productApi.getDetail(Number(id)),
    enabled:  !!id,
    retry:    1,
  })

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0])
    }
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

  const allImages = [product.thumbnailUrl, ...(product.images ?? [])].filter(Boolean) as string[]
  const price     = selectedVariant?.price     ?? product.variants[0]?.price
  const origPrice = selectedVariant?.originalPrice ?? product.variants[0]?.originalPrice
  const discount  = selectedVariant?.discountPercent ?? 0
  const stock     = selectedVariant?.stockQuantity ?? 0

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!selectedVariant)  { toast.error('Vui lòng chọn phân loại'); return }
    if (stock === 0)        { toast.error('Sản phẩm đã hết hàng'); return }
    toast.success('Đã thêm vào giỏ hàng!')
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!selectedVariant)  { toast.error('Vui lòng chọn phân loại'); return }
    if (stock === 0)        { toast.error('Sản phẩm đã hết hàng'); return }
    toast.success('Chức năng thanh toán — Sprint 3')
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
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5"
                              fill={i < Math.round(product.averageRating) ? '#facc15' : 'none'}
                              stroke={i < Math.round(product.averageRating) ? '#facc15' : '#d1d5db'} />
                    ))}
                    <span className="text-gray-500 ml-1">({product.averageRating?.toFixed(1) || 0})</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Đã bán {product.soldCount}</span>
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
                  <button onClick={handleAddToCart}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                             border-2 border-orange-500 text-orange-500 font-semibold
                             rounded-xl hover:bg-orange-50 transition-colors text-sm">
                    <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
                  </button>
                  <button onClick={handleBuyNow}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                             bg-orange-500 hover:bg-orange-600 text-white font-semibold
                             rounded-xl transition-colors text-sm">
                    <Zap className="h-4 w-4" /> Mua ngay
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