import { ShopProfile } from '@/types'

export const buildAbcExtractPrompt = (menuNames: string[]): string => `
あなたはPOSレジの伝票・売上レポートを読み取るOCRアシスタントです。
この画像から「メニュー名」と「注文数（個数）」のペアを読み取り、JSON配列のみで返してください。文章は一切不要です。

【既存メニューリスト】
以下のメニュー名と照合してください：
${menuNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

【抽出ルール】
- 伝票に書かれたメニュー名を読み取り、上記リストの中で最も近いものを matched_name に入れる
- 完全一致しない場合（略称・コードなど）は最も近いものを選び、confidence を "low" にする
- 既存リストにない場合は matched_name を null にする
- 注文数が読み取れない場合は count を null にする
- 合計行・小計行・税額行は除外する

【返答形式（このJSONのみ）】
[
  {"extracted": "伝票の表記", "matched_name": "既存メニュー名またはnull", "count": 数値またはnull, "confidence": "high" または "low"},
  ...
]
`

type AnalyzedItem = {
  menuName: string
  sellPrice: number
  costPrice: number
  count: number
  quadrant: 'star' | 'improve' | 'hidden' | 'review'
}

export const buildAbcAdvicePrompt = (shop: ShopProfile, items: AnalyzedItem[]): string => {
  const star = items.filter(i => i.quadrant === 'star').map(i => i.menuName)
  const improve = items.filter(i => i.quadrant === 'improve').map(i => i.menuName)
  const hidden = items.filter(i => i.quadrant === 'hidden').map(i => i.menuName)
  const review = items.filter(i => i.quadrant === 'review').map(i => i.menuName)

  return `
あなたは飲食店専門のメニュー戦略コンサルタントです。
以下のメニューABC分析結果をもとに、具体的なアクションアドバイスを作成してください。

【店舗情報】
店名：${shop.name}
エリア：${shop.area}
業態：${shop.industry}
客単価：${shop.priceRange}

【分析結果】
⭐️ スター（注文多・利益率高）：${star.length > 0 ? star.join('、') : 'なし'}
🔧 要改善（注文多・利益率低）：${improve.length > 0 ? improve.join('、') : 'なし'}
💎 隠れた宝（注文少・利益率高）：${hidden.length > 0 ? hidden.join('、') : 'なし'}
⚠️ 見直し（注文少・利益率低）：${review.length > 0 ? review.join('、') : 'なし'}

以下の形式で、各象限への具体的なアクションを出力してください（前置き不要）：

===STAR===
スターメニューへの施策（SNS・推し出し・アップセル等）を2〜3文

===IMPROVE===
要改善メニューへの施策（値上げ幅・原価削減の具体案）を2〜3文。該当なしの場合は「該当メニューなし」

===HIDDEN===
隠れた宝への施策（メニュー表の位置変更・スタッフへの教育等）を2〜3文。該当なしの場合は「該当メニューなし」

===REVIEW===
見直しメニューへの施策（削除・リニューアル・限定化の具体案）を2〜3文。該当なしの場合は「該当メニューなし」

===OVERALL===
全体的な総評と優先して取り組むべき施策を3〜4文
===END===
`
}
