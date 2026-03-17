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
        setUser({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          shopId: data.user.shop_id,
          isActive: data.user.is_active,
          createdAt: data.user.created_at,
        })

        if (data.shop) {
          setShopProfile({
            id: data.shop.id,
            name: data.shop.name,
            area: data.shop.area,
            industry: data.shop.industry,
            priceRange: data.shop.price_range,
            seats: data.shop.seats,
            googleReviewUrl: data.shop.google_review_url,
            lineOfficialUrl: data.shop.line_official_url,
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
