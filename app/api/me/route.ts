import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
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

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!userData) {
      return NextResponse.json({ success: false, error: 'user not found' }, { status: 404 })
    }

    let shopData = null
    if (userData.shop_id) {
      const { data } = await supabaseAdmin
        .from('shops')
        .select('*')
        .eq('id', userData.shop_id)
        .single()
      shopData = data
    }

    return NextResponse.json({ success: true, user: userData, shop: shopData })
  } catch (error) {
    console.error('me error:', error)
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 })
  }
}
