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
    if (!authUser) return NextResponse.json({ success: false }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users').select('role').eq('id', authUser.id).single()
    if (userData?.role !== 'admin') return NextResponse.json({ success: false }, { status: 403 })

    const { data } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('admin feedback error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
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
    if (!authUser) return NextResponse.json({ success: false }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users').select('role').eq('id', authUser.id).single()
    if (userData?.role !== 'admin') return NextResponse.json({ success: false }, { status: 403 })

    const { id, status } = await req.json()
    await supabaseAdmin.from('feedback').update({ status }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('admin feedback patch error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
