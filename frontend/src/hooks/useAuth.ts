import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, RegisterRequest } from '@/types/auth.types'

export function useAuth() {
  const navigate = useNavigate()
  const { setAuth, clearAuth, refreshToken, isAuthenticated, user } = useAuthStore()

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data)
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉')
      navigate('/')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Đăng ký thất bại'
      toast.error(msg)
    },
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data)
      toast.success(`Xin chào, ${data.user.fullName}!`)
      navigate('/')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại'
      toast.error(msg)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(refreshToken!),
    onSettled: () => {
      clearAuth()
      navigate('/login')
      toast.success('Đã đăng xuất')
    },
  })

  return {
    user,
    isAuthenticated,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
