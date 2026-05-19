import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
    itemCount: number
    setItemCount: (n: number) => void
    increment: (n?: number) => void
    decrement: (n?: number) => void
    clear: () => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            itemCount: 0,

            setItemCount: (n) => set({ itemCount: Math.max(0, n) }),

            increment: (n = 1) =>
                set((s) => ({
                    itemCount: s.itemCount + n,
                })),

            decrement: (n = 1) =>
                set((s) => ({
                    itemCount: Math.max(0, s.itemCount - n),
                })),

            clear: () => set({ itemCount: 0 }),
        }),
        {
            name: 'cart-storage',
        }
    )
)