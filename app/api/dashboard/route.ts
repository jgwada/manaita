import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
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

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('shop_id')
      .eq('id', authUser.id)
      .single()

    if (!userData?.shop_id) {
      return NextResponse.json({ success: false, error: '店舗が設定されていません' })
    }

    // 店舗情報（public_token含む）
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id, name, public_token, google_review_url')
      .eq('id', userData.shop_id)
      .single()

    // アンケート一覧（新しい順）
    const { data: surveys } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('shop_id', userData.shop_id)
      .order('created_at', { ascending: false })

    const list = surveys || []
    const avgRating = list.length > 0
      ? list.reduce((sum, s) => sum + s.rating, 0) / list.length
      : null

    return NextResponse.json({
      success: true,
      data: {
        shop,
        surveys: list,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        totalCount: list.length,
        googleRedirectCount: list.filter(s => s.redirected_to_google).length,
      }
    })
  } catch (error) {
    console.error('dashboard GET error:', error)
    return NextResponse.json({ success: false, error: 'データの取得に失敗しました。' })
  }
}
