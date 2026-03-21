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
以下の店舗の口コミ情報を調査してください。

${shopContext(shopProfile)}

【重要】Web検索はちょうど3回だけ実行してください。それ以上は絶対に行わないこと。
1回目：「${shopProfile.name} ${shopProfile.area} 口コミ 食べログ」で検索
2回目：「${shopProfile.name} ${shopProfile.area} Google 評判」で検索
3回目：「${shopProfile.name} ${shopProfile.area} Instagram」で検索

取得した情報から以下を簡潔にまとめてください（各項目3行以内）：

1. 評点・評判（食べログ・Google評価）
2. よく言及されるポジティブなポイント
3. よく言及される改善点・ネガティブな意見
4. 代表メニュー・料理の特徴（口コミから読み取れるもの）
5. Instagram・SNSの状況（アカウントの有無・投稿の雰囲気・人気コンテンツ）
6. 強み・差別化ポイント

情報がない項目は「情報なし」と記載。前置き・後置き不要。箇条書きで出力。
`

    let result = ''
    await callClaudeWithWebSearchStream(prompt, (text) => {
      result += text
    }, 2000, 'claude-sonnet-4-6')

    const { data: current } = await supabaseAdmin
      .from('shops')
      .select('research_cache')
      .eq('id', shopId)
      .single()

    await supabaseAdmin
      .from('shops')
      .update({
        research_cache: result,
        research_prev_cache: current?.research_cache ?? null,
        research_updated_at: new Date().toISOString(),
      })
      .eq('id', shopId)

    return NextResponse.json({ success: true, research: result, research_updated_at: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('research-shop error:', msg)
    const isRateLimit = msg.includes('rate_limit') || msg.includes('429')
    return NextResponse.json({
      success: false,
      error: isRateLimit ? 'RATE_LIMIT' : msg
    })
  }
}
