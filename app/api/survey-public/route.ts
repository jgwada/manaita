import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ success: false, error: 'トークンが必要です' })
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id, name')
      .eq('public_token', token)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ success: false, error: '店舗が見つかりません' })
    }

    const { data: settings } = await supabaseAdmin
      .from('survey_settings')
      .select('id, category, label')
      .eq('shop_id', shop.id)
      .order('category')
      .order('sort_order')

    return NextResponse.json({
      success: true,
      data: {
        shopName: shop.name,
        settings: settings || [],
      }
    })
  } catch (error) {
    console.error('survey-public GET error:', error)
    return NextResponse.json({ success: false, error: 'データの取得に失敗しました。' })
  }
}
