export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeChatStream } from '@/lib/claude'
import { buildChatSystemPrompt } from '@/lib/prompts/chat'
import { logUsage } from '@/lib/log'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      shopProfile: ShopProfile
    }
    const auth = await getAuthContext(body.shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { messages, shopProfile } = body
    const systemPrompt = buildChatSystemPrompt(shopProfile)
    const inputSummary = messages.at(-1)?.content?.slice(0, 50)
    const encoder = new TextEncoder()
    const outputChunks: string[] = []

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeChatStream(messages, (text) => {
            outputChunks.push(text)
            controller.enqueue(encoder.encode(text))
          }, systemPrompt, 3000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('chat stream error:', msg)
          controller.enqueue(encoder.encode(`ERROR:${msg}`))
        } finally {
          logUsage(shopId, 'chat', inputSummary, outputChunks.join(''))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('chat error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
