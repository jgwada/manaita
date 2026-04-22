import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const requestShopId = searchParams.get('shopId') ?? undefined
    const auth = await getAuthContext(requestShopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

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
    const auth = await getAuthContext(body.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId: id } = auth
    const { name, area, industry, priceRange, seats, googleReviewUrl, placeId, lineOfficialUrl, tabelogUrl } = body

    const { error } = await supabase.from('shops').update({
      name,
      area,
      industry,
      price_range: priceRange,
      seats,
      google_review_url: googleReviewUrl,
      place_id: placeId || null,
      line_official_url: lineOfficialUrl,
      tabelog_url: tabelogUrl || null,
    }).eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('store POST error:', error)
    return NextResponse.json({ success: false, error: '店舗情報の保存に失敗しました。' })
  }
}
