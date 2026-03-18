export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { callClaudeWithContentStream } from '@/lib/claude'
import { buildBanquetGenPrompt } from '@/lib/prompts/banquet'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const inputType = formData.get('inputType') as 'text' | 'pdf' | 'image'
    const shopProfile: ShopProfile = JSON.parse(formData.get('shopProfile') as string)
    const priceMin = formData.get('priceMin') as string ?? '5000'
    const priceMax = formData.get('priceMax') as string ?? '8000'
    const ingredientMode = (formData.get('ingredientMode') as 'existing' | 'additional') ?? 'additional'

    let messageContent: Anthropic.MessageParam['content']
    const promptText = buildBanquetGenPrompt(
      shopProfile,
      inputType === 'text' ? (formData.get('menuText') as string ?? '') : null,
      priceMin,
      priceMax,
      ingredientMode
    )

    if (inputType === 'text') {
      messageContent = promptText
    } else {
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ success: false, error: 'ファイルが見つかりません。' })
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')

      if (inputType === 'pdf') {
        messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as Anthropic.DocumentBlockParam,
          { type: 'text', text: promptText }
        ]
      } else {
        const mt = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
        messageContent = [
          { type: 'image', source: { type: 'base64', media_type: mt, data: base64 } } as Anthropic.ImageBlockParam,
          { type: 'text', text: promptText }
        ]
      }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithContentStream(messageContent, (text) => {
            controller.enqueue(encoder.encode(text))
          })
        } catch {
          controller.enqueue(encoder.encode('ERROR:AI生成に失敗しました。もう一度お試しください。'))
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
    console.error('banquet-gen error:', msg)
    return NextResponse.json({ success: false, error: msg || 'リクエストの処理に失敗しました。' })
  }
}
