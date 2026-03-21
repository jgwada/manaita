'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setShopProfile } = useAppStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/me')
      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json()
      if (data.success && data.user) {
        const role = data.user.role

        setUser({
          id: data.user.id,
          email: data.user.email,
          role,
          shopId: data.user.shop_id,
          isActive: data.user.is_active,
          createdAt: data.user.created_at,
        })

        if (role === 'admin') {
          // admin: sessionStorageに選択中の店舗があればそれを使う
          const saved = sessionStorage.getItem('admin_viewing_shop')
          if (saved) {
            try {
              setShopProfile(JSON.parse(saved))
            } catch {
              sessionStorage.removeItem('admin_viewing_shop')
            }
          } else {
            // 選択中の店舗がなければshopProfileをクリア（管理者モード）
            setShopProfile(null)
          }
        } else if (data.shop) {
          // 一般ユーザー: 自分の店舗をセット
          setShopProfile({
            id: data.shop.id,
            name: data.shop.name,
            area: data.shop.area,
            industry: data.shop.industry,
            priceRange: data.shop.price_range,
            seats: data.shop.seats,
            googleReviewUrl: data.shop.google_review_url,
            placeId: data.shop.place_id,
            lineOfficialUrl: data.shop.line_official_url,
            tabelogUrl: data.shop.tabelog_url,
            researchCache: data.shop.research_cache,
            createdAt: data.shop.created_at,
          })
        }
      }

      setChecked(true)
    }

    init()
  }, [router, setUser, setShopProfile])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F8]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
