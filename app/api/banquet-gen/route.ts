export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { callClaudeWithContentStream } from '@/lib/claude'
import { buildBanquetGenPrompt } from '@/lib/prompts/banquet'
import { logUsage } from '@/lib/log'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const shopProfile: ShopProfile = JSON.parse(formData.get('shopProfile') as string)
    const auth = await getAuthContext(shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth
    const priceMin = formData.get('priceMin') as string ?? '5000'
    const priceMax = formData.get('priceMax') as string ?? '8000'
    const ingredientMode = (formData.get('ingredientMode') as 'existing' | 'additional') ?? 'additional'
    const menuText = (formData.get('menuText') as string ?? '').trim()
    const wishes = (formData.get('wishes') as string ?? '').trim()
    const files = formData.getAll('file') as File[]

    const promptText = buildBanquetGenPrompt(shopProfile, menuText || null, priceMin, priceMax, ingredientMode, files.length > 0, wishes)
    const inputSummary = `${priceMin}〜${priceMax}円`

    let messageContent: Anthropic.MessageParam['content']

    if (files.length === 0) {
      messageContent = promptText
    } else {
      const blocks: Anthropic.MessageParam['content'] = []

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')

        if (isPdf) {
          blocks.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 }
          } as Anthropic.DocumentBlockParam)
        } else {
          const mt = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
          blocks.push({
            type: 'image',
            source: { type: 'base64', media_type: mt, data: base64 }
          } as Anthropic.ImageBlockParam)
        }
      }

      blocks.push({ type: 'text', text: promptText })
      messageContent = blocks
    }

    const encoder = new TextEncoder()
    const outputChunks: string[] = []
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithContentStream(messageContent, (text) => {
            outputChunks.push(text)
            controller.enqueue(encoder.encode(text))
          })
        } catch {
          controller.enqueue(encoder.encode('ERROR:AI生成に失敗しました。もう一度お試しください。'))
        } finally {
          logUsage(shopId, 'banquet-gen', inputSummary, outputChunks.join(''))
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
