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

  if (!year || !month) return NextResponse.json({ success: false, error: 'パラメータ不足' })

  const { data, error } = await supabaseAdmin
    .from('monthly_targets')
    .select('*')
    .eq('shop_id', shopId)
    .eq('year', parseInt(year))
    .eq('month', parseInt(month))
    .single()

  if (error?.code === 'PGRST116') return NextResponse.json({ success: true, data: null })
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth
    const { year, month, targetSales } = body

    const { data, error } = await supabaseAdmin
      .from('monthly_targets')
      .upsert({
        shop_id: shopId, year, month,
        target_sales: targetSales,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_id,year,month' })
      .select().single()

    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
