import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
}

export interface CategoryOption {
    categoryId: number
    categoryName: string
    parentCategoryId?: number | null
}

export interface BrandOption {
    brandId: number
    brandName: string
}

export interface SellerProductOptions {
    categories: CategoryOption[]
    brands: BrandOption[]
}

export interface CreateProductVariantPayload {
    variantName?: string
    sku?: string
    price: number
    originalPrice?: number | null
    stockQuantity: number
    weight?: number
    length?: number
    width?: number
    height?: number
}

export interface CreateProductPayload {
    productName: string
    description?: string
    parentCategoryId: number
    categoryId: number
    brandName?: string | null
    productStatus: 'draft' | 'active'
    thumbnailIndex: number
    variants: CreateProductVariantPayload[]
    images: File[]
}

export type SellerProductStatus = 'draft' | 'active' | 'inactive' | 'banned'

export interface SellerProductVariant {
    variantId: number
    sku?: string | null
    variantName?: string | null
    price: number
    originalPrice?: number | null
    stockQuantity: number
    weight?: number | null
    length?: number | null
    width?: number | null
    height?: number | null
    imageUrl?: string | null
}

export interface SellerProductImage {
    imageId: number
    imageUrl: string
    isThumbnail: boolean
}

export interface SellerProductResponse {
    productId: number
    shopId: number

    parentCategoryId?: number | null
    parentCategoryName?: string | null

    categoryId?: number | null
    categoryName?: string | null

    brandId?: number | null
    brandName?: string | null

    productName: string
    description?: string | null
    thumbnailUrl?: string | null
    productStatus: SellerProductStatus

    soldCount: number
    averageRating: number

    createdAt?: string | null
    updatedAt?: string | null

    variants: SellerProductVariant[]
    images: SellerProductImage[]
}

export interface SellerProductListParams {
    keyword?: string
    status?: string
    page?: number
    size?: number
}

export interface UpdateSellerProductVariantPayload {
    variantId?: number
    variantName?: string
    sku?: string
    price: number
    originalPrice?: number | null
    stockQuantity: number
    weight?: number
    length?: number
    width?: number
    height?: number
}

export interface UpdateSellerProductPayload {
    productName: string
    description?: string
    parentCategoryId: number
    categoryId: number
    brandName?: string | null
    productStatus: Exclude<SellerProductStatus, 'banned'>
    variants: UpdateSellerProductVariantPayload[]
}

function cleanParams<T extends object>(params: T) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            return value !== undefined && value !== null && value !== ''
        })
    )
}

export const sellerProductApi = {
    getOptions: async (): Promise<SellerProductOptions> => {
        const res = await axiosInstance.get<ApiResponse<SellerProductOptions>>(
            '/seller/products/options'
        )

        return res.data.data!
    },

    createProduct: async (
        payload: CreateProductPayload
    ): Promise<SellerProductResponse> => {
        const formData = new FormData()

        formData.append('productName', payload.productName)
        formData.append('parentCategoryId', String(payload.parentCategoryId))
        formData.append('categoryId', String(payload.categoryId))
        formData.append('productStatus', payload.productStatus)
        formData.append('thumbnailIndex', String(payload.thumbnailIndex))
        formData.append('variantsJson', JSON.stringify(payload.variants))

        if (payload.description) {
            formData.append('description', payload.description)
        }

        if (payload.brandName?.trim()) {
            formData.append('brandName', payload.brandName.trim())
        }

        payload.images.forEach((file) => {
            formData.append('images', file)
        })

        const res = await axiosInstance.post<ApiResponse<SellerProductResponse>>(
            '/seller/products',
            formData
        )

        return res.data.data!
    },

    getMyProducts: async (
        params: SellerProductListParams = {}
    ): Promise<PageResponse<SellerProductResponse>> => {
        const res = await axiosInstance.get<
            ApiResponse<PageResponse<SellerProductResponse>>
        >('/seller/products', {
            params: cleanParams(params),
        })

        return res.data.data!
    },

    getMyProductDetail: async (
        productId: number
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.get<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}`
        )

        return res.data.data!
    },

    updateProduct: async (
        productId: number,
        payload: UpdateSellerProductPayload
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.put<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}`,
            payload
        )

        return res.data.data!
    },

    updateProductStatus: async (
        productId: number,
        productStatus: Exclude<SellerProductStatus, 'banned'>
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.patch<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}/status`,
            {
                productStatus,
            }
        )

        return res.data.data!
    },

    updateVariantStock: async (
        productId: number,
        variantId: number,
        stockQuantity: number
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.patch<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}/variants/${variantId}/stock`,
            {
                stockQuantity,
            }
        )

        return res.data.data!
    },

    addProductImages: async (
        productId: number,
        images: File[]
    ): Promise<SellerProductResponse> => {
        const formData = new FormData()

        images.forEach((file) => {
            formData.append('images', file)
        })

        const res = await axiosInstance.post<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}/images`,
            formData
        )

        return res.data.data!
    },

    deleteProductImage: async (
        productId: number,
        imageId: number
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.delete<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}/images/${imageId}`
        )

        return res.data.data!
    },

    setProductThumbnail: async (
        productId: number,
        imageId: number
    ): Promise<SellerProductResponse> => {
        const res = await axiosInstance.patch<ApiResponse<SellerProductResponse>>(
            `/seller/products/${productId}/images/${imageId}/thumbnail`
        )

        return res.data.data!
    },
}
