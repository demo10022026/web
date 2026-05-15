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

  // actions
  setStatus:    (status: SellerStatus)  => void
  setSellerId:  (id: number)            => void
  setRejection: (reason: string | null) => void
  setShop:      (id: number, name: string, slug: string) => void
  reset:        () => void
}

const INITIAL: Omit<SellerState, keyof Pick<SellerState,
  'setStatus' | 'setSellerId' | 'setRejection' | 'setShop' | 'reset'>> = {
  status:          'none',
  sellerId:        null,
  rejectionReason: null,
  shopId:          null,
  shopName:        null,
  shopSlug:        null,
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setStatus:    (status)        => set({ status }),
      setSellerId:  (sellerId)      => set({ sellerId }),
      setRejection: (rejectionReason) => set({ rejectionReason }),
      setShop:      (shopId, shopName, shopSlug) => set({ shopId, shopName, shopSlug }),
      reset:        ()              => set({ ...INITIAL }),
    }),
    {
      name: 'seller-storage',
      // Chỉ persist dữ liệu tối thiểu
      partialize: (s) => ({
        status:          s.status,
        sellerId:        s.sellerId,
        rejectionReason: s.rejectionReason,
        shopId:          s.shopId,
        shopName:        s.shopName,
        shopSlug:        s.shopSlug,
      }),
    }
  )
)
