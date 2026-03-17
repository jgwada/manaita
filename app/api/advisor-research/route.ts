export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'
import { shopContext } from '@/lib/prompts/helpers'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { shopProfile, urls } = await req.json() as {
      shopProfile: ShopProfile
      urls: string[]
    }

    const urlSection = urls.filter(Boolean).length > 0
      ? `\n参考URL（必ず参照すること）：\n${urls.filter(Boolean).map(u => `- ${u}`).join('\n')}`
      : ''

    const prompt = `
あなたは飲食店専門のリサーチャーです。
以下の店舗について、ネット上に存在するすべての情報を調査し、包括的なレポートを作成してください。
Web検索ツールを積極的に使い、できる限り詳細な情報を収集してください。

${shopContext(shopProfile)}${urlSection}

以下の観点を網羅して調査・レポートしてください：

1. 基本情報（住所・営業時間・定休日・席数・予約可否・アクセス）
2. メニュー・料理の特徴（代表メニュー・価格帯・こだわり・季節メニュー）
3. 口コミ・評判（食べログ・Google・SNSの評点・よく言及されるポイント・改善点）
4. SNS・Web上のプレゼンス（Instagram・X・TikTok・公式サイトの状況・フォロワー数・投稿頻度）
5. 集客の現状（予約の取りやすさ・混雑状況・待ち状況・宴会利用の有無）
6. 強み・差別化ポイント（他店と比較して優れている点）
7. 弱み・課題（口コミや状況から読み取れる改善点）
8. メディア掲載・受賞歴（雑誌・テレビ・グルメサイト掲載など）

調査結果はプロジェクトチームへの共有レポートとして、箇条書きと見出しを使って読みやすく整理してください。
情報が見つからない項目は「情報なし」と明記してください。
`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeWithWebSearchStream(prompt, (text) => {
            controller.enqueue(encoder.encode(text))
          })
        } catch {
          controller.enqueue(encoder.encode('ERROR:リサーチに失敗しました。もう一度お試しください。'))
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
    console.error('advisor-research error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
