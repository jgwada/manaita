import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    // 最新の fetched_date を取得
    const { data: latest } = await supabaseAdmin
      .from('news_articles')
      .select('fetched_date')
      .order('fetched_date', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return NextResponse.json({ success: true, articles: [], latestDate: null })
    }

    // その日付のニュースを全件取得
    const { data: articles, error } = await supabaseAdmin
      .from('news_articles')
      .select('id, title, url, source_name, category, summary, published_at, fetched_date')
      .eq('fetched_date', latest.fetched_date)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      articles: articles ?? [],
      latestDate: latest.fetched_date,
    })
  } catch (error) {
    console.error('news GET error:', error)
    return NextResponse.json({ success: false, error: 'ニュースの取得に失敗しました。' })
  }
}
