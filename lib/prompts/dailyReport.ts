import { ShopProfile } from '@/types'
import { shopContext, sanitizeInput } from './helpers'

export function buildDailyReportPrompt(
  shopProfile: ShopProfile,
  date: string,
  lunchSales: number | null,
  dinnerSales: number | null,
  lunchCustomers: number | null,
  dinnerCustomers: number | null,
  weatherCondition: string | null,
  temperature: number | null,
  tempVsAvg: number | null,
  memo: string
) {
  const safeMemo = sanitizeInput(memo, 500)
  const totalSales = (lunchSales ?? 0) + (dinnerSales ?? 0)
  const totalCustomers = (lunchCustomers ?? 0) + (dinnerCustomers ?? 0)
  const avgSpend = totalCustomers > 0 ? Math.round(totalSales / totalCustomers) : null

  const lunchLine = lunchSales != null
    ? `ランチ：売上 ${lunchSales.toLocaleString('ja-JP')}円${lunchCustomers != null ? `・客数 ${lunchCustomers}名` : ''}`
    : 'ランチ：データなし'
  const dinnerLine = dinnerSales != null
    ? `ディナー：売上 ${dinnerSales.toLocaleString('ja-JP')}円${dinnerCustomers != null ? `・客数 ${dinnerCustomers}名` : ''}`
    : 'ディナー：データなし'

  const weatherLine = weatherCondition
    ? `天気：${weatherCondition}${temperature != null ? `・気温 ${temperature}℃` : ''}${tempVsAvg != null ? `（平年比 ${tempVsAvg > 0 ? '+' : ''}${tempVsAvg}℃）` : ''}`
    : ''

  return `あなたは飲食店の敏腕店長です。以下の営業データをもとに、今日の日報を作成してください。

${shopContext(shopProfile)}

【${date}の営業データ】
${lunchLine}
${dinnerLine}
合計売上：${totalSales.toLocaleString('ja-JP')}円
合計客数：${totalCustomers}名
${avgSpend != null ? `客単価：${avgSpend.toLocaleString('ja-JP')}円` : ''}
${weatherLine}
${safeMemo ? `\n【メモ・特記事項】\n${safeMemo}` : ''}

以下の構成で日報を作成してください（全体400文字以内）：

1. 今日の総括（売上・客数への一言コメント）
2. ランチ・ディナー別の振り返り（各1〜2行）
3. 天気・気温が集客に与えた影響（データがある場合のみ）
4. 明日への改善・注力ポイント（1〜2点）

経営者が明日の営業に活かせる、具体的で前向きな内容にしてください。`
}
