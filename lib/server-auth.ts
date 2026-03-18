import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 認証済みユーザーのshop_idを解決する。
 * 管理者がoverrideShopIdを渡した場合はそちらを使用する（他の店舗に入っている状態）。
 */
export async function resolveShopId(overrideShopId?: string | null): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabaseAdmin
    .from('users')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (data?.role === 'admin' && overrideShopId) return overrideShopId
  return data?.shop_id ?? null
}
