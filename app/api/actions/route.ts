import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  if (!shopId) return NextResponse.json({ success: false })

  const { data, error } = await supabaseAdmin
    .from('action_records')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const { shopId, content } = await req.json()
  if (!shopId || !content) return NextResponse.json({ success: false })

  const { data, error } = await supabaseAdmin
    .from('action_records')
    .insert({ shop_id: shopId, content })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: Request) {
  const { id, done } = await req.json()
  if (!id) return NextResponse.json({ success: false })

  await supabaseAdmin.from('action_records').update({ done }).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false })

  await supabaseAdmin.from('action_records').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
