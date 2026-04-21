import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  const toolName = searchParams.get('toolName')
  if (!shopId || !toolName) return NextResponse.json({ success: false })

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
  const { shopId, toolName, title } = await req.json()
  if (!shopId || !toolName) return NextResponse.json({ success: false })

  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .insert({ shop_id: shopId, tool_name: toolName, title: title ?? '新しい相談' })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, data })
}
