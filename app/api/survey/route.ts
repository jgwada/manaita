import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { callClaude } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { publicToken, rating, selectedMenus, selectedGoodPoints, scene, revisitScore, freeComment } = await req.json()

    if (!publicToken || !rating) {
      return NextResponse.json({ success: false, error: '必須項目が不足しています' })
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id, name, area, industry, google_review_url, tabelog_url')
      .eq('public_token', publicToken)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ success: false, error: '店舗が見つかりません' })
    }

    let generatedReview = null

    if (rating >= 4) {
      const prompt = `
あなたは飲食店の口コミを書くお客様です。以下の情報をもとに、自然でリアルな口コミ文を生成してください。

店名：${shop.name}
地域：${shop.area}
業態：${shop.industry}
注文したメニュー：${(selectedMenus || []).join('、') || 'なし'}
特に良かった点：${(selectedGoodPoints || []).join('、') || 'なし'}
利用シーン：${scene || ''}
また来たい度：${revisitScore ? `${revisitScore}/5` : ''}
感想メモ：${freeComment || ''}

条件：
- 200字程度
- 自然な口語体（実際のお客様が書いたように）
- ポジティブな内容
- ハッシュタグなし
- 前置き・後置き一切不要。口コミ文のみ出力

`
      generatedReview = await callClaude(prompt)
    }

    const { error } = await supabaseAdmin.from('surveys').insert({
      shop_id: shop.id,
      rating,
      selected_menus: selectedMenus || [],
      selected_good_points: selectedGoodPoints || [],
      scene: scene || null,
      revisit_score: revisitScore || null,
      free_comment: freeComment || null,
      generated_review: generatedReview,
      redirected_to_google: false,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        rating,
        generatedReview,
        googleReviewUrl: rating >= 4 ? shop.google_review_url : null,
        tabelogUrl: rating >= 4 ? shop.tabelog_url : null,
      }
    })
  } catch (error) {
    console.error('survey POST error:', error)
    return NextResponse.json({ success: false, error: 'アンケートの送信に失敗しました。' })
  }
}
