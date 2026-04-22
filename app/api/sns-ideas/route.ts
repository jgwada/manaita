export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaudeStream } from '@/lib/claude'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'
import { shopContext } from '@/lib/prompts/helpers'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { shopProfile: ShopProfile }
    const auth = await getAuthContext(body.shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { shopProfile } = body

    const prompt = `
あなたはSNSマーケティングの専門家です。
以下の飲食店のプロフィールとリサーチ情報をもとに、SNS投稿のネタ候補を提案してください。

${shopContext(shopProfile)}

【条件】
- この店の強み・特徴・口コミで好評な点を活かしたネタを優先する
- Instagram・X・Googleビジネスで反応が取りやすい内容にする
- 今すぐ実践できる具体的なネタにする
- 8個提案する

以下の形式のみで出力してください（前置き・後置き不要）：

1.（ネタのタイトル）｜（ひとこと説明）
2.（ネタのタイトル）｜（ひとこと説明）
3.（ネタのタイトル）｜（ひとこと説明）
4.（ネタのタイトル）｜（ひとこと説明）
5.（ネタのタイトル）｜（ひとこと説明）
6.（ネタのタイトル）｜（ひとこと説明）
7.（ネタのタイトル）｜（ひとこと説明）
8.（ネタのタイトル）｜（ひとこと説明）
`

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
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg })
  }
}
