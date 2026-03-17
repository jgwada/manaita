import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get('shopId')
    if (!shopId) return NextResponse.json({ success: false, error: '店舗IDが必要です' })

    const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single()
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('store GET error:', error)
    return NextResponse.json({ success: false, error: '店舗情報の取得に失敗しました。' })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, name, area, industry, priceRange, seats, googleReviewUrl, lineOfficialUrl } = body

    const { error } = await supabase.from('shops').update({
      name,
      area,
      industry,
      price_range: priceRange,
      seats,
      google_review_url: googleReviewUrl,
      line_official_url: lineOfficialUrl,
    }).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('store POST error:', error)
    return NextResponse.json({ success: false, error: '店舗情報の保存に失敗しました。' })
  }
}
