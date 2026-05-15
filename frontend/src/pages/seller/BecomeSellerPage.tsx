import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useForm }             from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'
import { useQuery }            from '@tanstack/react-query'
import {
  Store, FileText, Clock, CheckCircle, Upload,
  X, ChevronRight, Loader2, AlertCircle, ShieldCheck,
} from 'lucide-react'
import toast                        from 'react-hot-toast'
import { sellerOnboardingApi }      from '@/api/sellerOnboardingApi'
import { useSellerStore }           from '@/store/sellerStore'
import type { SellerDocument }      from '@/types/seller.types'

// ─────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3

const applySchema = z.object({
  identityNumber: z
    .string()
    .min(9,  'Tối thiểu 9 ký tự')
    .max(20, 'Tối đa 20 ký tự')
    .regex(/^\d+$/, 'Chỉ được nhập số'),
  taxCode: z.string().max(50).optional(),
})
type ApplyForm = z.infer<typeof applySchema>

const DOCS: {
  type: SellerDocument['documentType']
  label: string
  hint: string
  required: boolean
}[] = [
  {
    type: 'citizen_id',
    label: 'CMND / CCCD',
    hint: 'Chụp 2 mặt rõ nét, nền trắng, không che góc',
    required: true,
  },
  {
    type: 'business_license',
    label: 'Giấy phép kinh doanh',
    hint: 'Không bắt buộc với người bán cá nhân',
    required: false,
  },
  {
    type: 'tax_document',
    label: 'Giấy tờ thuế',
    hint: 'MST cá nhân hoặc giấy tờ thuế doanh nghiệp',
    required: false,
  },
]

