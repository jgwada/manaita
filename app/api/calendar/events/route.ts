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

  // end_dateを持つ複数日イベントも含む: イベントが月と重複していれば取得
  // date <= to AND (end_date >= from OR (end_date IS NULL AND date >= from))
  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .select('*')
    .eq('shop_id', shopId)
    .lte('date', to)
    .or(`end_date.gte.${from},and(end_date.is.null,date.gte.${from})`)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const requestShopId = searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(requestShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'id required' })
  const { error } = await supabaseAdmin.from('calendar_events').delete().eq('id', id).eq('shop_id', shopId)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
