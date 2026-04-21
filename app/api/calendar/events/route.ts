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
    .from('calendar_events')
    .select('*')
    .eq('shop_id', shopId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'id required' })
  const { error } = await supabaseAdmin.from('calendar_events').delete().eq('id', id)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
