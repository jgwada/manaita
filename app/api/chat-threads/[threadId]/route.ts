import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params

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
  const { title } = await req.json()

  await supabaseAdmin
    .from('chat_threads')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', threadId)

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  await supabaseAdmin.from('chat_threads').delete().eq('id', threadId)
  return NextResponse.json({ success: true })
}
