export type SellerStatus =
    | 'none'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'

export interface SellerDocument {
  documentId: number
  documentType:
      | 'citizen_id'
      | 'citizen_id_back'
      | 'business_license'
      | 'tax_document'
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

  shopId?: number
  shopName?: string
  shopSlug?: string
}