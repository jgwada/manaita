import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const requestShopId = searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(requestShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  if (!year || !month) return NextResponse.json({ success: false, error: 'params required' })

  const mm = String(month).padStart(2, '0')
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const from = `${year}-${mm}-01`
  const to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

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
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth
    const { date, memo } = body
    if (!date) return NextResponse.json({ success: false, error: 'params required' })

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
