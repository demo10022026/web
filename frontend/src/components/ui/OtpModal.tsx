import { useState, useRef, useEffect } from 'react'
import { X, Mail } from 'lucide-react'

interface Props {
  title: string
  description: string
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  onClose: () => void
}

export default function OtpModal({ title, description, onVerify, onResend, onClose }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [error, setError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[0]?.focus()
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...digits]
    next[idx] = val.slice(-1)
    setDigits(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setDigits(paste.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleSubmit = async () => {
    const otp = digits.join('')
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return }
    setError('')
    setLoading(true)
    try {
      await onVerify(otp)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã OTP không đúng')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setCountdown(60)
    await onResend()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-orange-500" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-center text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{description}</p>

        {/* OTP input boxes */}
        <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              value={d}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              className="w-11 h-12 text-center text-xl font-bold border-2 rounded-lg
                         focus:outline-none focus:border-orange-400
                         border-gray-200 text-gray-800"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                     text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mb-3">
          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Không nhận được mã?{' '}
          {countdown > 0 ? (
            <span className="text-gray-400">Gửi lại sau {countdown}s</span>
          ) : (
            <button onClick={handleResend} className="text-orange-500 font-medium hover:underline">
              Gửi lại
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
