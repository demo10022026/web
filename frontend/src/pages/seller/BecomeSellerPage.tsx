import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  FileText,
  Loader2,
  Store,
  Upload,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { sellerOnboardingApi } from '@/api/sellerOnboardingApi'
import { useSellerStore } from '@/store/sellerStore'
import type { SellerDocument } from '@/types/seller.types'

type Step = 1 | 2

type DocType =
    | 'citizen_id'
    | 'citizen_id_back'
    | 'business_license'
    | 'tax_document'

const applySchema = z.object({
  identityNumber: z
      .string()
      .min(9, 'Tối thiểu 9 ký tự')
      .max(20, 'Tối đa 20 ký tự')
      .regex(/^\d+$/, 'Chỉ được nhập số'),
  taxCode: z.string().max(50, 'Tối đa 50 ký tự').optional(),
})

type ApplyForm = z.infer<typeof applySchema>

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

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

function StepBar({ current }: { current: Step }) {
  const steps = [
    { icon: FileText, label: 'Thông tin' },
    { icon: Upload, label: 'Giấy tờ' },
  ]

  return (
      <div className="mb-8 flex items-center justify-center">
        {steps.map(({ icon: Icon, label }, index) => {
          const stepNumber = (index + 1) as Step
          const done = current > stepNumber
          const active = current === stepNumber

          return (
              <div key={label} className="flex items-center">
                <div className="flex w-24 flex-col items-center gap-1">
                  <div
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        done
                            ? 'bg-green-500 text-white'
                            : active
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-400',
                      ].join(' ')}
                  >
                    {done ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <Icon className="h-4 w-4" />
                    )}
                  </div>

                  <span
                      className={[
                        'text-xs',
                        active ? 'text-orange-500' : 'text-gray-400',
                      ].join(' ')}
                  >
                {label}
              </span>
                </div>

                {index < steps.length - 1 && (
                    <div
                        className={[
                          'mb-4 h-0.5 w-10',
                          done ? 'bg-green-400' : 'bg-gray-200',
                        ].join(' ')}
                    />
                )}
              </div>
          )
        })}
      </div>
  )
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return 'File tối đa 5MB'
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Chỉ hỗ trợ JPG, PNG, WEBP hoặc PDF'
  }

  return null
}

function getUploadedDocTypes(documents?: SellerDocument[]) {
  return new Set<DocType>(
      (documents ?? [])
          .map((doc) => doc.documentType)
          .filter((type): type is DocType =>
              ['citizen_id', 'citizen_id_back', 'business_license', 'tax_document'].includes(
                  type
              )
          )
  )
}

