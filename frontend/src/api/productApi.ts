import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type {
  HomeData,
  ProductSummary,
  FlashSaleProduct,
  ProductDetail,
  PageResponse,
  CategoryDto,
} from '@/types/product.types'

export const homeApi = {
  getHomeData: async (): Promise<HomeData> => {
    const res = await axiosInstance.get<ApiResponse<HomeData>>('/home')
    return res.data.data!
  },

  getFlashSale: async (limit = 20): Promise<FlashSaleProduct[]> => {
    const res = await axiosInstance.get<ApiResponse<FlashSaleProduct[]>>(
        `/home/flash-sale?limit=${limit}`
    )

    return res.data.data!
  },

  getNewProducts: async (limit = 20): Promise<ProductSummary[]> => {
    const res = await axiosInstance.get<ApiResponse<ProductSummary[]>>(
        `/home/new-products?limit=${limit}`
    )

    return res.data.data!
  },

  getBestSellers: async (limit = 20): Promise<ProductSummary[]> => {
    const res = await axiosInstance.get<ApiResponse<ProductSummary[]>>(
        `/home/best-sellers?limit=${limit}`
    )

    return res.data.data!
  },
}

export interface ProductSearchParams {
  keyword?: string
  parentCategoryId?: number
  categoryId?: number
  brandId?: number
  shopName?: string
  brandName?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  size?: number
}

function cleanParams(params: ProductSearchParams) {
  return Object.fromEntries(
      Object.entries(params).filter(([, value]) => {
        return value !== undefined && value !== null && value !== ''
      })
  )
}

export const productApi = {
  getProducts: async (
      params: ProductSearchParams = {}
  ): Promise<PageResponse<ProductSummary>> => {
    const res = await axiosInstance.get<
        ApiResponse<PageResponse<ProductSummary>>
    >('/products', {
      params: cleanParams(params),
    })

    return res.data.data!
  },

  getDetail: async (id: number): Promise<ProductDetail> => {
    const res = await axiosInstance.get<ApiResponse<ProductDetail>>(
        `/products/${id}`
    )

    return res.data.data!
  },

  getCategories: async (): Promise<CategoryDto[]> => {
    const res = await axiosInstance.get<ApiResponse<CategoryDto[]>>(
        '/products/categories'
    )

    return res.data.data!
  },
}