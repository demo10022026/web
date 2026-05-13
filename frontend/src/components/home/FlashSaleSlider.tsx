import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react'
import type { FlashSaleProduct } from '@/types/product.types'
import { formatPrice } from '@/utils/mask'

interface Props {
  items: FlashSaleProduct[]
  endTime?: string
}

function Countdown({ endTime }: { endTime: string }) {
  const calc = () => {
    const diff = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000))
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [endTime])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4 text-white" />
      {[t.h, t.m, t.s].map((v, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-white text-red-500 font-bold text-sm px-1.5 py-0.5 rounded">
            {pad(v)}
          </span>
          {i < 2 && <span className="text-white font-bold text-sm">:</span>}
        </span>
      ))}
    </div>
  )
}

function FlashCard({ item }: { item: FlashSaleProduct }) {
  return (
    <Link to={`/products/${item.productId}`}
      className="shrink-0 w-40 bg-white rounded-xl overflow-hidden shadow-sm
                 hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="relative overflow-hidden bg-gray-100">
        <img src={item.thumbnailUrl || 'https://placehold.co/200x200?text=SP'}
          alt={item.productName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200' }}
        />
        <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs
                         font-bold px-1.5 py-0.5 rounded">
          -{item.discountPercent}%
        </span>
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5">
          {item.productName}
        </p>
        <p className="text-orange-500 font-bold text-sm">{formatPrice(item.salePrice)}</p>
        {item.originalPrice && (
          <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
        )}
        {/* Progress bar số lượng còn lại */}
        <div className="mt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
              style={{ width: `${item.remainingPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 text-center">
            {item.quantitySold}/{item.quantityLimit} đã bán
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function FlashSaleSlider({ items, endTime }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Auto scroll mỗi 3 giây
  useEffect(() => {
    if (!sliderRef.current || items.length === 0) return
    const interval = setInterval(() => {
      const el = sliderRef.current!
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: 176, behavior: 'smooth' })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [items])

  const updateArrows = () => {
    if (!sliderRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (dir: 'left' | 'right') => {
    sliderRef.current?.scrollBy({ left: dir === 'left' ? -352 : 352, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  const firstEndTime = endTime || items[0]?.endTime

  return (
    <section className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-white" fill="white" />
          <span className="text-white font-bold text-lg tracking-wide">FLASH SALE</span>
        </div>
        {firstEndTime && <Countdown endTime={firstEndTime} />}
        <Link to="/flash-sale"
          className="text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5
                     rounded-full transition-colors">
          Xem tất cả →
        </Link>
      </div>

      {/* Slider */}
      <div className="relative px-2 py-4">
        {canScrollLeft && (
          <button onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white
                       shadow-md rounded-full flex items-center justify-center hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}

        <div
          ref={sliderRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => <FlashCard key={item.productId} item={item} />)}
        </div>

        {canScrollRight && (
          <button onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white
                       shadow-md rounded-full flex items-center justify-center hover:bg-gray-50">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  )
}
