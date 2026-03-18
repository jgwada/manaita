import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { resolveShopId } from '@/lib/server-auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = await resolveShopId(searchParams.get('shopId'))

    if (!shopId) {
      return NextResponse.json({ success: false, error: '店舗が設定されていません' })
    }

    // 店舗情報（public_token含む）
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id, name, public_token, google_review_url')
      .eq('id', shopId)
      .single()

    // アンケート一覧（新しい順）
    const { data: surveys } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('shop_id', shopId)
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
