import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  if (!shopId || !year || !month) return NextResponse.json({ success: false, error: 'params required' })

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabaseAdmin
    .from('calendar_memos')
    .select('*')
    .eq('shop_id', shopId)
    .gte('date', from)
    .lte('date', to)

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  try {
    const { shopId, date, memo } = await req.json()
    if (!shopId || !date) return NextResponse.json({ success: false, error: 'params required' })

    const { data, error } = await supabaseAdmin
      .from('calendar_memos')
      .upsert({ shop_id: shopId, date, memo, updated_at: new Date().toISOString() }, { onConflict: 'shop_id,date' })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
