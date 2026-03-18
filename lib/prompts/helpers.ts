import { ShopProfile } from '@/types'

export const shopContext = (shop: ShopProfile) => `
店名：${shop.name}
地域：${shop.area}
業態：${shop.industry}
客単価：${shop.priceRange}
席数：${shop.seats}席
${shop.researchCache ? `\n【店舗リサーチ情報】\n${shop.researchCache}` : ''}
`
