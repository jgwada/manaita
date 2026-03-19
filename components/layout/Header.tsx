'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { LogOut, Settings, ChevronLeft, Store } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { user, shopProfile, setShopProfile } = useAppStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleExitShop = () => {
    sessionStorage.removeItem('admin_viewing_shop')
    setShopProfile(null)
    router.push('/admin')
  }

  const isAdminViewingShop = user?.role === 'admin' && shopProfile !== null

  return (
    <header className="bg-white border-b border-[#E5E9F2] px-4 py-3 flex items-center justify-between shadow-sm">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs tracking-wide">M</span>
        </div>
        <span className="text-xl font-bold tracking-wider text-[#111827]">MANAITA</span>
      </button>

      <div className="flex items-center gap-2">
        {isAdminViewingShop ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F1F3F8] rounded-full px-3 py-1.5">
              <Store size={12} />
              <span>{shopProfile.name}</span>
            </div>
            <button
              onClick={handleExitShop}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-1.5 rounded-full transition-all shadow-sm"
            >
              <ChevronLeft size={13} />
              管理画面に戻る
            </button>
          </div>
        ) : (
          shopProfile && (
            <span className="text-sm text-[#6B7280] hidden sm:block bg-[#F1F3F8] rounded-full px-3 py-1">
              {shopProfile.name}
            </span>
          )
        )}

        {user?.role === 'admin' && !isAdminViewingShop && (
          <button
            onClick={() => router.push('/admin')}
            className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F3F8] rounded-full transition-colors"
            title="管理者ページ"
          >
            <Settings size={18} />
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F3F8] rounded-full transition-colors"
          title="ログアウト"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
