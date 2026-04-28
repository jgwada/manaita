import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// サーバーサイド専用（service_role キー使用・クライアントから import 禁止）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type AuthContext = {
  userId: string
  shopId: string | null
  role: 'admin' | 'shop'
}

/**
 * Cookieからログインユーザーの認証情報を取得する
 * - shop ロール: 自分の shopId のみ返す
 * - admin ロール: 引数 requestShopId を優先し、なければ自分の shopId
 * - 未認証・ユーザー不在: null を返す
 */
export async function getAuthContext(requestShopId?: string): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('shop_id, role')
      .eq('id', authUser.id)
      .single()
    if (!userData) return null

    const role = userData.role as 'admin' | 'shop'
    // admin は requestShopId（クエリ/ボディから渡された値）を使える
    // shop は自分の shop_id のみ
    const shopId = role === 'admin'
      ? (requestShopId ?? userData.shop_id)
      : userData.shop_id

    // adminはshopId無しでもOK（全ショップ横断アクセス可能）
    if (!shopId && role !== 'admin') return null
    return { userId: authUser.id, shopId: shopId ?? null, role }
  } catch {
    return null
  }
}
