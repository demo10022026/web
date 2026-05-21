import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi'
import OtpModal from '@/components/ui/OtpModal'

type Step = 'email' | 'otp' | 'newPassword' | 'done'

const emailSchema = z.object({ email: z.string().email('Email không đúng định dạng') })
const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword']
})

type EmailFormValues = z.infer<typeof emailSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })
  const pwForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  const handleSendOtp = async ({ email: e }: EmailFormValues) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(e)
      setEmail(e)
      setShowOtpModal(true)
      toast.success('Đã gửi OTP vào email của bạn')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email không tồn tại')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (code: string) => {
    // Lưu OTP tạm để dùng khi reset
    setOtp(code)
    setShowOtpModal(false)
    setStep('newPassword')
  }

  const handleResetPassword = async ({ newPassword }: PasswordFormValues) => {
    setLoading(true)
    try {
      await authApi.resetPassword(email, otp, newPassword)
      setStep('done')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShoppingBag className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-orange-500">ShopVN</span>
          </div>

          {/* Step: email */}
          {step === 'email' && (
              <>
                <h1 className="text-xl font-semibold text-gray-800 mb-1">Quên mật khẩu</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                </p>
                <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input {...emailForm.register('email')} type="email" placeholder="your@email.com"
                             className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
                    </div>
                    {emailForm.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <button type="submit" disabled={loading}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                           text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </button>
                </form>
              </>
          )}

          {/* Step: new password */}
          {step === 'newPassword' && (
              <>
                <h1 className="text-xl font-semibold text-gray-800 mb-1">Đặt mật khẩu mới</h1>
                <p className="text-gray-500 text-sm mb-6">Tạo mật khẩu mới cho tài khoản của bạn.</p>
                <form onSubmit={pwForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  {(['newPassword', 'confirmPassword'] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field === 'newPassword' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu'}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input {...pwForm.register(field)}
                                 type={showPw ? 'text' : 'password'}
                                 placeholder="••••••••"
                                 className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                          {field === 'newPassword' && (
                              <button type="button" onClick={() => setShowPw(!showPw)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                          )}
                        </div>
                        {pwForm.formState.errors[field] && (
                            <p className="text-red-500 text-xs mt-1">
                              {pwForm.formState.errors[field]?.message}
                            </p>
                        )}
                      </div>
                  ))}
                  <button type="submit" disabled={loading}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                           text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              </>
          )}

          {/* Step: done */}
          {step === 'done' && (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Đặt lại thành công!</h2>
                <p className="text-gray-500 text-sm mb-6">Mật khẩu của bạn đã được cập nhật.</p>
                <button onClick={() => navigate('/login')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold
                         py-2.5 rounded-lg text-sm transition-colors">
                  Đăng nhập ngay
                </button>
              </div>
          )}

          {step !== 'done' && (
              <p className="text-center text-sm text-gray-500 mt-4">
                <Link to="/login" className="text-orange-500 hover:underline">← Quay lại đăng nhập</Link>
              </p>
          )}
        </div>

        {showOtpModal && (
            <OtpModal
                title="Nhập mã xác nhận"
                description={`Chúng tôi đã gửi mã OTP 6 chữ số tới ${email}`}
                onVerify={handleVerifyOtp}
                onResend={() => authApi.forgotPassword(email)}
                onClose={() => setShowOtpModal(false)}
            />
        )}
      </div>
  )
}
