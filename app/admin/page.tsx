'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/layout/AuthGuard'
import { Store, Users, Plus } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAppStore()
  const [shops, setShops] = useState<{ id: string; name: string; area: string; industry: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchShops()
  }, [user, router])

  const fetchShops = async () => {
    const { data } = await supabase.from('shops').select('id, name, area, industry').order('created_at', { ascending: false })
    if (data) setShops(data)
    setLoading(false)
  }

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
                <div key={shop.id} className="bg-white border border-[#EDE5DF] rounded-xl px-4 py-3">
                  <p className="font-medium text-[#111008]">{shop.name}</p>
                  <p className="text-sm text-[#9A8880]">{shop.area} · {shop.industry}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
