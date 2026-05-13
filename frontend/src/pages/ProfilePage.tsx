import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Phone, Lock, CheckCircle, XCircle,
  Eye, EyeOff, Camera
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'
import OtpModal from '@/components/ui/OtpModal'
import { maskEmail, maskPhone } from '@/utils/mask'

type ActiveModal = 'verifyEmail' | 'verifyPhone' | 'changePassword' | null

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword']
})

type PwForm = z.infer<typeof pwSchema>

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [changePwStep, setChangePwStep] = useState<'form' | 'otp'>('form')
  const [pwData, setPwData] = useState<PwForm | null>(null)

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) })

  if (!user) return null

  // Gửi OTP đổi mật khẩu → sau đó mở OTP modal
  const handlePwFormSubmit = async (data: PwForm) => {
    try {
      await authApi.sendVerifyEmail(user.email)
      setPwData(data)
      setChangePwStep('otp')
      setActiveModal('changePassword')
      toast.success('Đã gửi OTP xác nhận vào email')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleVerifyEmailOtp = async (otp: string) => {
    await authApi.verifyEmail(user.email, otp)
    updateUser({ emailVerified: true })
    setActiveModal(null)
    toast.success('Xác thực email thành công!')
  }

  const handleChangePwOtp = async (otp: string) => {
    if (!pwData) return
    await authApi.changePassword(pwData.currentPassword, pwData.newPassword, otp)
    setActiveModal(null)
    setChangePwStep('form')
    pwForm.reset()
    toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
  }

  const VerifyBadge = ({ verified }: { verified: boolean }) => verified ? (
    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
      <CheckCircle className="h-3.5 w-3.5" /> Đã xác thực
    </span>
  ) : (
    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
      <XCircle className="h-3.5 w-3.5" /> Chưa xác thực
    </span>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h1>

      {/* Avatar + tên */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-9 w-9 text-orange-400" />
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full
                               flex items-center justify-center shadow hover:bg-orange-600">
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{user.fullName}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium
              ${user.role === 'admin' ? 'bg-red-100 text-red-600'
                : user.role === 'manager' ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'}`}>
              {user.role === 'admin' ? 'Quản trị viên'
                : user.role === 'manager' ? 'Quản lý' : 'Thành viên'}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin tài khoản */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-800">Tài khoản</h2>

        {/* Email */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-800">{maskEmail(user.email)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VerifyBadge verified={user.emailVerified} />
            {!user.emailVerified && (
              <button onClick={() => {
                authApi.sendVerifyEmail(user.email)
                setActiveModal('verifyEmail')
              }}
                className="text-xs text-orange-500 border border-orange-300 px-2.5 py-1
                           rounded-lg hover:bg-orange-50 transition-colors">
                Xác thực
              </button>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Số điện thoại</p>
              <p className="text-sm font-medium text-gray-800">{maskPhone(user.phoneNumber)}</p>
            </div>
          </div>
          <VerifyBadge verified={user.phoneVerified} />
        </div>

        {/* Đổi mật khẩu */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm font-semibold text-gray-800">Đổi mật khẩu</p>
          </div>
          <form onSubmit={pwForm.handleSubmit(handlePwFormSubmit)} className="space-y-3 pl-7">
            {([
              { name: 'currentPassword', label: 'Mật khẩu hiện tại', show: showCurrentPw, setShow: setShowCurrentPw },
              { name: 'newPassword', label: 'Mật khẩu mới', show: showNewPw, setShow: setShowNewPw },
              { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', show: showNewPw, setShow: setShowNewPw },
            ] as const).map(({ name, label, show, setShow }) => (
              <div key={name}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <div className="relative">
                  <input {...pwForm.register(name)}
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pr-9 px-3 py-2 text-sm border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {pwForm.formState.errors[name] && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {pwForm.formState.errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400">
              * Một mã OTP sẽ được gửi tới email của bạn để xác nhận đổi mật khẩu.
            </p>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium
                         px-5 py-2 rounded-lg transition-colors">
              Tiếp tục
            </button>
          </form>
        </div>
      </div>

      {/* OTP Modals */}
      {activeModal === 'verifyEmail' && (
        <OtpModal
          title="Xác thực Email"
          description={`Nhập mã OTP đã gửi tới ${maskEmail(user.email)}`}
          onVerify={handleVerifyEmailOtp}
          onResend={() => authApi.sendVerifyEmail(user.email)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'changePassword' && changePwStep === 'otp' && (
        <OtpModal
          title="Xác nhận đổi mật khẩu"
          description={`Nhập mã OTP đã gửi tới ${maskEmail(user.email)} để xác nhận.`}
          onVerify={handleChangePwOtp}
          onResend={() => authApi.sendVerifyEmail(user.email)}
          onClose={() => { setActiveModal(null); setChangePwStep('form') }}
        />
      )}
    </div>
  )
}
