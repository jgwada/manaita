'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function SetupPage() {
  const router = useRouter()
  const { shopProfile, setShopProfile } = useAppStore()

  const [form, setForm] = useState({
    name: '',
    area: '',
    industry: '',
    priceRange: '',
    seats: '',
    googleReviewUrl: '',
    placeId: '',
    tabelogUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [placeIdOpen, setPlaceIdOpen] = useState(false)

  useEffect(() => {
    if (shopProfile) {
      setForm({
        name: shopProfile.name,
        area: shopProfile.area,
        industry: shopProfile.industry,
        priceRange: shopProfile.priceRange,
        seats: String(shopProfile.seats || ''),
        googleReviewUrl: shopProfile.googleReviewUrl || '',
        placeId: shopProfile.placeId || '',
        tabelogUrl: shopProfile.tabelogUrl || '',
      })
    }
  }, [shopProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shopProfile?.id,
          name: form.name,
          area: form.area,
          industry: form.industry,
          priceRange: form.priceRange,
          seats: form.seats ? parseInt(form.seats) : null,
          googleReviewUrl: form.googleReviewUrl,
          placeId: form.placeId,
          tabelogUrl: form.tabelogUrl,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setShopProfile({
        ...shopProfile!,
        name: form.name,
        area: form.area,
        industry: form.industry,
        priceRange: form.priceRange,
        seats: form.seats ? parseInt(form.seats) : 0,
        googleReviewUrl: form.googleReviewUrl,
      })

      router.push('/')
    } catch {
      setError('保存に失敗しました。もう一度お試しください。')
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
    { key: 'placeId', label: 'Google Place ID', placeholder: 'ChIJ...（口コミ取得に必要）', required: false },
    { key: 'tabelogUrl', label: '食べログURL', placeholder: 'https://tabelog.com/...', required: false },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-1">店舗プロフィール設定</h1>
          <p className="text-sm text-[#6B7280] mb-3">入力した情報をもとにAIが最適な文章を生成します</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-amber-700">店舗のネット上の情報をAIが自動リサーチし、より精度の高い回答を提供しています。リサーチ情報を更新したい場合は、運営者までお問い合わせください。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#E5E9F2] rounded-xl p-6">
            {fields.map((field) => (
              <div key={field.key}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-[#111827]">
                    {field.label}
                    {field.required && <span className="text-[#E8320A] ml-1">*</span>}
                  </label>
                  {field.key === 'placeId' && (
                    <button
                      type="button"
                      onClick={() => setPlaceIdOpen(v => !v)}
                      className="text-[10px] text-[#E8320A] underline hover:opacity-70"
                    >
                      GoogleプレイスIDとは？
                    </button>
                  )}
                </div>
                {field.key === 'placeId' && placeIdOpen && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-2 text-xs text-blue-800 leading-relaxed space-y-2">
                    <p className="font-bold">Google Place IDとは</p>
                    <p>Googleマップ上の各店舗に割り当てられた固有のIDです。口コミの自動取得に使用します。</p>
                    <p className="font-bold mt-1">確認方法</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Googleマップで店舗を検索して開く</li>
                      <li>ブラウザのURLを確認する</li>
                      <li>URL内の <span className="font-mono bg-blue-100 px-1 rounded">1s0x...</span> または <span className="font-mono bg-blue-100 px-1 rounded">ChIJ...</span> から始まる文字列がPlace ID</li>
                    </ol>
                    <p className="text-blue-600">※わからない場合は運営者にお問い合わせください</p>
                  </div>
                )}
                <input
                  type="text"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] focus:border-transparent"
                />
              </div>
            ))}

            {error && <ErrorMessage message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8320A] text-white rounded-lg py-3 text-sm font-medium hover:bg-[#c92b09] transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存して始める'}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
