'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { LogOut, Settings } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { user, shopProfile } = useAppStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-[#111008] text-white px-4 py-3 flex items-center justify-between">
      <button
        onClick={() => router.push('/')}
        className="text-xl font-bold tracking-wider"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        MANAITA
      </button>

      <div className="flex items-center gap-3">
        {shopProfile && (
          <span className="text-sm text-gray-300 hidden sm:block">
            {shopProfile.name}
          </span>
        )}

        {user?.role === 'admin' && (
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
