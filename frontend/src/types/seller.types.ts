// Trạng thái hồ sơ seller
export type SellerStatus =
  | 'none'       // chưa apply
  | 'pending'    // đang chờ duyệt
  | 'approved'   // đã duyệt → vào ShopSetupPage
  | 'rejected'   // bị từ chối → cho nộp lại
  | 'suspended'  // bị khóa

export interface SellerDocument {
  documentId: number
  documentType: 'citizen_id' | 'business_license' | 'tax_document'
  documentUrl: string
  verificationStatus: 'pending' | 'approved' | 'rejected'
  uploadedAt: string
}

export interface SellerProfile {
  sellerId: number
  fullName: string
  email: string
  identityNumber?: string
  taxCode?: string
  verificationStatus: SellerStatus
  rejectionReason?: string
  verifiedAt?: string
  createdAt: string
  documents: SellerDocument[]
}
