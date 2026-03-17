import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { email, password, role, shopId } = await req.json()

    // Supabase Authにユーザーを作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'ユーザー作成失敗')
    }

    // usersテーブルにも登録
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      role,
      shop_id: shopId || null,
      is_active: true,
    })

    if (dbError) throw new Error(dbError.message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('create-user error:', error)
    return NextResponse.json({ success: false, error: 'ユーザーの発行に失敗しました。' })
  }
}
