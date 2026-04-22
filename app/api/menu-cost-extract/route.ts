export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/supabase-server'

const PROMPT = `あなたはメニュー表・価格表を読み取るOCRアシスタントです。
この画像からすべてのメニュー（料理・飲み物）の名前と価格を読み取り、JSON配列のみで返してください。文章は一切不要です。

【抽出ルール】
- メニュー名と価格（税込・税抜どちらでも読み取れた値）を抽出する
- 料理・フードは category を "food"、ドリンク・飲み物・アルコール類は "beverage" にする
- 価格が複数ある場合（Sサイズ・Mサイズなど）はそれぞれ別の行として出力する
- 「〜円」「¥〜」「\〜」などの表記から数値のみ抽出する
- 価格が読み取れないものは sell_price を null にする
- 写真が複数ある場合はすべてのページから抽出する

【返答形式（このJSONのみ）】
[
  {"menu_name": "メニュー名", "sell_price": 数値またはnull, "category": "food" または "beverage"},
  ...
]`

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const files = formData.getAll('file') as File[]
    if (files.length === 0) return NextResponse.json({ success: false, error: 'ファイルがありません' })
    if (files.length > 5) return NextResponse.json({ success: false, error: '一度に送れる写真は5枚までです' })
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: `ファイルサイズは1枚5MB以内にしてください（${file.name}）` })
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text', text: PROMPT }
        ]
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ success: false, error: '読み取りに失敗しました。もう一度お試しください。' })

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data: extracted })
  } catch (e) {
    console.error('menu-cost-extract error:', e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}
