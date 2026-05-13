import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Flame, Clock, ChevronLeft } from 'lucide-react'
import { homeApi } from '@/api/productApi'
import { formatPrice } from '@/utils/mask'
import { useState, useEffect } from 'react'
import type { FlashSaleProduct } from '@/types/product.types'

function Countdown({ endTime }: { endTime: string }) {
  const calc = () => {
    const diff = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000))
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="flex items-center gap-1">
      <Clock className="h-4 w-4" />
      {[t.h, t.m, t.s].map((v, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-red-500 text-white font-bold text-sm px-1.5 py-0.5 rounded">{pad(v)}</span>
          {i < 2 && <span className="font-bold">:</span>}
        </span>
      ))}
    </span>
  )
}

function FlashSaleCard({ item }: { item: FlashSaleProduct }) {
  return (
    <Link to={`/products/${item.productId}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="relative overflow-hidden bg-gray-100">
        <img src={item.thumbnailUrl || 'https://placehold.co/300x300'}
          alt={item.productName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300' }}
        />
        <span className="absolute top-2 left-2 bg-red-500 text-white font-bold text-xs px-2 py-1 rounded">
          -{item.discountPercent}%
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{item.productName}</p>
        <p className="text-orange-500 font-bold text-lg">{formatPrice(item.salePrice)}</p>
        {item.originalPrice && (
          <p className="text-xs text-gray-400 line-through mb-2">{formatPrice(item.originalPrice)}</p>
        )}
        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
            style={{ width: `${item.remainingPercent}%` }} />
        </div>
        <p className="text-xs text-center text-gray-400 mt-1">
          Đã bán {item.quantitySold}/{item.quantityLimit}
        </p>
      </div>
    </Link>
  )
}

export function FlashSalePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['flashSale', 'full'],
    queryFn: () => homeApi.getFlashSale(50),
    refetchInterval: 60000,
  })

  const endTime = data?.[0]?.endTime

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Flame className="h-6 w-6 text-red-500" fill="currentColor" />
          <h1 className="text-xl font-bold text-gray-800">Flash Sale</h1>
          {endTime && (
            <div className="text-sm text-gray-600">
              Kết thúc sau: <Countdown endTime={endTime} />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.map((item) => <FlashSaleCard key={item.productId} item={item} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Flame className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Hiện chưa có chương trình Flash Sale</p>
          <Link to="/" className="text-orange-500 text-sm hover:underline mt-2 inline-block">
            Quay lại trang chủ
          </Link>
        </div>
      )}
    </div>
  )
}
