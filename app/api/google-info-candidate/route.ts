export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { query } = await req.json() as { query: string }

    const prompt = `
あなたは飲食店情報の調査アシスタントです。

以下のフリーワードで飲食店をGoogleで検索し、該当する店舗を1件だけ特定してください。

検索ワード：${query}

【重要】Web検索は1回だけ実行してください。

以下の形式のみで出力してください（前置き・後置き・説明文は一切不要）：

店名：（正式な店名）
住所：（都道府県から始まる住所）
エリア：（例：大阪府大阪市北区）
`

    let raw = ''
    await callClaudeWithWebSearchStream(prompt, (text) => { raw += text }, 300)

    const get = (label: string) =>
      raw.match(new RegExp(`${label}：([^\n]+)`))?.[1]?.trim() ?? ''

    const candidate = {
      shopName: get('店名'),
      address: get('住所'),
      area: get('エリア'),
    }

    if (!candidate.shopName) {
      return NextResponse.json({ success: false, error: '店舗が見つかりませんでした。別のキーワードでお試しください。' })
    }

    return NextResponse.json({ success: true, candidate })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const isRateLimit = msg.includes('rate_limit') || msg.includes('429')
    return NextResponse.json({
      success: false,
      error: isRateLimit ? 'RATE_LIMIT' : '検索に失敗しました。もう一度お試しください。'
    })
  }
}
