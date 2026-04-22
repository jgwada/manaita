import { ShopProfile } from '@/types'

export const shopContext = (shop: ShopProfile) => `
店名：${shop.name}
地域：${shop.area}
業態：${shop.industry}
客単価：${shop.priceRange}
席数：${shop.seats}席
${shop.researchCache ? `\n【店舗リサーチ情報】\n${shop.researchCache}` : ''}
`

/**
 * ユーザー入力のサニタイズ（プロンプトインジェクション対策）
 * - 入力長を maxLen 文字に切り詰め
 * - 「指示を無視して」などのインジェクション定型句を除去
 */
export const sanitizeInput = (input: string, maxLen = 500): string => {
  return input
    .slice(0, maxLen)
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi, '[無効]')
    .replace(/system\s*prompt/gi, '[無効]')
    .replace(/\bDAN\b/g, '[無効]')
    .replace(/以下の(指示|命令|プロンプト)を(無視|忘れ)/g, '[無効]')
    .replace(/あなたは.{0,20}(ではなく|を無視して)/g, '[無効]')
}
