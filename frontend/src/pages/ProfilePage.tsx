import { useState }     from 'react'
import { Link }         from 'react-router-dom'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import {
  User, Mail, Phone, Lock, CheckCircle, XCircle,
  Eye, EyeOff, Camera, Store, Clock, ChevronRight,
  ShoppingBag, MapPin, Tag,
} from 'lucide-react'
import toast                from 'react-hot-toast'
import { useAuthStore }     from '@/store/authStore'
import { useSellerStore }   from '@/store/sellerStore'
import { authApi }          from '@/api/authApi'
import OtpModal             from '@/components/ui/OtpModal'
import { maskEmail, maskPhone } from '@/utils/mask'

type ModalType = 'verifyEmail' | 'changePassword' | null

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword:     z.string().min(8, 'Tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword'],
})
type PwForm = z.infer<typeof pwSchema>

// ── Seller Status Card ───────────────────────────────────────────
function SellerCard() {
  const { status, shopId, shopName, rejectionReason } = useSellerStore()

  const configs = {
    none: {
      bg: 'bg-orange-50', border: 'border-orange-100',
      icon: <Store className="h-5 w-5 text-orange-500" />,
      iconBg: 'bg-orange-100',
      title: 'Bán hàng cùng ShopVN',
      desc: 'Mở shop, đăng sản phẩm và tiếp cận hàng triệu khách hàng.',
      action: { to: '/become-seller', label: 'Đăng ký ngay', cls: 'bg-orange-500 hover:bg-orange-600 text-white' },
    },
    pending: {
      bg: 'bg-yellow-50', border: 'border-yellow-100',
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      iconBg: 'bg-yellow-100',
      title: 'Đang chờ xét duyệt',
      desc: 'Hồ sơ đang được xem xét trong 1–3 ngày làm việc.',
      action: { to: '/seller/status', label: 'Xem trạng thái', cls: 'border border-yellow-400 text-yellow-700 hover:bg-yellow-50' },
    },
    rejected: {
      bg: 'bg-red-50', border: 'border-red-100',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      iconBg: 'bg-red-100',
      title: 'Hồ sơ chưa được chấp nhận',
      desc: rejectionReason ?? 'Vui lòng xem lý do và nộp lại hồ sơ.',
      action: { to: '/become-seller', label: 'Nộp lại hồ sơ', cls: 'bg-red-500 hover:bg-red-600 text-white' },
    },
    approved: {
      bg: 'bg-green-50', border: 'border-green-100',
      icon: <Store className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
      title: shopId ? (shopName ?? 'Shop của tôi') : 'Tài khoản seller đã được duyệt!',
      desc: shopId ? 'Shop đang hoạt động.' : 'Hãy tạo shop để bắt đầu bán hàng.',
      action: {
        to: shopId ? '/seller/dashboard' : '/seller/shop/setup',
        label: shopId ? 'Vào Dashboard' : 'Tạo Shop ngay',
        cls: 'bg-green-600 hover:bg-green-700 text-white',
      },
    },
    suspended: {
      bg: 'bg-gray-50', border: 'border-gray-200',
      icon: <XCircle className="h-5 w-5 text-gray-400" />,
      iconBg: 'bg-gray-100',
      title: 'Tài khoản seller bị tạm khóa',
      desc: 'Vui lòng liên hệ hỗ trợ để được giải quyết.',
      action: { to: '/seller/status', label: 'Xem chi tiết', cls: 'border border-gray-300 text-gray-600 hover:bg-gray-100' },
    },
  } as const

  const cfg = configs[status]

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">{cfg.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cfg.desc}</p>
          </div>
        </div>
        <Link to={cfg.action.to}
          className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${cfg.action.cls}`}>
          {cfg.action.label}
        </Link>
      </div>

      {/* Quick links nếu đã có shop */}
      {status === 'approved' && shopId && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-green-100">
          <Link to="/seller/products/new"
            className="text-xs text-green-700 hover:underline flex items-center gap-1">
            + Thêm sản phẩm
          </Link>
          <Link to="/seller/dashboard"
            className="text-xs text-green-700 hover:underline flex items-center gap-1">
            Xem đơn hàng <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [modal,        setModal]        = useState<ModalType>(null)
  const [showCurrent,  setShowCurrent]  = useState(false)
  const [showNew,      setShowNew]      = useState(false)
  const [pwData,       setPwData]       = useState<PwForm | null>(null)
  const [changePwStep, setChangePwStep] = useState<'form' | 'otp'>('form')

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) })

  if (!user) return null

  // Handlers
  const handlePwSubmit = async (data: PwForm) => {
    try {
      await authApi.sendVerifyEmail(user.email)
      setPwData(data)
      setChangePwStep('otp')
      setModal('changePassword')
      toast.success('Đã gửi OTP vào email')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleVerifyEmailOtp = async (otp: string) => {
    await authApi.verifyEmail(user.email, otp)
    updateUser({ emailVerified: true })
    setModal(null)
    toast.success('Xác thực email thành công!')
  }

  const handleChangePwOtp = async (otp: string) => {
    if (!pwData) return
    await authApi.changePassword(pwData.currentPassword, pwData.newPassword, otp)
    setModal(null)
    setChangePwStep('form')
    pwForm.reset()
    toast.success('Đổi mật khẩu thành công!')
  }

  const PwField = ({ name, label, show, toggle }: {
    name: keyof PwForm; label: string; show: boolean; toggle: () => void
  }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input {...pwForm.register(name)} type={show ? 'text' : 'password'}
          placeholder="••••••••"
          className="w-full pr-10 px-3 py-2 text-sm border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 focus:bg-white" />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {pwForm.formState.errors[name] && (
        <p className="text-red-500 text-xs mt-1">{pwForm.formState.errors[name]?.message}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      <h1 className="text-xl font-bold text-gray-800">Tài khoản của tôi</h1>

      {/* ── Avatar + tên ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-9 w-9 text-orange-400" />
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full
                               flex items-center justify-center shadow hover:bg-orange-600 transition-colors">
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{user.fullName}</p>
            <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
              ${user.role === 'admin'   ? 'bg-red-100 text-red-600'
                : user.role === 'manager' ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'}`}>
              {user.role === 'admin' ? '👑 Quản trị viên'
                : user.role === 'manager' ? '🔧 Quản lý' : '👤 Thành viên'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Seller Card ── */}
      <SellerCard />

      {/* ── Thông tin tài khoản ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Thông tin tài khoản</h2>

        {/* Email */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-800">{maskEmail(user.email)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.emailVerified
              ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Đã xác thực
                </span>
              : <>
                  <span className="flex items-center gap-1 text-red-500 text-xs">
                    <XCircle className="h-3.5 w-3.5" /> Chưa xác thực
                  </span>
                  <button
                    onClick={async () => {
                      await authApi.sendVerifyEmail(user.email)
                      setModal('verifyEmail')
                    }}
                    className="text-xs text-orange-500 border border-orange-300 px-2.5 py-1
                               rounded-lg hover:bg-orange-50 transition-colors">
                    Xác thực
                  </button>
                </>}
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
          {user.phoneVerified
            ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> Đã xác thực
              </span>
            : <span className="flex items-center gap-1 text-red-500 text-xs">
                <XCircle className="h-3.5 w-3.5" /> Chưa xác thực
              </span>}
        </div>

        {/* Đổi mật khẩu */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Lock className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm font-semibold text-gray-800">Đổi mật khẩu</p>
          </div>
          <form onSubmit={pwForm.handleSubmit(handlePwSubmit)} className="space-y-3 pl-7">
            <PwField name="currentPassword" label="Mật khẩu hiện tại"
              show={showCurrent} toggle={() => setShowCurrent(p => !p)} />
            <PwField name="newPassword" label="Mật khẩu mới"
              show={showNew} toggle={() => setShowNew(p => !p)} />
            <PwField name="confirmPassword" label="Xác nhận mật khẩu mới"
              show={showNew} toggle={() => setShowNew(p => !p)} />
            <p className="text-xs text-gray-400">
              * Một mã OTP sẽ được gửi vào email để xác nhận.
            </p>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium
                         px-5 py-2 rounded-xl transition-colors">
              Tiếp tục
            </button>
          </form>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { to: '/orders',    icon: ShoppingBag, label: 'Đơn mua của tôi',   desc: 'Theo dõi trạng thái đơn hàng' },
          { to: '/addresses', icon: MapPin,       label: 'Địa chỉ của tôi',  desc: 'Quản lý địa chỉ giao hàng'   },
          { to: '/vouchers',  icon: Tag,          label: 'Voucher của tôi',  desc: 'Mã giảm giá đã lưu'           },
        ].map((item, i) => (
          <Link key={i} to={item.to}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50
                       transition-colors border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
        ))}
      </div>

      {/* ── OTP Modals ── */}
      {modal === 'verifyEmail' && (
        <OtpModal
          title="Xác thực Email"
          description={`Nhập mã OTP đã gửi tới ${maskEmail(user.email)}`}
          onVerify={handleVerifyEmailOtp}
          onResend={() => authApi.sendVerifyEmail(user.email)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'changePassword' && changePwStep === 'otp' && (
        <OtpModal
          title="Xác nhận đổi mật khẩu"
          description={`Nhập mã OTP đã gửi tới ${maskEmail(user.email)}`}
          onVerify={handleChangePwOtp}
          onResend={() => authApi.sendVerifyEmail(user.email)}
          onClose={() => { setModal(null); setChangePwStep('form') }}
        />
      )}
    </div>
  )
}
