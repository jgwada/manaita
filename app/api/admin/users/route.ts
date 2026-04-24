import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active, created_at, shop_id, shops(name)')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    // auth.usersから最終ログイン日時を取得
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const authMap = new Map(
      (authData?.users ?? []).map(u => [u.id, u.last_sign_in_at])
    )

    const enriched = (data ?? []).map(u => ({
      ...u,
      last_sign_in_at: authMap.get(u.id) ?? null,
    }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg })
  }
}
