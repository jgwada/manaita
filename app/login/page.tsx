'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Yuji_Syuku } from 'next/font/google'

const yujiSyuku = Yuji_Syuku({
  subsets: ['latin'],
  weight: ['400'],
})

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('ログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F3F8] p-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="flex flex-col items-center select-none mb-1">
            <span
              className="text-[#8a5a3a] italic"
              style={{ fontFamily: 'var(--font-caveat)', fontSize: 16 }}
            >for everyone behind the counter</span>
            <span className="flex items-baseline justify-center gap-3 -mt-1">
              <span
                className="font-bold text-[#2a2520]"
                style={{ fontFamily: 'var(--font-caveat)', fontSize: 52, transform: 'rotate(-3deg)', display: 'inline-block' }}
              >I</span>
              <span
                className="text-[#FF5500]"
                style={{ fontFamily: 'var(--font-kaushan)', fontSize: 52, transform: 'rotate(-2deg)', display: 'inline-block' }}
              >love</span>
              <span
                className={`text-[#2a2520] ml-1 ${yujiSyuku.className}`}
                style={{ fontSize: 44 }}
              >飲食店</span>
            </span>
            <span className="flex items-center gap-3 mt-1">
              <svg width="100" height="8" viewBox="0 0 140 10">
                <path d="M2 5 C 20 1, 40 9, 70 5 S 120 1, 138 5" stroke="#2a2520" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
              <svg width="18" height="16" viewBox="0 0 26 24">
                <path d="M13 22 C 4 15, 1 10, 1 6 C 1 3, 3 1, 6 1 C 9 1, 11 3, 13 6 C 15 3, 17 1, 20 1 C 23 1, 25 3, 25 6 C 25 10, 22 15, 13 22 Z" fill="#FF5500"/>
              </svg>
              <svg width="100" height="8" viewBox="0 0 140 10">
                <path d="M2 5 C 20 9, 40 1, 70 5 S 120 9, 138 5" stroke="#2a2520" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          <p className="text-[#8a5a3a] text-sm mt-2" style={{ fontFamily: 'var(--font-kiwi-maru)', letterSpacing: '0.25em' }}>飲食店で働く人を応援する</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E9F2] p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#E5E9F2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-[#F8F9FC] placeholder-[#9CA3AF]"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#E5E9F2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-[#F8F9FC] placeholder-[#9CA3AF]"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
