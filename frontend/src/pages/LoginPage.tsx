import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data)
      toast.success(`Xin chào, ${data.user.fullName}!`)
      navigate('/')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại')
    },
  })

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShoppingBag className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold text-orange-500">ShopVN</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Đăng nhập</h1>
        <p className="text-gray-500 text-sm mb-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-orange-500 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>

        <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register('email')} type="email" placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                           placeholder:text-gray-300" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register('password')} type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                           placeholder:text-gray-300" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-orange-500 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" disabled={loginMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                       text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
            {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
