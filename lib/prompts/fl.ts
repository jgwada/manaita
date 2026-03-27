import { ShopProfile } from '@/types'
import { shopContext } from './helpers'

export function buildFlCommentPrompt(
  shopProfile: ShopProfile,
  year: number,
  month: number,
  revenue: number,
  foodCost: number,
  beverageCost: number,
  laborCost: number,
  flRatio: number,
  foodRatio: number,
  beverageRatio: number,
  laborRatio: number,
  prevFlRatio?: number | null
) {
  const diff = prevFlRatio != null ? flRatio - prevFlRatio : null
  const diffText = diff != null
    ? `先月比：${diff > 0 ? '+' : ''}${diff.toFixed(1)}pt（${diff > 0 ? '悪化' : '改善'}）`
    : ''

  return `あなたは飲食店経営の財務アドバイザーです。
以下のFLコスト分析結果をもとに、経営者への具体的なアドバイスを提供してください。

${shopContext(shopProfile)}

【${year}年${month}月のFLコスト分析】
売上：${revenue.toLocaleString('ja-JP')}円
フード仕入れ：${foodCost.toLocaleString('ja-JP')}円（原価率 ${foodRatio}%）
ビバレッジ仕入れ：${beverageCost.toLocaleString('ja-JP')}円（原価率 ${beverageRatio}%）
人件費：${laborCost.toLocaleString('ja-JP')}円（人件費率 ${laborRatio}%）
FL比率：${flRatio}%
${diffText}

【FL比率の目安】55%以下=優秀 / 55〜60%=適正 / 60%超=要改善

以下の順番で、箇条書きで簡潔にアドバイスしてください：
1. 今月の評価（FL比率・食材費・人件費それぞれ一言）
2. 食材費の改善ポイント（具体的に1〜2点）
3. 人件費の改善ポイント（具体的に1〜2点）
4. 来月の目標数値（FL比率・食材費率・人件費率）

飲食店経営者にわかりやすい言葉で、300文字以内にまとめてください。`
}
