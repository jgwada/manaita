import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getShopId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabaseAdmin.from('users').select('shop_id').eq('id', user.id).single()
  return data?.shop_id ?? null
}

export async function GET() {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

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
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { reviewerName, rating, content, reviewedAt } = await req.json()

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
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { id, replied, replyText } = await req.json()

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
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { id } = await req.json()

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
