import { ShopProfile } from '@/types'

export const buildPriceCheckPrompt = (
  shop: ShopProfile,
  menuName: string,
  price: number,
  category: string
): string => `
あなたは飲食業界の価格調査・コンサルタントです。
Web検索を使って「${shop.area}の${shop.industry}」における「${menuName}」の相場価格を調査し、自店の価格が適切かを判定してください。

【自店情報】
店名：${shop.name}
エリア：${shop.area}
業態：${shop.industry}
客単価帯：${shop.priceRange}
カテゴリ：${category || '未指定'}

【チェックするメニュー】
メニュー名：${menuName}
自店の価格：${price}円

【検索指示】
- 同じエリア・業態の競合店の「${menuName}」の価格を検索してください
- エリアが特定できない場合は全国の同業態の相場を参考にしてください
- 価格帯・ランク別（大衆〜高級）の幅を調査してください

【出力形式（この形式のみ・前置き後置き不要）】
===VERDICT===
高め または 適正 または 安め
===RANGE===
相場レンジ（例：600〜900円）
===REASON===
判定理由（3〜4文。調査結果の根拠を含めて）
===ADVICE===
価格設定へのアドバイス（2〜3文。具体的な改善提案や活用方法）
===END===
`
