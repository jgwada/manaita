export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'
import { buildPriceCheckPrompt } from '@/lib/prompts/priceCheck'
import { logUsage } from '@/lib/log'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      shopProfile: ShopProfile
      menuName: string
      price: number
      category: string
    }
    const auth = await getAuthContext(body.shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { shopProfile, menuName, price, category } = body

    const prompt = buildPriceCheckPrompt(shopProfile, menuName, price, category)
    const encoder = new TextEncoder()
    const outputChunks: string[] = []

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithWebSearchStream(prompt, (text) => {
            outputChunks.push(text)
            controller.enqueue(encoder.encode(text))
          }, 2000)
        } catch {
          controller.enqueue(encoder.encode('ERROR:価格調査に失敗しました。もう一度お試しください。'))
        } finally {
          logUsage(shopId, 'price-check', `${menuName} ${price}円`, outputChunks.join(''))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('price-check error:', msg)
    return NextResponse.json({ success: false, error: msg || 'リクエストの処理に失敗しました。' })
  }
}
