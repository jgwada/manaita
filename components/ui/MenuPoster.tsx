'use client'
import { forwardRef } from 'react'

// ─── THEMES ──────────────────────────────────────────────

export type MenuThemeKey =
  | 'snow' | 'noir' | 'cafe' | 'premium' | 'pop'
  | 'sage' | 'terracotta' | 'washoku' | 'french' | 'concrete'

interface MenuTheme {
  label: string
  colors: string[]
  panelBg: string
  nameFg: string
  priceFg: string
  descFg: string
  dividerColor: string
  fontFamily: string
  fontWeightName: number
  fontWeightPrice: number
  fontWeightDesc: number
  letterSpacingName: string
  letterSpacingPrice: string
  pricePrefix: string // ¥ or 円 etc
}

export const MENU_THEMES: Record<MenuThemeKey, MenuTheme> = {
  snow: {
    label: 'スノー',
    colors: ['#FFFFFF', '#111008', '#E8320A'],
    panelBg: '#FFFFFF',
    nameFg: '#111008',
    priceFg: '#E8320A',
    descFg: '#777777',
    dividerColor: '#E8320A',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightName: 700,
    fontWeightPrice: 900,
    fontWeightDesc: 400,
    letterSpacingName: '0.02em',
    letterSpacingPrice: '-0.02em',
    pricePrefix: '¥',
  },
  noir: {
    label: 'ノワール',
    colors: ['#111008', '#FFFFFF', '#AAAAAA'],
    panelBg: '#111008',
    nameFg: '#FFFFFF',
    priceFg: '#FFFFFF',
    descFg: '#888888',
    dividerColor: '#333333',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightName: 300,
    fontWeightPrice: 700,
    fontWeightDesc: 300,
    letterSpacingName: '0.08em',
    letterSpacingPrice: '0.02em',
    pricePrefix: '¥',
  },
  cafe: {
    label: 'カフェ',
    colors: ['#FAF7F2', '#2C1A0E', '#8B6F47'],
    panelBg: '#FAF7F2',
    nameFg: '#2C1A0E',
    priceFg: '#8B6F47',
    descFg: '#9A8070',
    dividerColor: '#D8CCBE',
    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
    fontWeightName: 500,
    fontWeightPrice: 400,
    fontWeightDesc: 300,
    letterSpacingName: '0.06em',
    letterSpacingPrice: '0.04em',
    pricePrefix: '¥',
  },
  premium: {
    label: 'プレミアム',
    colors: ['#0F1923', '#EDE8D5', '#C8A84B'],
    panelBg: '#0F1923',
    nameFg: '#EDE8D5',
    priceFg: '#C8A84B',
    descFg: '#7A8899',
    dividerColor: '#C8A84B',
    fontFamily: '"Hiragino Mincho ProN", Georgia, serif',
    fontWeightName: 400,
    fontWeightPrice: 600,
    fontWeightDesc: 300,
    letterSpacingName: '0.1em',
    letterSpacingPrice: '0.04em',
    pricePrefix: '¥',
  },
  pop: {
    label: 'ポップ',
    colors: ['#E8320A', '#FFFFFF', '#FFE600'],
    panelBg: '#E8320A',
    nameFg: '#FFFFFF',
    priceFg: '#FFE600',
    descFg: '#FFCCBB',
    dividerColor: '#FFFFFF',
    fontFamily: '"Arial Black", Impact, "Hiragino Kaku Gothic ProN", sans-serif',
    fontWeightName: 900,
    fontWeightPrice: 900,
    fontWeightDesc: 400,
    letterSpacingName: '-0.01em',
    letterSpacingPrice: '-0.02em',
    pricePrefix: '¥',
  },
  sage: {
    label: 'セージ',
    colors: ['#5C7A62', '#FFFFFF', '#D4E8C2'],
    panelBg: '#5C7A62',
    nameFg: '#FFFFFF',
    priceFg: '#D4E8C2',
    descFg: '#B0C8B4',
    dividerColor: '#4A6450',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightName: 600,
    fontWeightPrice: 700,
    fontWeightDesc: 300,
    letterSpacingName: '0.04em',
    letterSpacingPrice: '0.02em',
    pricePrefix: '¥',
  },
  terracotta: {
    label: 'テラコッタ',
    colors: ['#C4714A', '#FAF0E6', '#FFD9BF'],
    panelBg: '#C4714A',
    nameFg: '#FAF0E6',
    priceFg: '#FFD9BF',
    descFg: '#E8C4A8',
    dividerColor: '#A85A36',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightName: 700,
    fontWeightPrice: 800,
    fontWeightDesc: 400,
    letterSpacingName: '0.03em',
    letterSpacingPrice: '-0.01em',
    pricePrefix: '¥',
  },
  washoku: {
    label: '和',
    colors: ['#1C1208', '#F7F2E8', '#8B1A1A'],
    panelBg: '#1C1208',
    nameFg: '#F7F2E8',
    priceFg: '#C02020',
    descFg: '#9A8870',
    dividerColor: '#8B1A1A',
    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
    fontWeightName: 600,
    fontWeightPrice: 500,
    fontWeightDesc: 300,
    letterSpacingName: '0.12em',
    letterSpacingPrice: '0.08em',
    pricePrefix: '¥',
  },
  french: {
    label: 'フレンチ',
    colors: ['#5C1E2A', '#F5EFE6', '#D4A574'],
    panelBg: '#5C1E2A',
    nameFg: '#F5EFE6',
    priceFg: '#D4A574',
    descFg: '#C4A090',
    dividerColor: '#7A2E3A',
    fontFamily: '"Hiragino Mincho ProN", Georgia, serif',
    fontWeightName: 400,
    fontWeightPrice: 500,
    fontWeightDesc: 300,
    letterSpacingName: '0.08em',
    letterSpacingPrice: '0.06em',
    pricePrefix: '¥',
  },
  concrete: {
    label: 'コンクリート',
    colors: ['#4A4A4A', '#FFFFFF', '#BBBBBB'],
    panelBg: '#4A4A4A',
    nameFg: '#FFFFFF',
    priceFg: '#FFFFFF',
    descFg: '#AAAAAA',
    dividerColor: '#666666',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightName: 300,
    fontWeightPrice: 800,
    fontWeightDesc: 300,
    letterSpacingName: '0.12em',
    letterSpacingPrice: '-0.02em',
    pricePrefix: '¥',
  },
}

