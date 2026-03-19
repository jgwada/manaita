export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeStream } from '@/lib/claude'
import { ShopProfile } from '@/types'

type MemberMessage = { key: string; text: string }
type Turn =
  | { role: 'owner' | 'ceo'; text: string }
  | { role: 'team'; members: MemberMessage[] }
  | { role: 'summary'; text: string }

export async function POST(req: Request) {
  try {
    const { turns, shopProfile, context } = await req.json() as {
      turns: Turn[]
      shopProfile: ShopProfile
      context?: 'general' | 'advisor'
    }

    const speakerLabel = context === 'advisor' ? 'CEO（オーナー）' : 'オーナー'
    const teamLabel = context === 'advisor' ? '集客戦略チーム' : '経営専門家チーム'
    const actionFocus = context === 'advisor'
      ? '集客・マーケティング・SNS・メニュー改善など集客に直結する具体的な行動'
      : 'オーナーが今すぐ取り組むべき具体的な行動'

    const conversationText = turns.map(t => {
      if (t.role === 'owner' || t.role === 'ceo') return `【${speakerLabel}】\n${t.text}`
      if (t.role === 'summary') return null
      if (t.role === 'team') return t.members.map(m => `【${m.key}】\n${m.text}`).join('\n\n')
      return null
    }).filter(Boolean).join('\n\n---\n\n')

    const prompt = `以下は「${shopProfile.name}」（${shopProfile.area}・${shopProfile.industry}）の${speakerLabel}と${teamLabel}の相談の会話です。

=== 会話内容 ===
${conversationText}
================

この会話を基に、以下の2点を日本語で作成してください。

【📝 相談の要約・議事録】
どんな課題について話し合い、チームからどんなアドバイスがあったかを200〜300字程度で簡潔にまとめる。

【✅ 次にやること（アクションアイテム）】
チームのアドバイスを踏まえ、${actionFocus}を3〜5件、番号付きリストで記載する。
（例）
1. ○○○
2. ○○○
3. ○○○`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callClaudeStream(prompt, (text) => {
            controller.enqueue(encoder.encode(text))
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          controller.enqueue(encoder.encode(`ERROR:${msg}`))
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
    return NextResponse.json({ success: false, error: msg })
  }
}
