import axiosInstance from './axiosInstance'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth.types'

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return res.data.data!
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return res.data.data!
  },

  logout: async (refreshToken: string): Promise<void> => {
    await axiosInstance.post('/auth/logout', { refreshToken })
  },

  // ---- OTP / Verification ----
  sendVerifyEmail: async (email: string) => {
    await axiosInstance.post('/auth/send-verify-email', { email })
  },

  verifyEmail: async (email: string, otp: string) => {
    await axiosInstance.post('/auth/verify-email', { email, otp })
  },

  forgotPassword: async (email: string) => {
    await axiosInstance.post('/auth/forgot-password', { email })
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    await axiosInstance.post('/auth/reset-password', { email, otp, newPassword })
  },

  changePassword: async (currentPassword: string, newPassword: string, otp: string) => {
    await axiosInstance.post('/auth/change-password', { currentPassword, newPassword, otp })
  },
}
