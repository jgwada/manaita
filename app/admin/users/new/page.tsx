'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import { ArrowLeft } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()
  const [shops, setShops] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ email: '', password: '', role: 'shop', shopId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    supabase.from('shops').select('id, name').then(({ data }) => {
      if (data) setShops(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSuccess('ユーザーを発行しました！')
      setForm({ email: '', password: '', role: 'shop', shopId: '' })
    } catch (err) {
      setError('ユーザーの発行に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-[#9A8880] text-sm mb-6 hover:text-[#111008]">
            <ArrowLeft size={16} /> 戻る
          </button>

          <h1 className="text-2xl font-bold text-[#111008] mb-6">ユーザーを発行</h1>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#EDE5DF] rounded-xl p-6">
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-1">メールアドレス <span className="text-[#E8320A]">*</span></label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                placeholder="shop@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111008] mb-1">初期パスワード <span className="text-[#E8320A]">*</span></label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                placeholder="初回ログイン用パスワード" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111008] mb-1">ロール</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]">
                <option value="shop">shop（店舗）</option>
                <option value="admin">admin（管理者）</option>
              </select>
            </div>

            {form.role === 'shop' && (
              <div>
                <label className="block text-sm font-medium text-[#111008] mb-1">紐づける店舗 <span className="text-[#E8320A]">*</span></label>
                <select value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })} required={form.role === 'shop'}
                  className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]">
                  <option value="">店舗を選択してください</option>
                  {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {error && <p className="text-sm text-[#E8320A] bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-[#16A34A] bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-[#E8320A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#c92b09] transition-colors disabled:opacity-50">
              {loading ? '発行中...' : 'ユーザーを発行する'}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
