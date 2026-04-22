import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const requestShopId = searchParams.get('shopId') ?? undefined
  const auth = await getAuthContext(requestShopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth
  const toolName = searchParams.get('toolName')
  if (!toolName) return NextResponse.json({ success: false })

  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .select('*')
    .eq('shop_id', shopId)
    .eq('tool_name', toolName)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const auth = await getAuthContext(body.shopId)
  if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  const { shopId } = auth
  const { toolName, title } = body
  if (!toolName) return NextResponse.json({ success: false })

  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .insert({ shop_id: shopId, tool_name: toolName, title: title ?? '新しい相談' })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}