// ─────────────────────────────────────────────────────────────────
// StepBar
// ─────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps = [
    { icon: FileText, label: 'Thông tin' },
    { icon: Upload,   label: 'Giấy tờ'  },
    { icon: Clock,    label: 'Chờ duyệt' },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map(({ icon: Icon, label }, i) => {
        const n      = (i + 1) as Step
        const done   = current > n
        const active = current === n

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1 w-24">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center
                            font-bold transition-all duration-200
                            ${done   ? 'bg-green-500 text-white shadow-md shadow-green-100'
                              : active ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                              :          'bg-gray-100 text-gray-400'}`}
              >
                {done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>

            {i < 2 && (
              <div className={`w-10 h-0.5 mb-4 transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// DocUploader — upload từng loại giấy tờ
// ─────────────────────────────────────────────────────────────────
function DocUploader({
  type, label, hint, required, onDone,
}: {
  type: SellerDocument['documentType']
  label: string
  hint: string
  required: boolean
  onDone: (type: SellerDocument['documentType']) => void
}) {
  const [file,    setFile]    = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const pick = (f: File) => {
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview('')
    }
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    try {
      await sellerOnboardingApi.uploadDocument(type, file)
      setDone(true)
      onDone(type)
      toast.success(`Đã tải lên: ${label}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload thất bại, thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-200
        ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:border-orange-200'}`}
    >
      {/* Label row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            {required
              ? <span className="text-red-400 text-xs font-bold">*</span>
              : <span className="text-xs text-gray-400">(tuỳ chọn)</span>}
          </div>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
        {done && <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
      </div>

      {/* Done state */}
      {done ? (
        <div className="flex items-center gap-2 bg-green-100 text-green-700 text-xs
                        font-medium px-3 py-2 rounded-lg">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{file?.name}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Preview ảnh */}
          {preview && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview('') }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white
                           rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* File picker */}
          <label className="block cursor-pointer">
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs
                          transition-colors
                          ${file
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {file ? file.name : 'Chọn ảnh hoặc PDF — tối đa 10MB'}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,.pdf"
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
          </label>

          {/* Upload button */}
          {file && (
            <button
              type="button"
              onClick={upload}
              disabled={loading}
              className="w-full py-2 bg-orange-500 hover:bg-orange-600
                         disabled:bg-orange-300 text-white text-xs font-semibold
                         rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {loading
                ? <><Loader2 className="h-3 w-3 animate-spin" />Đang tải lên...</>
                : <><Upload className="h-3 w-3" />Tải lên</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function BecomeSellerPage() {
  const navigate = useNavigate()
  const { status, setStatus, setSellerId, setRejection } = useSellerStore()

  const [step,        setStep]        = useState<Step>(1)
  const [submitting,  setSubmitting]  = useState(false)
  const [uploadedSet, setUploadedSet] = useState<Set<SellerDocument['documentType']>>(new Set())

  // ── Fetch hồ sơ hiện tại (nếu có) ──────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ['sellerMyProfile'],
    queryFn:  sellerOnboardingApi.getMyProfile,
    retry:    false,
    staleTime: 0,
  })

  useEffect(() => {
    if (!profile) return

    const s = profile.verificationStatus
    setStatus(s)
    setSellerId(profile.sellerId)
    setRejection(profile.rejectionReason ?? null)

    if (s === 'approved')  navigate('/seller/shop/setup', { replace: true })
    else if (s === 'pending') setStep(3)
    // rejected → bước 1 với alert lý do, suspended → bước 1 với thông báo
  }, [profile])

  // ── Form ────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { identityNumber: profile?.identityNumber ?? '' },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 text-orange-400 animate-spin" />
      </div>
    )
  }

  // ── Submit bước 1 ───────────────────────────────────────────
  const onApply = async (data: ApplyForm) => {
    setSubmitting(true)
    try {
      const result = await sellerOnboardingApi.apply(data.identityNumber, data.taxCode)
      setStatus('pending')
      setSellerId(result.sellerId)
      toast.success('Đơn đăng ký đã gửi!')
      setStep(2)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra, thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Handlers ────────────────────────────────────────────────
  const handleDocDone = (type: SellerDocument['documentType']) =>
    setUploadedSet((prev) => new Set([...prev, type]))

  const canProceedDocs = uploadedSet.has('citizen_id')

  // ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký bán hàng</h1>
          <p className="text-sm text-gray-400 mt-1.5">
            {profile?.verificationStatus === 'rejected'
              ? '⚠️ Hồ sơ bị từ chối — hãy chỉnh sửa và nộp lại'
              : 'Mở shop, tiếp cận hàng triệu khách hàng trên ShopVN'}
          </p>
        </div>

        <StepBar current={step} />

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 1 — Thông tin
        ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {/* Alert lý do bị reject */}
            {profile?.verificationStatus === 'rejected' && profile.rejectionReason && (
              <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5 mb-5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700 mb-0.5">Lý do từ chối trước:</p>
                  <p className="text-xs text-red-600 leading-relaxed">{profile.rejectionReason}</p>
                </div>
              </div>
            )}

            <h2 className="font-semibold text-gray-800 mb-5">Thông tin xác minh danh tính</h2>

            <form onSubmit={handleSubmit(onApply)} className="space-y-4">
              {/* CMND / CCCD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số CMND / CCCD / Mã số doanh nghiệp
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  {...register('identityNumber')}
                  inputMode="numeric"
                  placeholder="VD: 001234567890"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             bg-gray-50 focus:bg-white transition-colors
                             focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {errors.identityNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.identityNumber.message}</p>
                )}
              </div>

              {/* MST */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã số thuế
                  <span className="text-xs text-gray-400 ml-1.5">(tuỳ chọn)</span>
                </label>
                <input
                  {...register('taxCode')}
                  placeholder="Điền nếu bạn có mã số thuế"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             bg-gray-50 focus:bg-white transition-colors
                             focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* Bảo mật */}
              <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                Thông tin được mã hoá và chỉ dùng để xác minh danh tính.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                           text-white font-semibold py-3 rounded-xl text-sm transition-colors
                           flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Đang gửi...</>
                  : <>Tiếp tục <ChevronRight className="h-4 w-4" /></>}
              </button>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 2 — Upload giấy tờ
        ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Upload giấy tờ xác minh</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Định dạng: JPG · PNG · PDF &nbsp;·&nbsp; Tối đa 10MB / file
              </p>
            </div>

            {DOCS.map((d) => (
              <DocUploader key={d.type} {...d} onDone={handleDocDone} />
            ))}

            <button
              type="button"
              onClick={() => {
                setStep(3)
                setStatus('pending')
              }}
              disabled={!canProceedDocs}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
                ${canProceedDocs
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {canProceedDocs
                ? 'Hoàn thành đăng ký'
                : 'Vui lòng upload CMND / CCCD trước'}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 3 — Chờ duyệt
        ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center
                            justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-2">Đang chờ xét duyệt</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Hồ sơ đang được admin xem xét trong vòng{' '}
              <strong className="text-gray-700">1–3 ngày làm việc</strong>.<br />
              Kết quả sẽ gửi về email của bạn.
            </p>

            {/* Timeline */}
            <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4 mb-6">
              {[
                { done: true,  label: 'Đơn đăng ký đã ghi nhận' },
                { done: uploadedSet.size > 0 || (profile?.documents?.length ?? 0) > 0,
                               label: `Giấy tờ đã tải lên (${uploadedSet.size || profile?.documents?.length || 0} file)` },
                { done: false, label: 'Admin đang xét duyệt hồ sơ…' },
                { done: false, label: 'Nhận thông báo kết quả qua email' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm
                  ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>
                  {item.done
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <Clock       className="h-4 w-4 shrink-0" />}
                  {item.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full border border-orange-400 text-orange-500 font-semibold
                         py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-sm"
            >
              Về trang chủ
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
