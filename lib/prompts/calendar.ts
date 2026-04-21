import { ShopProfile } from '@/types'

export const buildCalendarEventsPrompt = (
  shop: ShopProfile,
  year: number,
  month: number
): string => {
  const monthStr = `${year}年${month}月`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return `
あなたは地域の集客イベントリサーチの専門家です。
Web検索を使って「${shop.area}」周辺で${monthStr}〜${nextYear}年${nextMonth}月初旬に開催される、**飲食店の集客に影響する大型・中型イベント**を調査してください。

【調査エリア】
メインエリア：${shop.area}
業態：${shop.industry}（客単価：${shop.priceRange}）

【必ず含めるイベント種別】
✅ 地域の大型祭り・花火大会
✅ フェス・野外ライブ・音楽イベント
✅ マルシェ・朝市（継続開催も含む）
✅ スポーツ大会・マラソン・駅伝
✅ 花見・紅葉など季節の観光集中期
✅ 年末年始・お盆などの特需期
✅ 大型商業施設・観光地のイベント

【絶対に除外するもの】
❌ 個店・小規模店舗のセール
❌ 企業の採用説明会・研修
❌ マンション・不動産の販売会
❌ 規模不明の小さなワークショップ
❌ 飲食店の集客にほぼ影響しないイベント

【出力形式（JSONのみ・前置き不要）】
[
  {
    "date": "YYYY-MM-DD",
    "title": "イベント名",
    "description": "概要（1〜2文、開催場所・規模・特徴）",
    "scale": "large" または "medium",
    "category": "祭り" または "フェス" または "マルシェ" または "スポーツ" または "花火" または "観光" または "季節" または "その他",
    "impact": "集客への影響を1文で（例：周辺エリアへの来訪者が増加、打ち上げ需要が期待できる）"
  }
]

※ scale: large = 数千人〜数万人規模、medium = 数百〜数千人規模
※ 確認できたイベントのみ記載（情報が不確かなものは除外）
※ 見つからない場合は空配列 [] を返す
`
}
