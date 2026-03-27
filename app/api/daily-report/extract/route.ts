export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { callClaudeWithContentStream } from '@/lib/claude'

const EXTRACT_PROMPT = `あなたはPOSレジの伝票・日計表を読み取るOCRアシスタントです。
この画像から以下の数値を読み取り、必ずJSON形式のみで返答してください。文章は一切不要です。

抽出する項目：
- lunch_sales: ランチ（昼）の売上金額（円、整数）
- dinner_sales: ディナー（夜）の売上金額（円、整数）
- lunch_customers: ランチの客数（人、整数）
- dinner_customers: ディナーの客数（人、整数）

注意：
- 「ランチ」「昼」「L」などがランチ、「ディナー」「夜」「D」などがディナー
- 区別できない場合は合計をlunch_salesに入れ、他は0
- 読み取れない項目はnullにする
- 金額は税込・税抜どちらでも読み取れた値をそのまま入れる

返答形式（このJSONのみ）：
{"lunch_sales":数値またはnull,"dinner_sales":数値またはnull,"lunch_customers":数値またはnull,"dinner_customers":数値またはnull}`

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'ファイルがありません' })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mt = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mt, data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT }
        ]
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ success: false, error: '読み取りに失敗しました' })

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data: extracted })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
