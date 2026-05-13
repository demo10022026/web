import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, TrendingUp, ChevronRight, Loader2 } from 'lucide-react'
import { homeApi } from '@/api/productApi'
import FlashSaleSlider from '@/components/home/FlashSaleSlider'
import ProductCard from '@/components/ui/ProductCard'

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [bestSellerTab, setBestSellerTab] = useState<'day' | 'week'>('day')

  const { data, isLoading } = useQuery({
    queryKey: ['homeData'],
    queryFn: homeApi.getHomeData,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Mua sắm thả ga 🛒</h1>
          <p className="text-orange-100 text-sm mb-4">Hàng triệu sản phẩm, ưu đãi mỗi ngày</p>
          {/* Categories quick links */}
          {data?.categories && data.categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {data.categories.slice(0, 8).map((cat) => (
                <Link key={cat.categoryId}
                  to={`/search?categoryId=${cat.categoryId}`}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs
                             px-3 py-1.5 rounded-full transition-colors">
                  {cat.categoryName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Flash Sale */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 flex justify-center">
            <Loader2 className="animate-spin text-orange-400 h-8 w-8" />
          </div>
        ) : data?.flashSale && data.flashSale.length > 0 ? (
          <FlashSaleSlider items={data.flashSale} />
        ) : null}

        {/* Sản phẩm mới */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-gray-800 text-lg">Sản phẩm mới</h2>
            </div>
            <Link to="/search?sort=newest"
              className="text-orange-500 text-sm flex items-center gap-0.5 hover:underline">
              Xem thêm <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {isLoading ? <SectionSkeleton /> : (
              data?.newProducts && data.newProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.newProducts.map((p) => <ProductCard key={p.productId} product={p} />)}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Chưa có sản phẩm</p>
              )
            )}
          </div>
        </section>

        {/* Bán chạy */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-gray-800 text-lg">Bán chạy</h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5 ml-2">
                {(['day', 'week'] as const).map((tab) => (
                  <button key={tab} onClick={() => setBestSellerTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                      ${bestSellerTab === tab
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'day' ? 'Hôm nay' : 'Tuần này'}
                  </button>
                ))}
              </div>
            </div>
            <Link to="/search?sort=bestseller"
              className="text-orange-500 text-sm flex items-center gap-0.5 hover:underline">
              Xem thêm <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {isLoading ? <SectionSkeleton /> : (
              data?.bestSellers && data.bestSellers.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.bestSellers.map((p) => <ProductCard key={p.productId} product={p} />)}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Chưa có sản phẩm</p>
              )
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
