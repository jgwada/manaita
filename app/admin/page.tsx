'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/layout/AuthGuard'
import { Store, Users, Plus, RefreshCw, CheckCircle } from 'lucide-react'

type Shop = { id: string; name: string; area: string; industry: string; research_cache: string | null; research_updated_at: string | null }

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAppStore()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [researchingId, setResearchingId] = useState<string | null>(null)
  const [researchedId, setResearchedId] = useState<string | null>(null)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  const [retryShopId, setRetryShopId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchShops()
  }, [user, router])

  const fetchShops = async () => {
    const res = await fetch('/api/admin/shops')
    const json = await res.json()
    if (json.success) setShops(json.data)
    setLoading(false)
  }

  const doResearch = async (shopId: string, retryCount = 0) => {
    setResearchingId(shopId)
    setResearchedId(null)
    setResearchError(null)
    setRetryCountdown(null)
    setRetryShopId(null)
    try {
      const res = await fetch('/api/admin/research-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      })
      const json = await res.json()
      if (json.success) {
        setResearchedId(shopId)
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, research_cache: json.research, research_updated_at: json.research_updated_at } : s))
      } else if (json.error === 'RATE_LIMIT' && retryCount < 2) {
        setRetryShopId(shopId)
        let count = 60
        setRetryCountdown(count)
        const timer = setInterval(() => {
          count--
          if (count <= 0) {
            clearInterval(timer)
            setRetryCountdown(null)
            doResearch(shopId, retryCount + 1)
          } else {
            setRetryCountdown(count)
          }
        }, 1000)
      } else if (json.error === 'RATE_LIMIT') {
        setResearchError('レート制限が続いています。しばらく時間をおいてから再試行してください。')
      } else {
        setResearchError(json.error || 'リサーチに失敗しました')
      }
    } catch {
      setResearchError('タイムアウトまたはネットワークエラーが発生しました')
    } finally {
      setResearchingId(null)
    }
  }

  const handleReResearch = (shopId: string) => doResearch(shopId)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#111008] mb-6">管理者ダッシュボード</h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => router.push('/admin/shops/new')}
              className="bg-white border border-[#EDE5DF] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#E8320A] transition-colors"
            >
              <div className="w-10 h-10 bg-[#FFF9F5] rounded-full flex items-center justify-center">
                <Plus size={20} className="text-[#E8320A]" />
              </div>
              <span className="text-sm font-medium text-[#111008]">店舗を追加</span>
            </button>

            <button
              onClick={() => router.push('/admin/users/new')}
              className="bg-white border border-[#EDE5DF] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#E8320A] transition-colors"
            >
              <div className="w-10 h-10 bg-[#FFF9F5] rounded-full flex items-center justify-center">
                <Users size={20} className="text-[#E8320A]" />
              </div>
              <span className="text-sm font-medium text-[#111008]">ユーザーを発行</span>
            </button>
          </div>

          {researchError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠️ {researchError}
            </div>
          )}
          {retryCountdown !== null && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ⏳ APIのレート制限に達しました。{retryCountdown}秒後に自動で再試行します...
            </div>
          )}

          <h2 className="text-lg font-bold text-[#111008] mb-3 flex items-center gap-2">
            <Store size={18} />
            登録店舗一覧
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : shops.length === 0 ? (
            <p className="text-[#9A8880] text-sm text-center py-8">まだ店舗が登録されていません</p>
          ) : (
            <div className="space-y-2">
              {shops.map((shop) => (
                <div key={shop.id} className="bg-white border border-[#EDE5DF] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#111008]">{shop.name}</p>
                    <p className="text-sm text-[#9A8880]">{shop.area} · {shop.industry}</p>
                    <p className="text-xs mt-0.5">
                      {shop.research_cache
                        ? <span className="text-green-600">リサーチ済み{shop.research_updated_at ? `（${new Date(shop.research_updated_at).toLocaleDateString('ja-JP')}）` : ''}</span>
                        : <span className="text-[#9A8880]">未リサーチ</span>
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => handleReResearch(shop.id)}
                    disabled={researchingId === shop.id}
                    className="flex items-center gap-1.5 text-xs border border-[#EDE5DF] rounded-lg px-3 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {researchingId === shop.id ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        リサーチ中...
                      </>
                    ) : researchedId === shop.id ? (
                      <>
                        <CheckCircle size={12} className="text-green-600" />
                        完了
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        再リサーチ
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
