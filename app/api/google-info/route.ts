export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { tabelogUrl?: string; shopName?: string; area?: string }

    const shopName = body.tabelogUrl
      ? `食べログURL（${body.tabelogUrl}）のお店`
      : `${body.shopName}（${body.area ?? ''}）`

    const searchHint = body.tabelogUrl
      ? `まず食べログURLから店名と地域を読み取り、その情報でGoogleマップを検索してください。`
      : `「${body.shopName} ${body.area ?? ''} Googleマップ」で検索してください。`

    const fullPrompt = `
あなたは飲食店のGoogle Place IDを調査する専門アシスタントです。

対象店舗：${shopName}

【ミッション】この店舗のGoogle Place IDとGoogle口コミURLを特定してください。

【検索手順】Web検索を最大3回まで実行してください。
1回目：${searchHint}
  → 検索結果のURLの中から「maps.google.com」「google.com/maps」を含むURLを探す
  → URLの中に「ChIJ」で始まる文字列、または「!1s」の後に続く文字列があればそれがPlace ID
2回目（必要な場合）：「${body.shopName ?? '店名'} ${body.area ?? ''} place_id OR ChIJ」で検索
3回目（必要な場合）：「${body.shopName ?? '店名'} ${body.area ?? ''} google maps review」で検索

【Place IDの見つけ方】
- GoogleマップURLの例：https://www.google.com/maps/place/店名/@緯度,経度,/data=!4m6!3m5!1s【ここがPlace ID: ChIJで始まる】
- 「!1s」の直後に来る「ChIJ」で始まる文字列がPlace ID
- Place IDが見つかったら、Google口コミURLは https://search.google.com/local/writereview?placeid=【Place ID】 で生成できる

以下の形式のみで出力してください（前置き・後置き・説明文は一切不要）：

店名：（正式な店名）
Place ID：（ChIJXXXXX... の形式。見つからない場合は「情報なし」）
Google口コミURL：（https://search.google.com/local/writereview?placeid=XXXXX の形式。Place IDが不明なら「情報なし」）
GoogleマップURL：（見つかったGoogleマップのURL。なければ「情報なし」）
`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithWebSearchStream(fullPrompt, (text) => {
            controller.enqueue(encoder.encode(text))
          }, 1000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          const isRateLimit = msg.includes('rate_limit') || msg.includes('429')
          controller.enqueue(encoder.encode(`ERROR:${isRateLimit ? 'RATE_LIMIT' : msg}`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg })
  }
}
