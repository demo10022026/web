import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username tối thiểu 3 ký tự')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ chứa chữ, số và dấu _'),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isRegistering } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = ({ confirmPassword, ...data }: FormData) => registerUser(data)

  const Field = ({
    label, name, type = 'text', placeholder,
  }: { label: string; name: keyof FormData; type?: string; placeholder: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                   placeholder:text-gray-300"
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShoppingBag className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold text-orange-500">ShopVN</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Đăng ký</h1>
        <p className="text-gray-500 text-sm mb-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-orange-500 hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" name="username" placeholder="john_doe" />
            <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn A" />
          </div>
          <Field label="Email" name="email" type="email" placeholder="your@email.com" />
          <Field label="Số điện thoại" name="phoneNumber" placeholder="0912345678" />

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                           placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <Field
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
          />

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                       text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            {isRegistering ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}
