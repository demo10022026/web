import axiosInstance from './axiosInstance'
import type { ApiResponse } from '@/types/auth.types'
import type { SellerProfile, SellerDocument } from '@/types/seller.types'

export const sellerOnboardingApi = {
  /**
   * Bước 1a — Nộp đơn đăng ký
   * POST /api/seller/apply
   */
  apply: async (
    identityNumber: string,
    taxCode?: string
  ): Promise<SellerProfile> => {
    const res = await axiosInstance.post<ApiResponse<SellerProfile>>(
      '/seller/apply',
      { identityNumber, taxCode }
    )
    return res.data.data!
  },

  /**
   * Bước 1b — Upload giấy tờ
   * POST /api/seller/documents  (multipart)
   */
  uploadDocument: async (
    docType: SellerDocument['documentType'],
    file: File
  ): Promise<SellerDocument> => {
    const form = new FormData()
    form.append('type', docType)
    form.append('file', file)
    const res = await axiosInstance.post<ApiResponse<SellerDocument>>(
      '/seller/documents',
      form
    )
    return res.data.data!
  },

  /**
   * Lấy hồ sơ seller hiện tại
   * GET /api/seller/me
   * Trả null nếu chưa apply (403/404)
   */
  getMyProfile: async (): Promise<SellerProfile | null> => {
    try {
      const res = await axiosInstance.get<ApiResponse<SellerProfile>>('/seller/me')
      return res.data.data ?? null
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403 || status === 404) return null
      throw err
    }
  },
}
