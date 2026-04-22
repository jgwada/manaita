import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const requestShopId = searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(requestShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth

  // 全履歴取得
  if (searchParams.get('history') === 'true') {
    const { data, error } = await supabaseAdmin
      .from('fl_monthly_records')
      .select('id,year,month,revenue,food_cost,beverage_cost,labor_cost,fl_ratio,food_ratio,beverage_ratio,labor_ratio')
      .eq('shop_id', shopId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  }

  // 最新スタッフ情報取得
  if (searchParams.get('latestStaff') === 'true') {
    const { data, error } = await supabaseAdmin
      .from('fl_monthly_records')
      .select('staff_details,year,month')
      .eq('shop_id', shopId)
      .not('staff_details', 'is', null)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .single()
    if (error?.code === 'PGRST116') return NextResponse.json({ success: true, data: null })
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  }

  // 月次データ取得
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  if (!year || !month) return NextResponse.json({ success: false, error: 'パラメータ不足' })

  const prevYear = parseInt(month) === 1 ? parseInt(year) - 1 : parseInt(year)
  const prevMonth = parseInt(month) === 1 ? 12 : parseInt(month) - 1

  const [current, prev] = await Promise.all([
    supabaseAdmin.from('fl_monthly_records').select('*')
      .eq('shop_id', shopId).eq('year', parseInt(year)).eq('month', parseInt(month)).single(),
    supabaseAdmin.from('fl_monthly_records').select('*')
      .eq('shop_id', shopId).eq('year', prevYear).eq('month', prevMonth).single(),
  ])

  return NextResponse.json({
    success: true,
    data: current.error?.code === 'PGRST116' ? null : current.data,
    prevData: prev.error?.code === 'PGRST116' ? null : prev.data,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth
    const { year, month, revenue, foodCost, beverageCost, laborCost, staffDetails } = body

    const totalF = foodCost + beverageCost
    const flRatio = revenue > 0 ? Math.round(((totalF + laborCost) / revenue) * 1000) / 10 : null
    const foodRatio = revenue > 0 ? Math.round((foodCost / revenue) * 1000) / 10 : null
    const beverageRatio = revenue > 0 ? Math.round((beverageCost / revenue) * 1000) / 10 : null
    const laborRatio = revenue > 0 ? Math.round((laborCost / revenue) * 1000) / 10 : null

    const { data, error } = await supabaseAdmin
      .from('fl_monthly_records')
      .upsert({
        shop_id: shopId, year, month,
        revenue, food_cost: foodCost, beverage_cost: beverageCost, labor_cost: laborCost,
        fl_ratio: flRatio, food_ratio: foodRatio, beverage_ratio: beverageRatio, labor_ratio: laborRatio,
        staff_details: staffDetails,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_id,year,month' })
      .select().single()

    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, aiComment } = await req.json()
    const { error } = await supabaseAdmin
      .from('fl_monthly_records')
      .update({ ai_comment: aiComment })
      .eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'id required' })
  const { error } = await supabaseAdmin.from('fl_monthly_records').delete().eq('id', id)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
