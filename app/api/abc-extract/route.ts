export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildAbcExtractPrompt } from '@/lib/prompts/abc'

type ExtractedRow = {
  extracted: string
  matched_name: string | null
  count: number | null
  confidence: 'high' | 'low'
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('file') as File[]
    const menuNamesRaw = formData.get('menuNames') as string
    const menuNames: string[] = menuNamesRaw ? JSON.parse(menuNamesRaw) : []

    if (files.length === 0) return NextResponse.json({ success: false, error: 'ファイルがありません' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = buildAbcExtractPrompt(menuNames)

    // 複数画像を1リクエストで処理
    const imageContents: Anthropic.ImageBlockParam[] = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')
        const mt = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'
        return { type: 'image' as const, source: { type: 'base64' as const, media_type: mt, data: base64 } }
      })
    )

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text', text: prompt }
        ]
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ success: false, error: '読み取りに失敗しました。もう一度お試しください。' })

    const rows: ExtractedRow[] = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data: rows })
  } catch (e) {
    console.error('abc-extract error:', e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}
