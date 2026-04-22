import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { data: shop } = await supabaseAdmin
      .from('shops').select('place_id').eq('id', shopId).single()

    if (!shop?.place_id) {
      return NextResponse.json({ success: false, error: 'Place IDが設定されていません' })
    }

    // Google Places API (New)で口コミ取得
    const url = `https://places.googleapis.com/v1/places/${shop.place_id}`
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': 'reviews',
        'Accept-Language': 'ja',
      },
    })
    const json = await res.json()

    if (json.error) {
      return NextResponse.json({ success: false, error: `Google APIエラー: ${json.error.message}` })
    }

    const googleReviews = json.reviews || []
    let added = 0

    for (const gr of googleReviews) {
      const content = gr.text?.text || gr.originalText?.text || '（コメントなし）'
      const reviewerName = gr.authorAttribution?.displayName || null
      const rating = gr.rating || null
      const publishTime = gr.publishTime ? new Date(gr.publishTime).toISOString().split('T')[0] : null

      const { data: existing } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('shop_id', shopId)
        .eq('content', content)
        .limit(1)

      if (existing && existing.length > 0) continue

      await supabaseAdmin.from('reviews').insert({
        shop_id: shopId,
        reviewer_name: reviewerName,
        rating,
        content,
        reviewed_at: publishTime,
        replied: false,
      })
      added++
    }

    return NextResponse.json({ success: true, data: { added, total: googleReviews.length } })
  } catch (error) {
    console.error('reviews sync error:', error)
    return NextResponse.json({ success: false, error: '同期に失敗しました。' })
  }
}
