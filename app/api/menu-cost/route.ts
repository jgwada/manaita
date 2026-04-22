import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const requestShopId = searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(requestShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth

  const { data, error } = await supabaseAdmin
    .from('menu_cost_items')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth
    const { menuName, sellPrice, costPrice, category } = body
    const { data, error } = await supabaseAdmin
      .from('menu_cost_items')
      .insert({ shop_id: shopId, menu_name: menuName, sell_price: sellPrice, cost_price: costPrice, category })
      .select().single()
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'id required' })
  const { error } = await supabaseAdmin.from('menu_cost_items').delete().eq('id', id)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
