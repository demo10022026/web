import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { productApi } from '@/api/productApi'
import ProductCard from '@/components/ui/ProductCard'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
]

function toNumberParam(value: string | null) {
  if (!value) return undefined

  const n = Number(value)

  return Number.isFinite(n) ? n : undefined
}

function setOrDelete(params: URLSearchParams, key: string, value?: string) {
  const cleanValue = value?.trim()

  if (cleanValue) {
    params.set(key, cleanValue)
  } else {
    params.delete(key)
  }
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)

  const keyword = searchParams.get('q') || ''
  const parentCategoryId = toNumberParam(
      searchParams.get('parentCategoryId')
  )
  const categoryId = toNumberParam(searchParams.get('categoryId'))
  const brandId = toNumberParam(searchParams.get('brandId'))
  const shopName = searchParams.get('shopName') || ''
  const brandName = searchParams.get('brandName') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Number(searchParams.get('page') || 0)

  const [draftParentCategoryId, setDraftParentCategoryId] = useState(
      parentCategoryId ? String(parentCategoryId) : ''
  )
  const [draftCategoryId, setDraftCategoryId] = useState(
      categoryId ? String(categoryId) : ''
  )
  const [draftShopName, setDraftShopName] = useState(shopName)
  const [draftBrandName, setDraftBrandName] = useState(brandName)
  const [draftMinPrice, setDraftMinPrice] = useState(minPriceParam)
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPriceParam)

  useEffect(() => {
    setDraftParentCategoryId(parentCategoryId ? String(parentCategoryId) : '')
    setDraftCategoryId(categoryId ? String(categoryId) : '')
    setDraftShopName(shopName)
    setDraftBrandName(brandName)
    setDraftMinPrice(minPriceParam)
    setDraftMaxPrice(maxPriceParam)
  }, [
    parentCategoryId,
    categoryId,
    shopName,
    brandName,
    minPriceParam,
    maxPriceParam,
  ])

  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: productApi.getCategories,
    staleTime: 10 * 60 * 1000,
  })

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'products',
      keyword,
      parentCategoryId,
      categoryId,
      brandId,
      shopName,
      brandName,
      minPriceParam,
      maxPriceParam,
      sort,
      page,
    ],
    queryFn: () =>
        productApi.getProducts({
          keyword: keyword || undefined,
          parentCategoryId,
          categoryId,
          brandId,
          shopName: shopName || undefined,
          brandName: brandName || undefined,
          minPrice: minPriceParam ? Number(minPriceParam) : undefined,
          maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
          sort,
          page,
          size: 20,
        }),
    staleTime: 2 * 60 * 1000,
  })

  const parentCategories = useMemo(() => {
    return categories
  }, [categories])

  const childCategories = useMemo(() => {
    if (!draftParentCategoryId) return []

    const selectedParent = categories.find(
        (category) => category.categoryId === Number(draftParentCategoryId)
    )

    return selectedParent?.children ?? []
  }, [categories, draftParentCategoryId])

  const hasFilter =
      !!parentCategoryId ||
      !!categoryId ||
      !!brandId ||
      !!shopName ||
      !!brandName ||
      !!minPriceParam ||
      !!maxPriceParam

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)

    setOrDelete(next, key, value)

    if (key !== 'page') {
      next.delete('page')
    }

    setSearchParams(next)
  }

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)

    setOrDelete(next, 'parentCategoryId', draftParentCategoryId)
    setOrDelete(next, 'categoryId', draftCategoryId)
    setOrDelete(next, 'shopName', draftShopName)
    setOrDelete(next, 'brandName', draftBrandName)
    setOrDelete(next, 'minPrice', draftMinPrice)
    setOrDelete(next, 'maxPrice', draftMaxPrice)

    next.delete('page')

    setSearchParams(next)
    setShowFilter(false)
  }

  const clearFilters = () => {
    const next = new URLSearchParams()

    if (keyword) {
      next.set('q', keyword)
    }

    if (sort && sort !== 'newest') {
      next.set('sort', sort)
    }

    setDraftParentCategoryId('')
    setDraftCategoryId('')
    setDraftShopName('')
    setDraftBrandName('')
    setDraftMinPrice('')
    setDraftMaxPrice('')

    setSearchParams(next)
  }

  const title = keyword
      ? `Kết quả cho "${keyword}"`
      : 'Tất cả sản phẩm'

  return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {title}
            </h1>

            {data && (
                <p className="text-sm text-gray-500">
                  {data.totalElements} sản phẩm
                </p>
            )}
          </div>

          <button
              type="button"
              onClick={() => setShowFilter((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Lọc
          </button>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {SORT_OPTIONS.map((opt) => (
              <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParam('sort', opt.value)}
                  className={[
                    'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    sort === opt.value
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                  ].join(' ')}
              >
                {opt.label}
              </button>
          ))}
        </div>

        {showFilter && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">
                            Bộ lọc
                        </span>

                <button
                    type="button"
                    onClick={() => setShowFilter(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Danh mục tổng
                  </label>

                  <select
                      value={draftParentCategoryId}
                      onChange={(e) => {
                        setDraftParentCategoryId(e.target.value)
                        setDraftCategoryId('')
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Tất cả danh mục tổng</option>

                    {parentCategories.map((category) => (
                        <option
                            key={category.categoryId}
                            value={category.categoryId}
                        >
                          {category.categoryName}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Danh mục sản phẩm
                  </label>

                  <select
                      value={draftCategoryId}
                      onChange={(e) =>
                          setDraftCategoryId(e.target.value)
                      }
                      disabled={!draftParentCategoryId}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {draftParentCategoryId
                          ? 'Tất cả danh mục sản phẩm'
                          : 'Chọn danh mục tổng trước'}
                    </option>

                    {childCategories.map((category) => (
                        <option
                            key={category.categoryId}
                            value={category.categoryId}
                        >
                          {category.categoryName}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Tên shop
                  </label>

                  <input
                      value={draftShopName}
                      onChange={(e) =>
                          setDraftShopName(e.target.value)
                      }
                      placeholder="VD: Huy Store"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Tên thương hiệu
                  </label>

                  <input
                      value={draftBrandName}
                      onChange={(e) =>
                          setDraftBrandName(e.target.value)
                      }
                      placeholder="VD: Samsung, Nike..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Giá từ
                  </label>

                  <input
                      value={draftMinPrice}
                      onChange={(e) =>
                          setDraftMinPrice(e.target.value)
                      }
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Giá đến
                  </label>

                  <input
                      value={draftMaxPrice}
                      onChange={(e) =>
                          setDraftMaxPrice(e.target.value)
                      }
                      type="number"
                      min="0"
                      placeholder="10000000"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Xóa lọc
                </button>

                <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Áp dụng
                </button>
              </div>
            </div>
        )}

        {hasFilter && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              {parentCategoryId && (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
                            Danh mục tổng #{parentCategoryId}
                        </span>
              )}

              {categoryId && (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
                            Danh mục sản phẩm #{categoryId}
                        </span>
              )}

              {shopName && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                            Shop: {shopName}
                        </span>
              )}

              {brandName && (
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                            Thương hiệu: {brandName}
                        </span>
              )}

              {(minPriceParam || maxPriceParam) && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                            Giá: {minPriceParam || '0'} -{' '}
                    {maxPriceParam || '∞'}
                        </span>
              )}
            </div>
        )}

        {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 20 }).map((_, i) => (
                  <div
                      key={i}
                      className="overflow-hidden rounded-xl bg-white animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200" />

                    <div className="space-y-2 p-3">
                      <div className="h-3 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
              ))}
            </div>
        ) : isError ? (
            <div className="py-20 text-center">
              <p className="text-lg text-red-400">
                Không thể tải danh sách sản phẩm
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Kiểm tra lại backend hoặc thử tải lại trang.
              </p>
            </div>
        ) : data?.content && data.content.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {data.content.map((product) => (
                    <ProductCard
                        key={product.productId}
                        product={product}
                    />
                ))}
              </div>

              {data.totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-1">
                    {Array.from(
                        { length: data.totalPages },
                        (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() =>
                                    setParam('page', String(i))
                                }
                                className={[
                                  'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                                  page === i
                                      ? 'bg-orange-500 text-white'
                                      : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                                ].join(' ')}
                            >
                              {i + 1}
                            </button>
                        )
                    )}
                  </div>
              )}
            </>
        ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-gray-400">
                Không tìm thấy sản phẩm nào
              </p>

              <p className="mt-1 text-sm text-gray-300">
                Thử từ khóa khác hoặc xóa bộ lọc.
              </p>
            </div>
        )}
      </div>
  )
}