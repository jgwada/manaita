import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const requestShopId = searchParams.get('shopId') ?? undefined
    const auth = await getAuthContext(requestShopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { data, error } = await supabaseAdmin
      .from('survey_settings')
      .select('*')
      .eq('shop_id', shopId)
      .order('category')
      .order('sort_order')

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('survey-settings GET error:', error)
    return NextResponse.json({ success: false, error: 'データの取得に失敗しました。' })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { category, label } = body

    const { data: existing } = await supabaseAdmin
      .from('survey_settings')
      .select('sort_order')
      .eq('shop_id', shopId)
      .eq('category', category)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await supabaseAdmin
      .from('survey_settings')
      .insert({ shop_id: shopId, category, label, sort_order: nextOrder })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('survey-settings POST error:', error)
    return NextResponse.json({ success: false, error: '追加に失敗しました。' })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { id } = body

    const { error } = await supabaseAdmin
      .from('survey_settings')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('survey-settings DELETE error:', error)
    return NextResponse.json({ success: false, error: '削除に失敗しました。' })
  }
}
