import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  itemCount: number
  setItemCount: (n: number) => void
  increment: () => void
  decrement: () => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (n) => set({ itemCount: n }),
      increment:    ()  => set((s) => ({ itemCount: s.itemCount + 1 })),
      decrement:    ()  => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
      clear:        ()  => set({ itemCount: 0 }),
    }),
    { name: 'cart-storage' }
  )
)
