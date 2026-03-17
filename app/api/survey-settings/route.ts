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
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { category, label } = await req.json()

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
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { id } = await req.json()

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
