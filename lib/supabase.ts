import { createBrowserClient } from '@supabase/ssr'

// クライアントサイド用（SSRと互換性あり・cookieでセッション管理）
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
