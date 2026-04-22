import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const { role, content } = await req.json()
  if (!role || !content) return NextResponse.json({ success: false })

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
