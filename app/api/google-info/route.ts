export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { tabelogUrl?: string; shopName?: string; area?: string }

    const prompt = body.tabelogUrl
      ? `
あなたは飲食店のGoogleビジネス情報を調査するアシスタントです。

以下の食べログURLのお店について、GoogleマップのGoogle口コミURLとPlace IDを調査してください。

食べログURL：${body.tabelogUrl}

【重要】Web検索はちょうど2回だけ実行してください。それ以上は絶対に行わないこと。
1回目：食べログURLからお店の名前と地域を読み取り、「店名 地域 Googleマップ」で検索
2回目：見つかったGoogleマップのURLからPlace IDを特定するために追加検索（必要な場合のみ）
`
      : `
あなたは飲食店のGoogleビジネス情報を調査するアシスタントです。

以下の店舗について、GoogleマップのGoogle口コミURLとPlace IDを調査してください。

店名：${body.shopName}
エリア：${body.area ?? ''}

【重要】Web検索はちょうど2回だけ実行してください。それ以上は絶対に行わないこと。
1回目：「${body.shopName} ${body.area ?? ''} Googleマップ」で検索
2回目：見つかったGoogleマップのURLからPlace IDを特定するために追加検索（必要な場合のみ）
`

    const fullPrompt = prompt + `
以下の形式のみで出力してください（前置き・後置き・説明文は一切不要）：

店名：（店名）
Google口コミURL：（https://search.google.com/local/writereview?placeid=XXXXX の形式）
Place ID：（ChIJXXXXX... の形式）
Googleマップ URL：（https://maps.google.com/... の形式）

※Place IDはGoogleマップのURLに含まれる「ChIJ」または「0x」から始まる文字列です。
※Google口コミURLはPlace IDが判明した場合は https://search.google.com/local/writereview?placeid={PlaceID} の形式で生成してください。
※情報が見つからない項目は「情報なし」と記載してください。
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
