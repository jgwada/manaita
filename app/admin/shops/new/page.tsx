'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import { ArrowLeft } from 'lucide-react'

export default function NewShopPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', area: '', industry: '', priceRange: '', seats: '', googleReviewUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/create-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.push('/admin')
    } catch {
      setError('店舗の登録に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: '店名', placeholder: '例：焼鳥 鳥よし', required: true },
    { key: 'area', label: '地域', placeholder: '例：滋賀県草津市', required: true },
    { key: 'industry', label: '業態', placeholder: '例：居酒屋・焼鳥', required: true },
    { key: 'priceRange', label: '客単価', placeholder: '例：2000〜3000円', required: false },
    { key: 'seats', label: '席数', placeholder: '例：30', required: false },
    { key: 'googleReviewUrl', label: 'Google口コミURL', placeholder: 'https://...', required: false },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-[#9A8880] text-sm mb-6 hover:text-[#111008]">
            <ArrowLeft size={16} /> 戻る
          </button>

          <h1 className="text-2xl font-bold text-[#111008] mb-6">店舗を追加</h1>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#EDE5DF] rounded-xl p-6">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[#111008] mb-1">
                  {field.label}{field.required && <span className="text-[#E8320A] ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] focus:border-transparent"
                />
              </div>
            ))}

            {error && <p className="text-sm text-[#E8320A] bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8320A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#c92b09] transition-colors disabled:opacity-50"
            >
              {loading ? '登録中...' : '店舗を登録する'}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
