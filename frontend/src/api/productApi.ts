import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type {
  HomeData, ProductSummary, FlashSaleProduct,
  ProductDetail, PageResponse
} from '@/types/product.types'

export const homeApi = {
  getHomeData: async (): Promise<HomeData> => {
    const res = await axiosInstance.get<ApiResponse<HomeData>>('/home')
    return res.data.data!
  },
  getFlashSale: async (limit = 20): Promise<FlashSaleProduct[]> => {
    const res = await axiosInstance.get<ApiResponse<FlashSaleProduct[]>>(`/home/flash-sale?limit=${limit}`)
    return res.data.data!
  },
  getNewProducts: async (limit = 20): Promise<ProductSummary[]> => {
    const res = await axiosInstance.get<ApiResponse<ProductSummary[]>>(`/home/new-products?limit=${limit}`)
    return res.data.data!
  },
  getBestSellers: async (limit = 20): Promise<ProductSummary[]> => {
    const res = await axiosInstance.get<ApiResponse<ProductSummary[]>>(`/home/best-sellers?limit=${limit}`)
    return res.data.data!
  },
}

export const productApi = {
  getProducts: async (params: {
    keyword?: string
    categoryId?: number
    brandId?: number
    minPrice?: number
    maxPrice?: number
    sort?: string
    page?: number
    size?: number
  }): Promise<PageResponse<ProductSummary>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ProductSummary>>>('/products', { params })
    return res.data.data!
  },

  getDetail: async (id: number): Promise<ProductDetail> => {
    const res = await axiosInstance.get<ApiResponse<ProductDetail>>(`/products/${id}`)
    return res.data.data!
  },
}
