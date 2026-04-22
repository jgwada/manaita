import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const { role, content, shopId: reqShopId } = await req.json()
  if (!role || !content) return NextResponse.json({ success: false })

  const auth = await getAuthContext(reqShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

  // スレッドが自分の店舗のものか検証
  const { data: thread } = await supabaseAdmin.from('chat_threads').select('shop_id').eq('id', threadId).single()
  if (!thread || thread.shop_id !== auth.shopId) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })

  const { error: insertError } = await supabaseAdmin
    .from('chat_messages')
    .insert({ thread_id: threadId, role, content })

  if (insertError) return NextResponse.json({ success: false, error: insertError.message })

  const { error: updateError } = await supabaseAdmin
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)

  if (updateError) console.error('thread update error:', updateError)
  return NextResponse.json({ success: true })
}
