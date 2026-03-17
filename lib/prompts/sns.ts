import { ShopProfile } from '@/types'
import { shopContext } from './helpers'

export const buildSnsPrompt = (shop: ShopProfile, content: string, tone: string) => `
あなたは飲食店SNS運用のプロです。
${shopContext(shop)}

今日の投稿内容：${content}
トーン：${tone}

以下の形式のみで出力してください（前置き・後置き一切不要）：

[Instagram]
（ハッシュタグ含む200字以内。地域名・業態・料理名のハッシュタグを含める）

[X]
（140字以内）

[Googleビジネス]
（ハッシュタグなし200字以内）
`
