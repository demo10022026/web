import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { productApi } from '@/api/productApi'
import ProductCard from '@/components/ui/ProductCard'
import { formatPrice } from '@/utils/mask'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price_asc',  label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const keyword    = searchParams.get('q') || ''
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  const sort       = searchParams.get('sort') || 'newest'
  const page       = Number(searchParams.get('page') || 0)

  const { data, isLoading } = useQuery({
    queryKey: ['products', keyword, categoryId, sort, page, minPrice, maxPrice],
    queryFn: () => productApi.getProducts({
      keyword: keyword || undefined,
      categoryId,
      sort,
      page,
      size: 20,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    staleTime: 2 * 60 * 1000,
  })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams)
    if (minPrice) next.set('minPrice', minPrice); else next.delete('minPrice')
    if (maxPrice) next.set('maxPrice', maxPrice); else next.delete('maxPrice')
    setSearchParams(next)
    setShowFilter(false)
  }

  const clearFilters = () => {
    setMinPrice(''); setMaxPrice('')
    const next = new URLSearchParams()
    if (keyword) next.set('q', keyword)
    setSearchParams(next)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {keyword ? `Kết quả cho "${keyword}"` : 'Tất cả sản phẩm'}
          </h1>
          {data && (
            <p className="text-sm text-gray-500">{data.totalElements} sản phẩm</p>
          )}
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                     rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <SlidersHorizontal className="h-4 w-4" />
          Lọc
        </button>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setParam('sort', opt.value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${sort === opt.value
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800 text-sm">Bộ lọc</span>
            <button onClick={() => setShowFilter(false)} className="text-gray-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Giá từ (đ)</label>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                type="number" placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <span className="text-gray-400 pb-2">—</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Đến (đ)</label>
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                type="number" placeholder="10.000.000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <button onClick={applyPrice}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm
                         hover:bg-orange-600 transition-colors shrink-0">
              Áp dụng
            </button>
            <button onClick={clearFilters}
              className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">
              Xóa lọc
            </button>
          </div>
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.content && data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.content.map((p) => <ProductCard key={p.productId} product={p} />)}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-8">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} onClick={() => setParam('page', String(i))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                    ${page === i
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Không tìm thấy sản phẩm nào</p>
          <p className="text-gray-300 text-sm mt-1">Thử từ khóa khác hoặc xóa bộ lọc</p>
        </div>
      )}
    </div>
  )
}
