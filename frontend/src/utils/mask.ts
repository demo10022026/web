/**
 * Che email: "nguyenvana@gmail.com" → "ng****@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}****@${domain}`
}

/**
 * Che số điện thoại: "0912345678" → "09*****78"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone
  const start = phone.slice(0, 2)
  const end = phone.slice(-2)
  const stars = '*'.repeat(phone.length - 4)
  return `${start}${stars}${end}`
}

/**
 * Che tên: "Nguyễn Văn A" → "Ng***** V** A"
 * (hiện 2 ký tự đầu mỗi từ, phần còn lại là *)
 */
export function maskName(name: string): string {
  if (!name) return ''
  return name
    .split(' ')
    .map((word) => {
      if (word.length <= 2) return word
      return word.slice(0, 2) + '*'.repeat(word.length - 2)
    })
    .join(' ')
}

/**
 * Format số tiền VND
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
