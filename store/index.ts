import { create } from 'zustand'
import { ShopProfile, User } from '@/types'

interface AppState {
  // 認証
  user: User | null
  setUser: (user: User | null) => void

  // 店舗プロフィール
  shopProfile: ShopProfile | null
  setShopProfile: (profile: ShopProfile | null) => void

  // ローディング
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  shopProfile: null,
  setShopProfile: (profile) => set({ shopProfile: profile }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
