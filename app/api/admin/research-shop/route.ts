export const maxDuration = 60

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { callClaudeWithWebSearchStream } from '@/lib/claude'
import { shopContext } from '@/lib/prompts/helpers'
import { ShopProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { shopId } = await req.json() as { shopId: string }

    const { data: shop, error } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single()

    if (error || !shop) {
      return NextResponse.json({ success: false, error: '店舗が見つかりません' })
    }

    const shopProfile: ShopProfile = {
      id: shop.id,
      name: shop.name,
      area: shop.area,
      industry: shop.industry,
      priceRange: shop.price_range,
      seats: shop.seats,
      googleReviewUrl: shop.google_review_url,
      placeId: shop.place_id,
      lineOfficialUrl: shop.line_official_url,
      createdAt: shop.created_at,
    }

    const prompt = `
あなたは飲食店専門のリサーチャーです。
以下の店舗についてWeb検索で調査し、簡潔なレポートを作成してください。

${shopContext(shopProfile)}

以下の観点を調査してください（各項目2〜3行程度で簡潔に）：

1. 基本情報（住所・営業時間・定休日）
2. メニュー・料理の特徴（代表メニュー・価格帯・こだわり）
3. 口コミ・評判（評点・よく言及されるポイント）
4. SNS・Webの状況（公式サイト・SNSの有無）
5. 強み・差別化ポイント
6. 改善点・課題

簡潔な箇条書きでまとめてください。情報がない項目は「情報なし」と記載。
`

    let result = ''
    await callClaudeWithWebSearchStream(prompt, (text) => {
      result += text
    })

    await supabaseAdmin
      .from('shops')
      .update({ research_cache: result })
      .eq('id', shopId)

    return NextResponse.json({ success: true, research: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('research-shop error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
