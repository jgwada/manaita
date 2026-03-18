'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { LogOut, Settings, ChevronLeft } from 'lucide-react'

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

  // 管理者が店舗に入っている状態
  const isAdminViewingShop = user?.role === 'admin' && shopProfile !== null

  return (
    <header className="bg-[#111008] text-white px-4 py-3 flex items-center justify-between">
      <button
        onClick={() => router.push('/')}
        className="text-xl font-bold tracking-wider transition-transform hover:scale-125 origin-left"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        MANAITA
      </button>

      <div className="flex items-center gap-3">
        {isAdminViewingShop ? (
          <button
            onClick={handleExitShop}
            className="flex items-center gap-1.5 text-xs bg-[#E8320A] hover:bg-[#c4280a] text-white px-3 py-1.5 rounded-full transition-colors"
          >
            <ChevronLeft size={13} />
            管理画面に戻る
          </button>
        ) : (
          shopProfile && (
            <span className="text-sm text-gray-300 hidden sm:block">
              {shopProfile.name}
            </span>
          )
        )}

        {user?.role === 'admin' && !isAdminViewingShop && (
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-300 hover:text-white transition-colors"
            title="管理者ページ"
          >
            <Settings size={18} />
          </button>
        )}

        <button
          onClick={handleLogout}
          className="text-gray-300 hover:text-white transition-colors"
          title="ログアウト"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
