import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params

    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('id, name, area, industry, price_range, seats, google_review_url, place_id, line_official_url, research_cache, created_at')
      .eq('id', shopId)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: '店舗が見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, shop: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
