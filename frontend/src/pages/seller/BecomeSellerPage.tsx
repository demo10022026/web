// noinspection ES6UnusedImports

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Store, FileText, Clock, CheckCircle, Upload,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { sellerOnboardingApi } from '@/api/sellerOnboardingApi'
import { useSellerStore } from '@/store/sellerStore'

// ───────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3
type DocType =
    | 'citizen_id'
    | 'citizen_id_back'
    | 'business_license'
    | 'tax_document'

const applySchema = z.object({
  identityNumber: z.string()
      .min(9, 'Tối thiểu 9 ký tự')
      .max(20, 'Tối đa 20 ký tự')
      .regex(/^\d+$/, 'Chỉ được nhập số'),
  taxCode: z.string().max(50).optional(),
})

type ApplyForm = z.infer<typeof applySchema>

// ───────────────────────────────────────────────────────────────
const DOCS: {
  type: DocType
  label: string
  hint: string
  required: boolean
}[] = [
  {
    type: 'citizen_id',
    label: 'CCCD / CMND — Mặt trước',
    hint: 'Ảnh rõ nét, đủ 4 góc, không bị chói sáng',
    required: true,
  },
  {
    type: 'citizen_id_back',
    label: 'CCCD / CMND — Mặt sau',
    hint: 'Ảnh rõ nét, đủ 4 góc, không bị chói sáng',
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

// ───────────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps = [
    { icon: FileText, label: 'Thông tin' },
    { icon: Upload, label: 'Giấy tờ' },
    { icon: Clock, label: 'Chờ duyệt' },
  ]

  return (
      <div className="flex items-center justify-center mb-8">
        {steps.map(({ icon: Icon, label }, i) => {
          const n = (i + 1) as Step
          const done = current > n
          const active = current === n

          return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1 w-24">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                ${done ? 'bg-green-500 text-white'
                      : active ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-400'}`}
                  >
                    {done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                {label}
              </span>
                </div>

                {i < 2 && (
                    <div className={`w-10 h-0.5 mb-4 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
          )
        })}
      </div>
  )
}

// ───────────────────────────────────────────────────────────────

export default function BecomeSellerPage() {
  const navigate = useNavigate()

  const {
    setStatus,
    setSellerId,
    setRejection,
    reset,
  } = useSellerStore()

  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploaded, setUploaded] = useState<Set<DocType>>(new Set())

  // ───────── FETCH PROFILE ─────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ['sellerMyProfile'],
    queryFn: sellerOnboardingApi.getMyProfile,
    retry: false,
    staleTime: 0,
  })

  // ───────── SYNC PROFILE ─────────
  useEffect(() => {
    if (profile === undefined) return

    if (profile === null) {
      reset()
      setStep(1)
      return
    }

    const s = profile.verificationStatus

    setStatus(s)
    setSellerId(profile.sellerId)
    setRejection(profile.rejectionReason ?? null)

    if (s === 'approved') {
      navigate('/seller/shop/setup', { replace: true })
    } else if (s === 'pending') {
      setStep(3)
    } else if (s === 'rejected') {
      setStep(1)
    }
  }, [profile, reset, navigate, setStatus, setSellerId, setRejection])

  // ───────── FORM ─────────
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      identityNumber: '',
      taxCode: '',
    },
  })

  // sync profile → form
  useEffect(() => {
    if (profile?.identityNumber) {
      resetForm({
        identityNumber: profile.identityNumber,
        taxCode: profile.taxCode ?? '',
      })
    }
  }, [profile, resetForm])

  // ───────── LOADING ─────────
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>
    )
  }

  // ───────── APPLY ─────────
  const onApply = async (data: ApplyForm) => {
    setSubmitting(true)
    try {
      const result = await sellerOnboardingApi.apply(
          data.identityNumber,
          data.taxCode
      )

      setStatus('pending')
      setSellerId(result.sellerId)

      toast.success('Đơn đăng ký đã gửi!')
      setStep(2)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDocDone = (type: DocType) => {
    setUploaded(prev => new Set([...prev, type]))
  }

  const canProceed =
      uploaded.has('citizen_id') &&
      uploaded.has('citizen_id_back')

  const missingMsg =
      !uploaded.has('citizen_id')
          ? 'Vui lòng upload mặt trước CCCD'
          : !uploaded.has('citizen_id_back')
              ? 'Vui lòng upload mặt sau CCCD'
              : ''

  // ───────── UI ─────────
  return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <Store className="h-10 w-10 mx-auto text-orange-500" />
            <h1 className="text-2xl font-bold mt-3">Đăng ký bán hàng</h1>
          </div>

          <StepBar current={step} />

          {/* STEP 1 */}
          {step === 1 && (
              <div className="bg-white p-6 rounded-xl">
                <form onSubmit={handleSubmit(onApply)} className="space-y-4">

                  <input
                      {...register('identityNumber')}
                      placeholder="CCCD / MST"
                      className="w-full border p-2 rounded"
                  />
                  {errors.identityNumber && (
                      <p className="text-red-500 text-xs">
                        {errors.identityNumber.message}
                      </p>
                  )}

                  <input
                      {...register('taxCode')}
                      placeholder="Mã số thuế (optional)"
                      className="w-full border p-2 rounded"
                  />

                  <button
                      disabled={submitting}
                      className="w-full bg-orange-500 text-white py-2 rounded"
                  >
                    {submitting ? 'Đang gửi...' : 'Tiếp tục'}
                  </button>
                </form>
              </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
              <div className="bg-white p-6 rounded-xl space-y-4">

                {DOCS.map(d => (
                    <div key={d.type} className="border p-3 rounded">
                      <p className="font-medium">{d.label}</p>
                      <button
                          onClick={() => handleDocDone(d.type)}
                          className="text-sm text-blue-500"
                      >
                        Mark uploaded (demo)
                      </button>
                    </div>
                ))}

                <button
                    disabled={!canProceed}
                    onClick={() => setStep(3)}
                    className="w-full bg-orange-500 text-white py-2 rounded disabled:bg-gray-300"
                >
                  {canProceed ? 'Hoàn thành' : missingMsg}
                </button>
              </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
              <div className="bg-white p-6 text-center rounded-xl">
                <Clock className="mx-auto text-yellow-500" />
                <p className="mt-3 font-medium">Đang chờ duyệt</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-orange-500"
                >
                  Về trang chủ
                </button>
              </div>
          )}
        </div>
      </div>
  )
}