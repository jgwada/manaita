export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeChatStream } from '@/lib/claude'
import { buildAdvisorSystemPrompt } from '@/lib/prompts/advisor'
import { logUsage } from '@/lib/log'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { messages, shopProfile, researchContext } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      shopProfile: ShopProfile
      researchContext?: string
    }

    const systemPrompt = buildAdvisorSystemPrompt(shopProfile, researchContext)
    logUsage(shopProfile.id, 'advisor', messages.at(-1)?.content?.slice(0, 50))
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeChatStream(messages, (text) => {
            controller.enqueue(encoder.encode(text))
          }, systemPrompt, 3000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('advisor stream error:', msg)
          controller.enqueue(encoder.encode(`ERROR:${msg}`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('advisor error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
