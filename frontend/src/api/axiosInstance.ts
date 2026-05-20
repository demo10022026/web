import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import type { ApiResponse, AuthResponse } from '@/types/auth.types'

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

const plainAxios = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function resolveRefreshQueue(token: string | null) {
  refreshQueue.forEach((callback) => callback(token))
  refreshQueue = []
}

let hasRedirectedToLogin = false

function logoutByExpiredSession() {
  if (hasRedirectedToLogin) return

  hasRedirectedToLogin = true

  useAuthStore.getState().clearAuth()

  toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')

  if (window.location.pathname !== '/login') {
    window.location.href = '/login?expired=1'
  }
}

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
    (response) => response,

    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined

      const status = error.response?.status
      const errorCode = error.response?.data?.errorCode

      const isAuthError =
          status === 401 ||
          errorCode === 'TOKEN_EXPIRED' ||
          errorCode === 'INVALID_TOKEN' ||
          errorCode === 'UNAUTHORIZED'

      if (!isAuthError || !originalRequest) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        logoutByExpiredSession()
        return Promise.reject(error)
      }

      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        logoutByExpiredSession()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newAccessToken) => {
            if (!newAccessToken) {
              reject(error)
              return
            }

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            resolve(axiosInstance(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const res = await plainAxios.post<ApiResponse<AuthResponse>>(
            '/auth/refresh',
            { refreshToken }
        )

        const authData = res.data.data

        if (!authData?.accessToken || !authData?.refreshToken) {
          throw new Error('Refresh token response không hợp lệ')
        }

        useAuthStore.getState().setAuth(authData)

        axiosInstance.defaults.headers.common.Authorization =
            `Bearer ${authData.accessToken}`

        resolveRefreshQueue(authData.accessToken)

        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        resolveRefreshQueue(null)
        logoutByExpiredSession()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
)

export default axiosInstance