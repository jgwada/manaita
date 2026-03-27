export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithContentStream } from '@/lib/claude'
import { buildResearchPrompt } from '@/lib/prompts/research'
import { logUsage } from '@/lib/log'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { shopProfile, competitorInfo } = await req.json() as {
      shopProfile: ShopProfile
      competitorInfo: string
    }

    const prompt = buildResearchPrompt(shopProfile, competitorInfo)
    const encoder = new TextEncoder()
    const outputChunks: string[] = []

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithContentStream(prompt, (text) => {
            outputChunks.push(text)
            controller.enqueue(encoder.encode(text))
          }, 8000)
        } catch {
          controller.enqueue(encoder.encode('ERROR:分析に失敗しました。もう一度お試しください。'))
        } finally {
          logUsage(shopProfile.id, 'research', undefined, outputChunks.join(''))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('research error:', msg)
    return NextResponse.json({ success: false, error: msg || 'リクエストの処理に失敗しました。' })
  }
}
