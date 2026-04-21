import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const { role, content } = await req.json()
  if (!role || !content) return NextResponse.json({ success: false })

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .insert({ thread_id: threadId, role, content })

  await supabaseAdmin
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