// ─── COMPONENT ───────────────────────────────────────────

export type MenuOrientation = 'portrait' | 'landscape'

type Props = {
  imageUrl: string | null
  orientation: MenuOrientation
  productName: string
  price: string
  description: string
  shopName?: string
  themeKey: MenuThemeKey
}

const MenuPoster = forwardRef<HTMLDivElement, Props>(({
  imageUrl, orientation, productName, price, description, shopName, themeKey,
}, ref) => {
  const t = MENU_THEMES[themeKey]
  const isPortrait = orientation === 'portrait'

  // A4サイズ（px）
  const W = isPortrait ? 595 : 842
  const H = isPortrait ? 842 : 595

  // 写真エリア vs テキストパネルの比率（写真を最大限使う）
  const PHOTO_RATIO = 0.68

  const photoW = isPortrait ? W : Math.round(W * PHOTO_RATIO)
  const photoH = isPortrait ? Math.round(H * PHOTO_RATIO) : H
  const panelW = isPortrait ? W : W - photoW
  const panelH = isPortrait ? H - photoH : H

  // フォントサイズ（パネルサイズに応じてスケール）
  const panelSize = isPortrait ? panelH : panelW // 利用可能な短辺
  const nameFontSize = isPortrait
    ? Math.min(42, Math.max(24, panelH * 0.16))
    : Math.min(38, Math.max(20, panelW * 0.12))
  const priceFontSize = isPortrait
    ? Math.min(52, Math.max(28, panelH * 0.18))
    : Math.min(44, Math.max(24, panelW * 0.14))
  const descFontSize = isPortrait
    ? Math.min(14, Math.max(10, panelH * 0.045))
    : Math.min(13, Math.max(9, panelW * 0.04))

  const px = (n: number) => `${Math.round(n)}px`

  return (
    <div
      ref={ref}
      style={{
        width: `${W}px`,
        height: `${H}px`,
        backgroundColor: t.panelBg,
        fontFamily: t.fontFamily,
        display: 'flex',
        flexDirection: isPortrait ? 'column' : 'row',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* 写真エリア */}
      <div style={{
        width: `${photoW}px`,
        height: `${photoH}px`,
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: '#1A1A1A',
      }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
            fontSize: '14px',
            letterSpacing: '0.05em',
          }}>
            写真をアップロード
          </div>
        )}
      </div>

      {/* テキストパネル */}
      <div style={{
        width: `${panelW}px`,
        height: `${panelH}px`,
        backgroundColor: t.panelBg,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isPortrait ? 'center' : 'center',
        padding: isPortrait
          ? `${px(panelH * 0.1)} ${px(panelH * 0.12)}`
          : `${px(panelW * 0.14)} ${px(panelW * 0.12)}`,
        boxSizing: 'border-box',
        gap: px(panelSize * 0.04),
      }}>

        {/* アクセントライン */}
        <div style={{
          width: px(panelSize * 0.14),
          height: '2px',
          backgroundColor: t.dividerColor,
          marginBottom: px(panelSize * 0.02),
        }} />

        {/* 商品名 */}
        <div style={{
          fontSize: px(nameFontSize),
          fontWeight: t.fontWeightName,
          color: t.nameFg,
          lineHeight: 1.25,
          letterSpacing: t.letterSpacingName,
          wordBreak: 'break-all',
        }}>
          {productName || '商品名'}
        </div>

        {/* 説明文 */}
        {description && (
          <div style={{
            fontSize: px(descFontSize),
            fontWeight: t.fontWeightDesc,
            color: t.descFg,
            lineHeight: 1.6,
            letterSpacing: '0.04em',
          }}>
            {description}
          </div>
        )}

        {/* 区切り線 */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: t.dividerColor,
          opacity: 0.4,
          margin: `${px(panelSize * 0.01)} 0`,
        }} />

        {/* 価格 */}
        <div style={{
          fontSize: px(priceFontSize),
          fontWeight: t.fontWeightPrice,
          color: t.priceFg,
          lineHeight: 1,
          letterSpacing: t.letterSpacingPrice,
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px',
        }}>
          <span style={{ fontSize: px(priceFontSize * 0.5), opacity: 0.8 }}>{t.pricePrefix}</span>
          {price || '0'}
        </div>

        {/* 店名 */}
        {shopName && (
          <div style={{
            fontSize: px(Math.max(8, descFontSize * 0.85)),
            fontWeight: t.fontWeightDesc,
            color: t.descFg,
            opacity: 0.6,
            letterSpacing: '0.06em',
            marginTop: px(panelSize * 0.04),
          }}>
            {shopName}
          </div>
        )}
      </div>
    </div>
  )
})

MenuPoster.displayName = 'MenuPoster'
export default MenuPoster
