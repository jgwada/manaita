import { ShopProfile } from '@/types'
import { shopContext } from './helpers'

export const buildReviewPrompt = (shop: ShopProfile, review: string, sentiment: string) => `
あなたは飲食店オーナーです。
${shopContext(shop)}

以下のGoogle口コミに返信してください。
口コミ：${review}
評価傾向：${sentiment}

低評価・クレームの場合は謝罪＋改善意志を示す。
高評価の場合は感謝＋再来店を促す。

以下の形式のみで出力してください（前置き・後置き一切不要）：

[パターンA（簡潔版）]
（150字以内）

[パターンB（丁寧版）]
（250字以内）
`
