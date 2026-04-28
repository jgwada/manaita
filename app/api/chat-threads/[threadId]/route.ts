import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

async function verifyThreadOwnership(threadId: string, shopId: string | null, role: 'admin' | 'shop') {
  if (role === 'admin') return true
  const { data } = await supabaseAdmin.from('chat_threads').select('shop_id').eq('id', threadId).single()
  return data?.shop_id === shopId
}

export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const shopId = new URL(req.url).searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(shopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  if (!(await verifyThreadOwnership(threadId, auth.shopId, auth.role))) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const { title, shopId: reqShopId } = await req.json()
  const auth = await getAuthContext(reqShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  if (!(await verifyThreadOwnership(threadId, auth.shopId, auth.role))) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })

  await supabaseAdmin
    .from('chat_threads')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', threadId)

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const shopId = new URL(req.url).searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(shopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  if (!(await verifyThreadOwnership(threadId, auth.shopId, auth.role))) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })

  await supabaseAdmin.from('chat_threads').delete().eq('id', threadId)
  return NextResponse.json({ success: true })
}
