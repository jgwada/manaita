export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeStream } from '@/lib/claude'
import { buildDailyReportPrompt } from '@/lib/prompts/dailyReport'
import { logUsage } from '@/lib/log'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { shopProfile, date, lunchSales, dinnerSales, lunchCustomers, dinnerCustomers,
      weatherCondition, temperature, tempVsAvg, memo } = await req.json() as {
      shopProfile: ShopProfile
      date: string
      lunchSales: number | null
      dinnerSales: number | null
      lunchCustomers: number | null
      dinnerCustomers: number | null
      weatherCondition: string | null
      temperature: number | null
      tempVsAvg: number | null
      memo: string
    }

    const auth = await getAuthContext(shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const prompt = buildDailyReportPrompt(
      shopProfile, date, lunchSales, dinnerSales, lunchCustomers, dinnerCustomers,
      weatherCondition, temperature, tempVsAvg, memo
    )

    const encoder = new TextEncoder()
    const outputChunks: string[] = []
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeStream(prompt, (text) => {
            outputChunks.push(text)
            controller.enqueue(encoder.encode(text))
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          controller.enqueue(encoder.encode(`ERROR:${msg}`))
        } finally {
          logUsage(shopProfile.id, 'daily-report', date, outputChunks.join(''))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      }
    })
  } catch (error) {
    console.error('daily-report generate error:', error)
    return NextResponse.json({ success: false, error: 'リクエストの処理に失敗しました。' })
  }
}
