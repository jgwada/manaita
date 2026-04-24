import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ShopProfile, User } from '@/types'

interface AppState {
  // 認証
  user: User | null
  setUser: (user: User | null) => void

  // 店舗プロフィール（sessionStorageに永続化）
  shopProfile: ShopProfile | null
  setShopProfile: (profile: ShopProfile | null) => void

  // ローディング
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      shopProfile: null,
      setShopProfile: (profile) => set({ shopProfile: profile }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'i-love-restaurant-shop-profile',
      storage: createJSONStorage(() => sessionStorage),
      // shopProfileのみ永続化（userはセキュリティ上保存しない）
      partialize: (state) => ({ shopProfile: state.shopProfile }),
    }
  )
)
