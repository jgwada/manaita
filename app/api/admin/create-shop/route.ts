import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { name, area, industry, priceRange, seats, googleReviewUrl, placeId } = await req.json()

    const { data, error } = await supabaseAdmin.from('shops').insert({
      name,
      area,
      industry,
      price_range: priceRange || null,
      seats: seats ? parseInt(seats) : null,
      google_review_url: googleReviewUrl || null,
      place_id: placeId || null,
    }).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('create-shop error:', error)
    return NextResponse.json({ success: false, error: '店舗の登録に失敗しました。' })
  }
}
