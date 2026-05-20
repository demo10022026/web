import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Camera,
  Store,
  Clock,
  ChevronRight,
  ShoppingBag,
  MapPin,
  Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/store/authStore'
import { useSellerStore } from '@/store/sellerStore'
import { authApi } from '@/api/authApi'
import { sellerShopApi } from '@/api/sellerShopApi'
import OtpModal from '@/components/ui/OtpModal'
import { maskEmail, maskPhone } from '@/utils/mask'

type ModalType = 'verifyEmail' | 'changePassword' | null

const pwSchema = z
    .object({
      currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
      newPassword: z.string().min(8, 'Tối thiểu 8 ký tự'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Mật khẩu không khớp',
      path: ['confirmPassword'],
    })

type PwForm = z.infer<typeof pwSchema>

function SellerCard() {
  const { user } = useAuthStore()

  const {
    status,
    shopId,
    shopName,
    rejectionReason,
    setShop,
  } = useSellerStore()

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  const { data: myShop } = useQuery({
    queryKey: ['sellerMyShop'],
    queryFn: sellerShopApi.getMyShop,
    enabled: !!user && !isAdminOrManager && status === 'approved',
    retry: false,
    staleTime: 0,
  })

  useEffect(() => {
    if (myShop) {
      setShop(myShop.shopId, myShop.shopName, myShop.shopSlug)
    }
  }, [myShop, setShop])

  if (isAdminOrManager) {
    return null
  }

  const currentShopId = myShop?.shopId ?? shopId
  const currentShopName = myShop?.shopName ?? shopName

  const configs = {
    none: {
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      icon: <Store className="h-5 w-5 text-orange-500" />,
      iconBg: 'bg-orange-100',
      title: 'Bán hàng cùng ShopVN',
      desc: 'Mở shop, đăng sản phẩm và tiếp cận hàng triệu khách hàng.',
      action: {
        to: '/become-seller',
        label: 'Đăng ký ngay',
        cls: 'bg-orange-500 hover:bg-orange-600 text-white',
      },
    },

    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      iconBg: 'bg-yellow-100',
      title: 'Đang chờ xét duyệt',
      desc: 'Hồ sơ đang được xem xét trong 1–3 ngày làm việc.',
      action: {
        to: '/seller/status',
        label: 'Xem trạng thái',
        cls: 'border border-yellow-400 text-yellow-700 hover:bg-yellow-50',
      },
    },

    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      iconBg: 'bg-red-100',
      title: 'Hồ sơ chưa được chấp nhận',
      desc: rejectionReason ?? 'Vui lòng xem lý do và nộp lại hồ sơ.',
      action: {
        to: '/become-seller',
        label: 'Nộp lại hồ sơ',
        cls: 'bg-red-500 hover:bg-red-600 text-white',
      },
    },

    approved: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: <Store className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
      title: currentShopId
          ? currentShopName ?? 'Cửa hàng của bạn'
          : 'Tài khoản seller đã được duyệt!',
      desc: currentShopId
          ? 'Cửa hàng đang hoạt động.'
          : 'Hãy tạo shop để bắt đầu bán hàng.',
      action: {
        to: currentShopId ? '/seller/dashboard' : '/seller/shop/setup',
        label: currentShopId
            ? 'Quản lý cửa hàng của bạn'
            : 'Tạo Shop ngay',
        cls: 'bg-green-600 hover:bg-green-700 text-white',
      },
    },

    suspended: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: <XCircle className="h-5 w-5 text-gray-400" />,
      iconBg: 'bg-gray-100',
      title: 'Tài khoản seller bị tạm khóa',
      desc: 'Vui lòng liên hệ hỗ trợ để được giải quyết.',
      action: {
        to: '/seller/status',
        label: 'Xem chi tiết',
        cls: 'border border-gray-300 text-gray-600 hover:bg-gray-100',
      },
    },
  } as const

  const cfg = configs[status]

  return (
      <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              {cfg.icon}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {cfg.title}
              </p>

              <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                {cfg.desc}
              </p>
            </div>
          </div>

          <Link
              to={cfg.action.to}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${cfg.action.cls}`}
          >
            {cfg.action.label}
          </Link>
        </div>

        {status === 'approved' && currentShopId && (
            <div className="mt-3 flex gap-4 border-t border-green-100 pt-3">
              <Link
                  to="/seller/products/new"
                  className="flex items-center gap-1 text-xs text-green-700 hover:underline"
              >
                + Thêm sản phẩm
              </Link>

              <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1 text-xs text-green-700 hover:underline"
              >
                Xem đơn hàng <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
        )}
      </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [modal, setModal] = useState<ModalType>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwData, setPwData] = useState<PwForm | null>(null)
  const [changePwStep, setChangePwStep] = useState<'form' | 'otp'>('form')

  const pwForm = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  if (!user) return null

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

    updateUser({
      emailVerified: true,
    })

    setModal(null)
    toast.success('Xác thực email thành công!')
  }

  const handleChangePwOtp = async (otp: string) => {
    if (!pwData) return

    await authApi.changePassword(
        pwData.currentPassword,
        pwData.newPassword,
        otp
    )

    setModal(null)
    setChangePwStep('form')
    pwForm.reset()

    toast.success('Đổi mật khẩu thành công!')
  }

  const PwField = ({
                     name,
                     label,
                     show,
                     toggle,
                   }: {
    name: keyof PwForm
    label: string
    show: boolean
    toggle: () => void
  }) => (
      <div>
        <label className="mb-1 block text-xs text-gray-500">
          {label}
        </label>

        <div className="relative">
          <input
              {...pwForm.register(name)}
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />

          <button
              type="button"
              onClick={toggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? (
                <EyeOff className="h-3.5 w-3.5" />
            ) : (
                <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {pwForm.formState.errors[name] && (
            <p className="mt-1 text-xs text-red-500">
              {pwForm.formState.errors[name]?.message}
            </p>
        )}
      </div>
  )

  return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800">
          Tài khoản của tôi
        </h1>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                  <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="h-20 w-20 rounded-full border-2 border-orange-200 object-cover"
                  />
              ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                    <User className="h-9 w-9 text-orange-400" />
                  </div>
              )}

              <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 shadow transition-colors hover:bg-orange-600"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-800">
                {user.fullName}
              </p>

              <p className="mt-0.5 text-sm text-gray-400">
                @{user.username}
              </p>

              <span
                  className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === 'admin'
                          ? 'bg-red-100 text-red-600'
                          : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-600'
                              : user.role === 'seller'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-600'
                  }`}
              >
              {user.role === 'admin'
                  ? '👑 Quản trị viên'
                  : user.role === 'manager'
                      ? '🔧 Quản lý'
                      : user.role === 'seller'
                          ? '🏪 Người bán'
                          : '👤 Thành viên'}
            </span>
            </div>
          </div>
        </div>

        <SellerCard />

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800">
            Thông tin tài khoản
          </h2>

          <div className="flex items-center justify-between border-b border-gray-100 py-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-orange-400" />

              <div>
                <p className="mb-0.5 text-xs text-gray-400">
                  Email
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {maskEmail(user.email)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Đã xác thực
              </span>
              ) : (
                  <>
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <XCircle className="h-3.5 w-3.5" />
                  Chưa xác thực
                </span>

                    <button
                        type="button"
                        onClick={async () => {
                          await authApi.sendVerifyEmail(user.email)
                          setModal('verifyEmail')
                        }}
                        className="rounded-lg border border-orange-300 px-2.5 py-1 text-xs text-orange-500 transition-colors hover:bg-orange-50"
                    >
                      Xác thực
                    </button>
                  </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 py-3">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-orange-400" />

              <div>
                <p className="mb-0.5 text-xs text-gray-400">
                  Số điện thoại
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {maskPhone(user.phoneNumber)}
                </p>
              </div>
            </div>

            {user.phoneVerified ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Đã xác thực
            </span>
            ) : (
                <span className="flex items-center gap-1 text-xs text-red-500">
              <XCircle className="h-3.5 w-3.5" />
              Chưa xác thực
            </span>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <Lock className="h-4 w-4 shrink-0 text-orange-400" />

              <p className="text-sm font-semibold text-gray-800">
                Đổi mật khẩu
              </p>
            </div>

            <form
                onSubmit={pwForm.handleSubmit(handlePwSubmit)}
                className="space-y-3 pl-7"
            >
              <PwField
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  show={showCurrent}
                  toggle={() => setShowCurrent((prev) => !prev)}
              />

              <PwField
                  name="newPassword"
                  label="Mật khẩu mới"
                  show={showNew}
                  toggle={() => setShowNew((prev) => !prev)}
              />

              <PwField
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  show={showNew}
                  toggle={() => setShowNew((prev) => !prev)}
              />

              <p className="text-xs text-gray-400">
                * Một mã OTP sẽ được gửi vào email để xác nhận.
              </p>

              <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                Tiếp tục
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {[
            {
              to: '/orders',
              icon: ShoppingBag,
              label: 'Đơn mua của tôi',
              desc: 'Theo dõi trạng thái đơn hàng',
            },
            {
              to: '/addresses',
              icon: MapPin,
              label: 'Địa chỉ của tôi',
              desc: 'Quản lý địa chỉ giao hàng',
            },
            {
              to: '/vouchers',
              icon: Tag,
              label: 'Voucher của tôi',
              desc: 'Mã giảm giá đã lưu',
            },
          ].map((item) => (
              <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5 transition-colors last:border-0 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0 text-orange-400" />

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.label}
                    </p>

                    <p className="text-xs text-gray-400">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
          ))}
        </div>

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
                onClose={() => {
                  setModal(null)
                  setChangePwStep('form')
                }}
            />
        )}
      </div>
  )
}