import { ShopProfile } from '@/types'
import { shopContext, sanitizeInput } from './helpers'

export const buildRecruitPrompt = (shop: ShopProfile, type: string, conditions: string) => `
あなたは採用のプロです。
${shopContext(shop)}

募集種別：${sanitizeInput(type, 100)}
条件・アピールポイント：${sanitizeInput(conditions, 500)}

以下の形式のみで出力してください（前置き・後置き一切不要）：

[求人サイト用]
（見出し＋本文200字程度）

[SNS・チラシ用]
（キャッチー＋簡潔150字）

[面接誘導メッセージ]
（DM・LINE返信用50字程度）
`
