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
      .from('reviews')
      .select('*')
      .eq('shop_id', shopId)
      .order('replied', { ascending: true })
      .order('reviewed_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('reviews GET error:', error)
    return NextResponse.json({ success: false, error: '口コミの取得に失敗しました。' })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { reviewerName, rating, content, reviewedAt } = body

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        shop_id: shopId,
        reviewer_name: reviewerName || null,
        rating: rating || null,
        content,
        reviewed_at: reviewedAt || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('reviews POST error:', error)
    return NextResponse.json({ success: false, error: '口コミの登録に失敗しました。' })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const auth = await getAuthContext(body.shopId)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { id, replied, replyText } = body

    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ replied, reply_text: replyText || null })
      .eq('id', id)
      .eq('shop_id', shopId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('reviews PATCH error:', error)
    return NextResponse.json({ success: false, error: '更新に失敗しました。' })
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
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('reviews DELETE error:', error)
    return NextResponse.json({ success: false, error: '削除に失敗しました。' })
  }
}
