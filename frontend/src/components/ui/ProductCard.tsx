import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { ProductSummary } from '@/types/product.types'
import { formatPrice } from '@/utils/mask'

interface Props {
  product: ProductSummary
  size?: 'sm' | 'md'
}

export default function ProductCard({ product, size = 'md' }: Props) {
  return (
    <Link
      to={`/products/${product.productId}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md
                 transition-all hover:-translate-y-0.5 group flex flex-col"
    >
      {/* Ảnh */}
      <div className="relative overflow-hidden bg-gray-100">
        <img
          src={product.thumbnailUrl || 'https://placehold.co/300x300?text=No+Image'}
          alt={product.productName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Image' }}
        />
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs
                           font-bold px-1.5 py-0.5 rounded-md">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className={`flex flex-col flex-1 ${size === 'sm' ? 'p-2' : 'p-3'}`}>
        <p className="text-[11px] text-gray-400 truncate mb-0.5">{product.shopName}</p>
        <p className={`font-medium text-gray-800 line-clamp-2 leading-tight flex-1
                       ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {product.productName}
        </p>

        <div className="mt-1.5">
          <p className={`text-orange-500 font-bold ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
            {product.price ? formatPrice(product.price) : 'Liên hệ'}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
            <span className="text-xs text-gray-500">
              {product.averageRating ? product.averageRating.toFixed(1) : 'Mới'}
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            {product.soldCount > 0 ? `Đã bán ${product.soldCount}` : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}
