export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeStream } from '@/lib/claude'
import { buildSnsPrompt } from '@/lib/prompts/sns'
import { buildReviewPrompt } from '@/lib/prompts/review'
import { buildRecruitPrompt } from '@/lib/prompts/recruit'
import { buildBanquetPrompt } from '@/lib/prompts/banquet'
import { buildManualPrompt } from '@/lib/prompts/manual'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { toolName, shopProfile, inputs, tone } = await req.json() as {
      toolName: string
      shopProfile: ShopProfile
      inputs: Record<string, string>
      tone?: string
    }

    let prompt = ''

    switch (toolName) {
      case 'sns':
        prompt = buildSnsPrompt(shopProfile, inputs.content, tone || 'カジュアル')
        break
      case 'review':
        prompt = buildReviewPrompt(shopProfile, inputs.review, inputs.sentiment)
        break
      case 'recruit':
        prompt = buildRecruitPrompt(shopProfile, inputs.type, inputs.conditions)
        break
      case 'banquet':
        prompt = buildBanquetPrompt(shopProfile, inputs.type, inputs.details)
        break
      case 'manual':
        prompt = buildManualPrompt(shopProfile, inputs.type, inputs.rules)
        break
      default:
        return NextResponse.json({ success: false, error: '未対応のツールです。' })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeStream(prompt, (text) => {
            controller.enqueue(encoder.encode(text))
          })
        } catch {
          controller.enqueue(
            encoder.encode('ERROR:AI生成に失敗しました。もう一度お試しください。')
          )
        } finally {
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
    console.error('generate error:', error)
    return NextResponse.json({ success: false, error: 'リクエストの処理に失敗しました。' })
  }
}
