import { ShopProfile } from '@/types'
import { shopContext, sanitizeInput } from './helpers'

export const buildManualPrompt = (shop: ShopProfile, type: string, rules: string) => {
  const safeType = sanitizeInput(type, 100)
  const safeRules = sanitizeInput(rules, 500)
  return `
あなたは飲食店の研修担当ベテランです。
${shopContext(shop)}

マニュアル種類：${safeType}
店独自のルール・特記事項：${safeRules || 'なし'}

以下の形式のみで出力してください（前置き・後置き一切不要）：

[チェックリスト]
（番号付きで、具体的な手順・確認項目を10〜15項目。実際に印刷して使えるレベルの詳しさで）

[新人向け説明文]
（このマニュアルの目的・大事なポイントをわかりやすく120字程度で。新人が読んで安心できるトーンで）
`
}
