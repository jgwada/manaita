export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeStream } from '@/lib/claude'
import { buildFlCommentPrompt } from '@/lib/prompts/fl'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { shopProfile, year, month, revenue, foodCost, beverageCost, laborCost, flRatio, foodRatio, beverageRatio, laborRatio, prevFlRatio } = await req.json() as {
      shopProfile: ShopProfile
      year: number; month: number
      revenue: number; foodCost: number; beverageCost: number; laborCost: number
      flRatio: number; foodRatio: number; beverageRatio: number; laborRatio: number
      prevFlRatio?: number | null
    }

    const prompt = buildFlCommentPrompt(shopProfile, year, month, revenue, foodCost, beverageCost, laborCost, flRatio, foodRatio, beverageRatio, laborRatio, prevFlRatio)
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeStream(prompt, (text) => {
            controller.enqueue(encoder.encode(text))
          })
        } catch (err) {
          controller.enqueue(encoder.encode(`ERROR:${String(err)}`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
