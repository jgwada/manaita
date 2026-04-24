'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { LogOut, Settings, ChevronLeft, Store } from 'lucide-react'
import { Yuji_Syuku } from 'next/font/google'
import FeedbackButton from '@/components/ui/FeedbackButton'

const yujiSyuku = Yuji_Syuku({
  subsets: ['latin'],
  weight: ['400'],
})

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
    <>
    <FeedbackButton />
    <header className="bg-white border-b border-[#E5E9F2] px-4 py-3 flex items-center justify-between shadow-sm">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <span className="flex flex-col items-center select-none">
          <span
            className="text-[#8a5a3a] italic"
            style={{ fontFamily: 'var(--font-caveat)', fontSize: 11 }}
          >for everyone behind the counter</span>
          <span className="flex items-baseline gap-2 -mt-1">
            <span
              className="font-bold text-[#2a2520]"
              style={{ fontFamily: 'var(--font-caveat)', fontSize: 38, transform: 'rotate(-3deg)', display: 'inline-block' }}
            >I</span>
            <span
              className="text-[#FF5500]"
              style={{ fontFamily: 'var(--font-kaushan)', fontSize: 38, transform: 'rotate(-2deg)', display: 'inline-block' }}
            >love</span>
            <span
              className={`text-[#2a2520] ml-1.5 ${yujiSyuku.className}`}
              style={{ fontSize: 32 }}
            >飲食店</span>
          </span>
          <span className="flex items-center gap-2 -mt-1">
            <svg width="60" height="6" viewBox="0 0 140 10">
              <path d="M2 5 C 20 1, 40 9, 70 5 S 120 1, 138 5" stroke="#2a2520" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            <svg width="12" height="11" viewBox="0 0 26 24">
              <path d="M13 22 C 4 15, 1 10, 1 6 C 1 3, 3 1, 6 1 C 9 1, 11 3, 13 6 C 15 3, 17 1, 20 1 C 23 1, 25 3, 25 6 C 25 10, 22 15, 13 22 Z" fill="#FF5500"/>
            </svg>
            <svg width="60" height="6" viewBox="0 0 140 10">
              <path d="M2 5 C 20 9, 40 1, 70 5 S 120 9, 138 5" stroke="#2a2520" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </span>
        <span
          className="border-l border-[#e0cdb8] pl-3 text-[#8a5a3a] leading-snug hidden sm:block"
          style={{ fontFamily: 'var(--font-kiwi-maru)', fontSize: 12, letterSpacing: '0.18em' }}
        >
          飲食店で働く人を<br/>応援する
        </span>
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
    </>
  )
}
