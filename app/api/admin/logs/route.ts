import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get('shopId')

    const query = supabaseAdmin
      .from('usage_logs')
      .select('id, shop_id, tool_name, input_summary, created_at, shops(name)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (shopId) query.eq('shop_id', shopId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
