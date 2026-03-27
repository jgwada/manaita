import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!shopId) return NextResponse.json({ success: false, error: 'shopId required' })

  // 期間指定（週次・月次サマリー用）
  if (from && to) {
    const { data, error } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .eq('shop_id', shopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true })
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  }

  // 単日取得
  if (date) {
    const { data, error } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .eq('shop_id', shopId)
      .eq('date', date)
      .single()
    if (error?.code === 'PGRST116') return NextResponse.json({ success: true, data: null })
    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, data })
  }

  // 最新50件（履歴一覧）
  const { data, error } = await supabaseAdmin
    .from('daily_reports')
    .select('id,date,lunch_sales,dinner_sales,lunch_customers,dinner_customers,weather_condition,temperature,temp_vs_avg,ai_report')
    .eq('shop_id', shopId)
    .order('date', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { shopId, date, lunchSales, dinnerSales, lunchCustomers, dinnerCustomers,
      weatherCondition, temperature, tempVsAvg, memo, aiReport } = body

    const { data, error } = await supabaseAdmin
      .from('daily_reports')
      .upsert({
        shop_id: shopId, date,
        lunch_sales: lunchSales, dinner_sales: dinnerSales,
        lunch_customers: lunchCustomers, dinner_customers: dinnerCustomers,
        weather_condition: weatherCondition, temperature, temp_vs_avg: tempVsAvg,
        memo, ai_report: aiReport ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_id,date' })
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
  const { error } = await supabaseAdmin.from('daily_reports').delete().eq('id', id)
  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
