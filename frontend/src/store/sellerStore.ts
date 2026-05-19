import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SellerStatus } from '@/types/seller.types'

interface SellerState {
  status: SellerStatus
  sellerId: number | null
  rejectionReason: string | null
  shopId: number | null
  shopName: string | null
  shopSlug: string | null
  setStatus:    (status: SellerStatus)         => void
  setSellerId:  (id: number | null)            => void
  setRejection: (reason: string | null)        => void
  setShop:      (id: number, name: string, slug: string) => void
  reset:        () => void
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set) => ({
      status:          'none',
      sellerId:        null,
      rejectionReason: null,
      shopId:          null,
      shopName:        null,
      shopSlug:        null,
      setStatus:    (status)                     => set({ status }),
      setSellerId:  (sellerId)                   => set({ sellerId }),
      setRejection: (rejectionReason)            => set({ rejectionReason }),
      setShop:      (shopId, shopName, shopSlug) => set({ shopId, shopName, shopSlug }),
      reset: () => set({
        status: 'none', sellerId: null, rejectionReason: null,
        shopId: null, shopName: null, shopSlug: null,
      }),
    }),
    { name: 'seller-storage' }
  )
)
