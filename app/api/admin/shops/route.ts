import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('id, name, area, industry, research_cache, research_prev_cache, research_updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('fetch shops error:', error)
    return NextResponse.json({ success: false, error: '店舗一覧の取得に失敗しました。' })
  }
}