export default function BecomeSellerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { setStatus, setSellerId, setRejection, reset } = useSellerStore()

  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingType, setUploadingType] = useState<DocType | null>(null)
  const [uploaded, setUploaded] = useState<Set<DocType>>(new Set())

  const { data: profile, isLoading } = useQuery({
    queryKey: ['sellerMyProfile'],
    queryFn: sellerOnboardingApi.getMyProfile,
    retry: false,
    staleTime: 0,
  })

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

  const canProceed = useMemo(() => {
    return uploaded.has('citizen_id') && uploaded.has('citizen_id_back')
  }, [uploaded])

  const missingMsg = useMemo(() => {
    if (!uploaded.has('citizen_id')) {
      return 'Vui lòng upload mặt trước CCCD'
    }

    if (!uploaded.has('citizen_id_back')) {
      return 'Vui lòng upload mặt sau CCCD'
    }

    return ''
  }, [uploaded])

  useEffect(() => {
    if (profile === undefined) return

    if (profile === null) {
      reset()
      setStep(1)
      setUploaded(new Set())
      return
    }

    const status = profile.verificationStatus
    const uploadedDocTypes = getUploadedDocTypes(profile.documents)

    setStatus(status)
    setSellerId(profile.sellerId)
    setRejection(profile.rejectionReason ?? null)
    setUploaded(uploadedDocTypes)

    resetForm({
      identityNumber: profile.identityNumber ?? '',
      taxCode: profile.taxCode ?? '',
    })

    if (status === 'approved') {
      navigate('/seller/shop/setup', { replace: true })
      return
    }

    if (status === 'suspended') {
      navigate('/seller/status', { replace: true })
      return
    }

    if (status === 'pending') {
      const hasRequiredDocs =
          uploadedDocTypes.has('citizen_id') &&
          uploadedDocTypes.has('citizen_id_back')

      if (hasRequiredDocs) {
        navigate('/seller/status', { replace: true })
        return
      }

      setStep(2)
      return
    }

    if (status === 'rejected') {
      setStep(1)
    }
  }, [
    profile,
    navigate,
    reset,
    resetForm,
    setStatus,
    setSellerId,
    setRejection,
  ])

  const onApply = async (data: ApplyForm) => {
    setSubmitting(true)

    try {
      const result = await sellerOnboardingApi.apply(
          data.identityNumber,
          data.taxCode
      )

      setStatus('pending')
      setSellerId(result.sellerId)
      setRejection(null)
      setStep(2)

      await queryClient.invalidateQueries({
        queryKey: ['sellerMyProfile'],
      })

      toast.success('Đã gửi thông tin đăng ký. Tiếp tục upload giấy tờ.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadDocument = async (type: DocType, file: File) => {
    const fileError = validateFile(file)

    if (fileError) {
      toast.error(fileError)
      return
    }

    setUploadingType(type)

    try {
      await sellerOnboardingApi.uploadDocument(type, file)

      setUploaded((prev) => new Set([...prev, type]))

      await queryClient.invalidateQueries({
        queryKey: ['sellerMyProfile'],
      })

      toast.success('Upload giấy tờ thành công')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload giấy tờ thất bại')
    } finally {
      setUploadingType(null)
    }
  }

  const handleGoToStatus = () => {
    if (!canProceed) {
      toast.error(missingMsg || 'Vui lòng upload đủ giấy tờ bắt buộc')
      return
    }

    navigate('/seller/status', { replace: true })
  }

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <Store className="mx-auto h-10 w-10 text-orange-500" />
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Đăng ký bán hàng
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Hoàn tất thông tin và giấy tờ để gửi hồ sơ xét duyệt seller.
            </p>
          </div>

          <StepBar current={step} />

          {profile?.verificationStatus === 'rejected' &&
              profile.rejectionReason && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">Hồ sơ trước đó bị từ chối</p>
                    <p className="mt-1">{profile.rejectionReason}</p>
                  </div>
              )}

          {step === 1 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit(onApply)} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      CCCD / CMND
                    </label>
                    <input
                        {...register('identityNumber')}
                        placeholder="Nhập số CCCD / CMND"
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    {errors.identityNumber && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.identityNumber.message}
                        </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Mã số thuế
                    </label>
                    <input
                        {...register('taxCode')}
                        placeholder="Không bắt buộc"
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    {errors.taxCode && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.taxCode.message}
                        </p>
                    )}
                  </div>

                  <button
                      type="submit"
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? 'Đang gửi...' : 'Tiếp tục'}
                  </button>
                </form>
              </div>
          )}

          {step === 2 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload giấy tờ
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    CCCD / CMND mặt trước và mặt sau là bắt buộc.
                  </p>
                </div>

                <div className="space-y-4">
                  {DOCS.map((doc) => {
                    const isUploaded = uploaded.has(doc.type)
                    const isUploading = uploadingType === doc.type

                    return (
                        <div
                            key={doc.type}
                            className="rounded-xl border border-gray-200 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {doc.label}
                                </p>

                                {doc.required && (
                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              Bắt buộc
                            </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-gray-500">
                                {doc.hint}
                              </p>
                            </div>

                            {isUploaded ? (
                                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 shrink-0 text-gray-300" />
                            )}
                          </div>

                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600">
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}

                            <span>
                        {isUploading
                            ? 'Đang upload...'
                            : isUploaded
                                ? 'Upload lại'
                                : 'Chọn file'}
                      </span>

                            <input
                                type="file"
                                accept="image/*,.pdf"
                                disabled={isUploading || uploadingType !== null}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]

                                  if (file) {
                                    handleUploadDocument(doc.type, file)
                                  }

                                  e.currentTarget.value = ''
                                }}
                                className="hidden"
                            />
                          </label>

                          {isUploaded && (
                              <p className="mt-2 text-xs text-green-600">
                                Đã upload
                              </p>
                          )}
                        </div>
                    )
                  })}
                </div>

                <button
                    type="button"
                    disabled={!canProceed || uploadingType !== null}
                    onClick={handleGoToStatus}
                    className="mt-5 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {canProceed ? 'Xem trạng thái hồ sơ' : missingMsg}
                </button>
              </div>
          )}
        </div>
      </div>
  )
}