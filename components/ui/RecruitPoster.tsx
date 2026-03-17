'use client'
import { forwardRef } from 'react'

// ─── THEME SYSTEM ────────────────────────────────────────

export type ThemeKey = 'yakiniku' | 'cafe' | 'izakaya' | 'italian' | 'washoku' | 'default'

interface Theme {
  posterBg: string
  headerBg: string
  headerFg: string
  accent: string
  accentFg: string
  bodyBg: string
  bodyFg: string
  bodyFgMuted: string
  chipBorder: string
  chipBg: string
  chipFg: string
  benefitBg: string
  benefitFg: string
  wageBoxBg: string
  wageBoxBorder: string
  wageFg: string
  footerDivider: string
  ctaBg: string
  ctaFg: string
  fontFamily: string
  fontWeightHero: number
  fontWeightSub: number
  fontWeightBody: number
  titleTracking: string
  bodyTracking: string
}

const THEMES: Record<ThemeKey, Theme> = {
  yakiniku: {
    posterBg: '#0A0A0A',
    headerBg: '#C41200',
    headerFg: '#FFFFFF',
    accent: '#E8320A',
    accentFg: '#FFFFFF',
    bodyBg: '#0A0A0A',
    bodyFg: '#FFFFFF',
    bodyFgMuted: '#888888',
    chipBorder: '#E8320A',
    chipBg: 'transparent',
    chipFg: '#FFFFFF',
    benefitBg: '#1C1C1C',
    benefitFg: '#FFFFFF',
    wageBoxBg: '#1A0000',
    wageBoxBorder: '#E8320A',
    wageFg: '#FF3311',
    footerDivider: '#2A2A2A',
    ctaBg: '#E8320A',
    ctaFg: '#FFFFFF',
    fontFamily: '"Arial Black", Impact, "Helvetica Neue", sans-serif',
    fontWeightHero: 900,
    fontWeightSub: 700,
    fontWeightBody: 400,
    titleTracking: '-0.02em',
    bodyTracking: '0.04em',
  },
  cafe: {
    posterBg: '#FAF7F2',
    headerBg: '#2C1A0E',
    headerFg: '#FAF7F2',
    accent: '#8B6F47',
    accentFg: '#FAF7F2',
    bodyBg: '#FAF7F2',
    bodyFg: '#2C1A0E',
    bodyFgMuted: '#9A8070',
    chipBorder: '#8B6F47',
    chipBg: 'transparent',
    chipFg: '#2C1A0E',
    benefitBg: '#F0E8DE',
    benefitFg: '#2C1A0E',
    wageBoxBg: '#FAF7F2',
    wageBoxBorder: '#8B6F47',
    wageFg: '#8B6F47',
    footerDivider: '#D8CCBE',
    ctaBg: '#2C1A0E',
    ctaFg: '#FAF7F2',
    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
    fontWeightHero: 400,
    fontWeightSub: 300,
    fontWeightBody: 300,
    titleTracking: '0.14em',
    bodyTracking: '0.08em',
  },
  izakaya: {
    posterBg: '#0E1520',
    headerBg: '#0A1018',
    headerFg: '#EDE8D5',
    accent: '#C8A84B',
    accentFg: '#0E1520',
    bodyBg: '#0E1520',
    bodyFg: '#EDE8D5',
    bodyFgMuted: '#7A8899',
    chipBorder: '#C8A84B',
    chipBg: 'transparent',
    chipFg: '#EDE8D5',
    benefitBg: '#1A2535',
    benefitFg: '#EDE8D5',
    wageBoxBg: '#1A2535',
    wageBoxBorder: '#C8A84B',
    wageFg: '#C8A84B',
    footerDivider: '#2A3545',
    ctaBg: '#C8A84B',
    ctaFg: '#0E1520',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightHero: 800,
    fontWeightSub: 600,
    fontWeightBody: 400,
    titleTracking: '0.04em',
    bodyTracking: '0.03em',
  },
  italian: {
    posterBg: '#F8F5EE',
    headerBg: '#2A4A1E',
    headerFg: '#F8F5EE',
    accent: '#2A4A1E',
    accentFg: '#F8F5EE',
    bodyBg: '#F8F5EE',
    bodyFg: '#1A3010',
    bodyFgMuted: '#8A9A7A',
    chipBorder: '#2A4A1E',
    chipBg: 'transparent',
    chipFg: '#1A3010',
    benefitBg: '#ECF0E6',
    benefitFg: '#1A3010',
    wageBoxBg: '#F8F5EE',
    wageBoxBorder: '#2A4A1E',
    wageFg: '#2A4A1E',
    footerDivider: '#D0D8C0',
    ctaBg: '#2A4A1E',
    ctaFg: '#F8F5EE',
    fontFamily: '"Hiragino Mincho ProN", Georgia, serif',
    fontWeightHero: 500,
    fontWeightSub: 400,
    fontWeightBody: 300,
    titleTracking: '0.06em',
    bodyTracking: '0.04em',
  },
  washoku: {
    posterBg: '#F7F2E8',
    headerBg: '#1C1208',
    headerFg: '#F7F2E8',
    accent: '#8B1A1A',
    accentFg: '#F7F2E8',
    bodyBg: '#F7F2E8',
    bodyFg: '#1C1208',
    bodyFgMuted: '#9A8870',
    chipBorder: '#8B1A1A',
    chipBg: 'transparent',
    chipFg: '#1C1208',
    benefitBg: '#EDE5D5',
    benefitFg: '#1C1208',
    wageBoxBg: '#F7F2E8',
    wageBoxBorder: '#8B1A1A',
    wageFg: '#8B1A1A',
    footerDivider: '#D8CCBA',
    ctaBg: '#1C1208',
    ctaFg: '#F7F2E8',
    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
    fontWeightHero: 600,
    fontWeightSub: 400,
    fontWeightBody: 300,
    titleTracking: '0.1em',
    bodyTracking: '0.06em',
  },
  default: {
    posterBg: '#FFFFFF',
    headerBg: '#111008',
    headerFg: '#FFFFFF',
    accent: '#E8320A',
    accentFg: '#FFFFFF',
    bodyBg: '#FFFFFF',
    bodyFg: '#111008',
    bodyFgMuted: '#9A8880',
    chipBorder: '#111008',
    chipBg: 'transparent',
    chipFg: '#111008',
    benefitBg: '#F5F5F3',
    benefitFg: '#111008',
    wageBoxBg: '#FFFFFF',
    wageBoxBorder: '#E8320A',
    wageFg: '#E8320A',
    footerDivider: '#E8E4E0',
    ctaBg: '#E8320A',
    ctaFg: '#FFFFFF',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeightHero: 900,
    fontWeightSub: 700,
    fontWeightBody: 400,
    titleTracking: '-0.02em',
    bodyTracking: '0.02em',
  },
}

export function detectTheme(industry: string): ThemeKey {
  if (!industry) return 'default'
  if (/焼肉|焼き肉|焼鳥|ホルモン|BBQ|バーベキュー|炭火|肉料理/.test(industry)) return 'yakiniku'
  if (/カフェ|珈琲|コーヒー|喫茶|ベーカリー|パン|スイーツ|ケーキ/.test(industry)) return 'cafe'
  if (/居酒屋|バー|酒場|ダイニングバー|パブ|クラブ|ナイト/.test(industry)) return 'izakaya'
  if (/イタリアン|フレンチ|洋食|ビストロ|パスタ|ピザ|スペイン|ワイン/.test(industry)) return 'italian'
  if (/和食|寿司|そば|うどん|日本料理|割烹|懐石|天ぷら|おでん|定食/.test(industry)) return 'washoku'
  return 'default'
}

// ─── DECORATIONS ────────────────────────────────────────

function YakinikuDecoration({ W, H }: { W: number; H: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* 斜めストライプ */}
      <svg width={W} height={H} style={{ position: 'absolute', opacity: 0.05 }}>
        <defs>
          <pattern id="stripes" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="rotate(45)">
            <rect width="40" height="80" fill="#E8320A" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#stripes)" />
      </svg>
      {/* 右下に巨大な「炎」 */}
      <div style={{
        position: 'absolute',
        bottom: -H * 0.12,
        right: -W * 0.05,
        fontSize: H * 0.55 + 'px',
        fontWeight: 900,
        color: '#E8320A',
        opacity: 0.05,
        lineHeight: 1,
        userSelect: 'none',
        fontFamily: 'serif',
      }}>炎</div>
      {/* ヘッダー下の太い斜線アクセント */}
      <div style={{
        position: 'absolute',
        top: H * 0.38,
        left: 0,
        width: W * 0.25,
        height: '4px',
        backgroundColor: '#E8320A',
        opacity: 0.6,
      }} />
    </div>
  )
}

function CafeDecoration({ W, H }: { W: number; H: number }) {
  const sc = W / 595
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* 内側の細枠 */}
      <div style={{
        position: 'absolute',
        top: 14 * sc,
        left: 14 * sc,
        right: 14 * sc,
        bottom: 14 * sc,
        border: `1px solid #8B6F47`,
        opacity: 0.18,
        pointerEvents: 'none',
      }} />
      {/* 右上 ボタニカルリーフ */}
      <svg
        style={{ position: 'absolute', top: 0, right: 0, opacity: 0.28 }}
        width={180 * sc} height={200 * sc} viewBox="0 0 180 200"
      >
        {/* 大きい葉 */}
        <path d="M160 5 C185 60 155 150 100 165 C115 100 140 50 160 5Z" fill="#8B6F47" />
        {/* 中葉 */}
        <path d="M140 8 C110 55 80 120 65 170 C90 120 125 60 140 8Z" fill="#6B5035" opacity="0.75" />
        {/* 小葉 */}
        <path d="M115 15 C130 50 120 90 100 110 C100 80 107 48 115 15Z" fill="#A88055" opacity="0.5" />
        {/* 茎 */}
        <path d="M100 165 Q95 180 90 200" stroke="#8B6F47" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* 小さいドット */}
        <circle cx="50" cy="80" r="3" fill="#8B6F47" opacity="0.25" />
        <circle cx="35" cy="120" r="2" fill="#8B6F47" opacity="0.18" />
        <circle cx="60" cy="150" r="2.5" fill="#8B6F47" opacity="0.2" />
      </svg>
      {/* 左下 ボタニカルリーフ（小） */}
      <svg
        style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.2 }}
        width={140 * sc} height={160 * sc} viewBox="0 0 140 160"
      >
        <path d="M20 150 C5 100 15 40 60 10 C55 60 40 110 20 150Z" fill="#8B6F47" />
        <path d="M35 155 C60 100 90 55 120 20 C85 65 55 110 35 155Z" fill="#6B5035" opacity="0.6" />
        <circle cx="100" cy="80" r="2.5" fill="#8B6F47" opacity="0.3" />
        <circle cx="80" cy="110" r="2" fill="#8B6F47" opacity="0.2" />
      </svg>
    </div>
  )
}

function IzakayaDecoration({ W, H }: { W: number; H: number }) {
  const sc = W / 595
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* ダイヤ型幾何学 右上 */}
      <svg style={{ position: 'absolute', top: 20 * sc, right: 20 * sc, opacity: 0.12 }}
        width={160 * sc} height={160 * sc} viewBox="0 0 160 160">
        <polygon points="80,5 155,80 80,155 5,80" fill="none" stroke="#C8A84B" strokeWidth="2" />
        <polygon points="80,25 135,80 80,135 25,80" fill="none" stroke="#C8A84B" strokeWidth="1.5" opacity="0.6" />
        <polygon points="80,50 110,80 80,110 50,80" fill="none" stroke="#C8A84B" strokeWidth="1" opacity="0.4" />
      </svg>
      {/* 水平ゴールドライン */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: H * 0.42,
        height: '1px',
        backgroundColor: '#C8A84B',
        opacity: 0.2,
      }} />
      {/* 右下 小ダイヤ */}
      <svg style={{ position: 'absolute', bottom: 30 * sc, right: 30 * sc, opacity: 0.08 }}
        width={80 * sc} height={80 * sc} viewBox="0 0 80 80">
        <polygon points="40,2 78,40 40,78 2,40" fill="none" stroke="#C8A84B" strokeWidth="2" />
      </svg>
    </div>
  )
}

function ItalianDecoration({ W, H }: { W: number; H: number }) {
  const sc = W / 595
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* オリーブ枝 右上 */}
      <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.22 }}
        width={160 * sc} height={200 * sc} viewBox="0 0 160 200">
        {/* 枝 */}
        <path d="M140 10 Q100 80 70 180" stroke="#2A4A1E" strokeWidth="2.5" fill="none" />
        {/* 葉1 */}
        <ellipse cx="125" cy="35" rx="18" ry="9" fill="#2A4A1E" transform="rotate(-35, 125, 35)" />
        {/* 葉2 */}
        <ellipse cx="108" cy="65" rx="16" ry="8" fill="#4A7A3A" transform="rotate(25, 108, 65)" />
        {/* 葉3 */}
        <ellipse cx="95" cy="95" rx="17" ry="8" fill="#2A4A1E" transform="rotate(-30, 95, 95)" />
        {/* 葉4 */}
        <ellipse cx="82" cy="125" rx="15" ry="7.5" fill="#4A7A3A" transform="rotate(20, 82, 125)" />
        {/* 葉5 */}
        <ellipse cx="73" cy="152" rx="14" ry="7" fill="#2A4A1E" transform="rotate(-25, 73, 152)" />
        {/* オリーブの実 */}
        <circle cx="118" cy="50" r="4" fill="#8B9A4A" opacity="0.7" />
        <circle cx="100" cy="80" r="3.5" fill="#8B9A4A" opacity="0.7" />
      </svg>
      {/* 左下 小枝 */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.15 }}
        width={120 * sc} height={140 * sc} viewBox="0 0 120 140">
        <path d="M20 130 Q55 70 100 20" stroke="#2A4A1E" strokeWidth="2" fill="none" />
        <ellipse cx="35" cy="108" rx="14" ry="7" fill="#2A4A1E" transform="rotate(40, 35, 108)" />
        <ellipse cx="55" cy="82" rx="13" ry="6.5" fill="#4A7A3A" transform="rotate(-30, 55, 82)" />
        <ellipse cx="75" cy="56" rx="12" ry="6" fill="#2A4A1E" transform="rotate(35, 75, 56)" />
      </svg>
    </div>
  )
}

function WashokuDecoration({ W, H }: { W: number; H: number }) {
  const sc = W / 595
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* 青海波 右上 */}
      <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.07 }}
        width={200 * sc} height={200 * sc} viewBox="0 0 200 200">
        {[0, 1, 2, 3].map(row =>
          [0, 1, 2, 3].map(col => {
            const cx = col * 50 + (row % 2 === 0 ? 0 : 25)
            const cy = row * 40
            return (
              <path
                key={`${row}-${col}`}
                d={`M${cx} ${cy + 40} A40 40 0 0 1 ${cx + 50} ${cy + 40}`}
                fill="none"
                stroke="#8B1A1A"
                strokeWidth="1.5"
              />
            )
          })
        )}
      </svg>
      {/* 縦の細線アクセント（左） */}
      <div style={{
        position: 'absolute',
        left: 24 * sc,
        top: H * 0.42,
        bottom: 24 * sc,
        width: '1px',
        backgroundColor: '#8B1A1A',
        opacity: 0.2,
      }} />
      {/* 水平細線（ヘッダー下） */}
      <div style={{
        position: 'absolute',
        left: 40 * sc,
        right: 40 * sc,
        top: H * 0.41,
        height: '1px',
        backgroundColor: '#8B1A1A',
        opacity: 0.25,
      }} />
    </div>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────

type Props = {
  shopName: string
  area: string
  industry: string
  type: string
  jobRoles?: string[]
  wage: string
  minDays: string
  selectedShifts: string[]
  activeToggles: string[]
  freeText: string
  siteText: string
  size: 'A4' | 'A3'
  themeKey?: ThemeKey
}

const RecruitPoster = forwardRef<HTMLDivElement, Props>(({
  shopName, area, industry, type, jobRoles = [], wage, minDays,
  selectedShifts, activeToggles, freeText, siteText, size,
  themeKey: themeKeyProp,
}, ref) => {
  const isA3 = size === 'A3'
  const W = isA3 ? 842 : 595
  const H = isA3 ? 1190 : 842
  const sc = W / 595   // スケール係数

  const themeKey = themeKeyProp ?? detectTheme(industry)
  const t = THEMES[themeKey]

  const wageLabel = type === '社員・正社員' ? '月給' : '時給'
  const conditionChips = [...(minDays ? [minDays] : []), ...selectedShifts]
  const siteLines = siteText.split('\n').filter(l => l.trim())
  const siteHeadline = siteLines[0] || ''
  const siteBody = siteLines.slice(1).join('\n').trim()

  const px = (n: number) => `${Math.round(n * sc)}px`

  return (
    <div
      ref={ref}
      style={{
        width: `${W}px`,
        height: `${H}px`,
        backgroundColor: t.posterBg,
        fontFamily: t.fontFamily,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* テーマ別デコレーション */}
      {themeKey === 'yakiniku' && <YakinikuDecoration W={W} H={H} />}
      {themeKey === 'cafe'     && <CafeDecoration W={W} H={H} />}
      {themeKey === 'izakaya'  && <IzakayaDecoration W={W} H={H} />}
      {themeKey === 'italian'  && <ItalianDecoration W={W} H={H} />}
      {themeKey === 'washoku'  && <WashokuDecoration W={W} H={H} />}

      {/* ─── HEADER ─── */}
      <div style={{
        backgroundColor: t.headerBg,
        padding: `${px(52)} ${px(56)} ${px(44)}`,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 募集種別バッジ */}
        {(() => {
          const isElegant = themeKey === 'cafe' || themeKey === 'washoku' || themeKey === 'italian'
          return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: isElegant ? 'transparent' : t.accent,
            color: isElegant ? t.headerFg : t.accentFg,
            fontSize: px(12),
            fontWeight: t.fontWeightSub,
            padding: `${px(4)} ${px(16)}`,
            letterSpacing: '0.1em',
            marginBottom: px(18),
            borderRadius: isElegant ? '0px' : '3px',
            border: isElegant ? `1px solid ${t.headerFg}` : 'none',
            opacity: isElegant ? 0.7 : 1,
          }}>
            {type}　募集
          </div>
          )
        })()}

        {/* メインタイトル */}
        <div style={{
          fontSize: themeKey === 'cafe' ? px(50) : px(64),
          fontWeight: t.fontWeightHero,
          color: t.headerFg,
          lineHeight: 1.05,
          letterSpacing: t.titleTracking,
          marginBottom: px(16),
        }}>
          {themeKey === 'cafe' || themeKey === 'washoku' || themeKey === 'italian'
            ? 'スタッフ募集'
            : <>スタッフ<br />募集中</>
          }
        </div>

        {/* 店名 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: px(10),
          marginTop: px(8),
        }}>
          <div style={{ width: px(28), height: '1.5px', backgroundColor: t.accent, flexShrink: 0 }} />
          <div style={{
            color: themeKey === 'yakiniku' ? t.accent : t.headerFg,
            fontSize: px(19),
            fontWeight: t.fontWeightSub,
            letterSpacing: t.bodyTracking,
            opacity: themeKey === 'yakiniku' ? 1 : 0.9,
          }}>
            {shopName}
          </div>
        </div>

        {area && (
          <div style={{
            color: t.headerFg,
            fontSize: px(10),
            marginTop: px(4),
            marginLeft: px(38),
            opacity: 0.5,
            letterSpacing: '0.06em',
          }}>
            {area}{industry ? `　${industry}` : ''}
          </div>
        )}
      </div>

      {/* ─── BODY ─── */}
      <div style={{
        backgroundColor: t.bodyBg,
        padding: `${px(32)} ${px(56)} ${px(40)}`,
        display: 'flex',
        flexDirection: 'column',
        gap: px(22),
        position: 'relative',
        zIndex: 1,
        flex: 1,
      }}>

        {/* 給与 */}
        {wage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: px(16),
            padding: `${px(20)} ${px(24)}`,
            backgroundColor: t.wageBoxBg,
            border: `2px solid ${t.wageBoxBorder}`,
            borderRadius: themeKey === 'yakiniku' ? '2px' : themeKey === 'cafe' ? '0px' : '6px',
          }}>
            <div style={{
              backgroundColor: t.accent,
              color: t.accentFg,
              fontSize: px(10),
              fontWeight: t.fontWeightSub,
              padding: `${px(3)} ${px(10)}`,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: themeKey === 'yakiniku' ? '2px' : '3px',
            }}>
              {wageLabel}
            </div>
            <div style={{
              fontSize: px(48),
              fontWeight: t.fontWeightHero,
              color: t.wageFg,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              ¥{wage}
              <span style={{ fontSize: px(20), fontWeight: t.fontWeightSub }}>〜</span>
            </div>
          </div>
        )}

        {/* 募集職種 */}
        {jobRoles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: px(8), alignItems: 'center' }}>
            <span style={{
              fontSize: px(10),
              fontWeight: t.fontWeightSub,
              color: t.bodyFgMuted,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}>募集職種</span>
            {jobRoles.map((role, i) => (
              <span key={i} style={{
                backgroundColor: t.accent,
                color: t.accentFg,
                fontSize: px(13),
                fontWeight: t.fontWeightSub,
                padding: `${px(4)} ${px(14)}`,
                letterSpacing: t.bodyTracking,
                borderRadius: themeKey === 'cafe' || themeKey === 'washoku' ? '0px' : '3px',
              }}>
                {role}
              </span>
            ))}
          </div>
        )}

        {/* 勤務条件チップ */}
        {conditionChips.length > 0 && (
          <div>
            <div style={{
              fontSize: px(9),
              fontWeight: t.fontWeightSub,
              color: t.bodyFgMuted,
              letterSpacing: '0.1em',
              marginBottom: px(8),
            }}>
              勤務条件
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: px(6) }}>
              {conditionChips.map((chip, i) => (
                <span key={i} style={{
                  border: `1.5px solid ${t.chipBorder}`,
                  backgroundColor: t.chipBg,
                  color: t.chipFg,
                  fontSize: px(12),
                  fontWeight: t.fontWeightSub,
                  padding: `${px(4)} ${px(12)}`,
                  letterSpacing: t.bodyTracking,
                  borderRadius: themeKey === 'cafe' || themeKey === 'washoku' ? '0px' : '3px',
                }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 待遇・福利厚生 */}
        {activeToggles.length > 0 && (
          <div>
            <div style={{
              fontSize: px(9),
              fontWeight: t.fontWeightSub,
              color: t.bodyFgMuted,
              letterSpacing: '0.1em',
              marginBottom: px(8),
            }}>
              待遇・福利厚生
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: px(6) }}>
              {activeToggles.map((tog, i) => (
                <span key={i} style={{
                  backgroundColor: t.benefitBg,
                  color: t.benefitFg,
                  fontSize: px(11),
                  fontWeight: t.fontWeightBody,
                  padding: `${px(4)} ${px(10)}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: px(4),
                  borderRadius: themeKey === 'cafe' || themeKey === 'washoku' ? '0px' : '3px',
                  letterSpacing: t.bodyTracking,
                }}>
                  <span style={{ color: t.accent, fontWeight: t.fontWeightSub, fontSize: px(10) }}>✓</span>
                  {tog}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PR文 */}
        {(siteHeadline || freeText) && (
          <div style={{
            borderLeft: `3px solid ${t.accent}`,
            paddingLeft: px(16),
          }}>
            {siteHeadline && (
              <div style={{
                fontSize: px(14),
                fontWeight: t.fontWeightSub,
                color: t.bodyFg,
                marginBottom: px(6),
                lineHeight: 1.4,
                letterSpacing: t.bodyTracking,
              }}>
                {siteHeadline}
              </div>
            )}
            {(siteBody || freeText) && (
              <div style={{
                fontSize: px(11),
                fontWeight: t.fontWeightBody,
                color: t.bodyFgMuted,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                letterSpacing: t.bodyTracking,
              }}>
                {[siteBody, freeText].filter(Boolean).join('\n')}
              </div>
            )}
          </div>
        )}

        {/* フッター */}
        <div style={{
          marginTop: 'auto',
          paddingTop: px(20),
          borderTop: `1px solid ${t.footerDivider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: px(9),
              color: t.bodyFgMuted,
              letterSpacing: '0.06em',
              marginBottom: px(3),
            }}>
              {area}{area && industry ? ' · ' : ''}{industry}
            </div>
            <div style={{
              fontSize: px(17),
              fontWeight: t.fontWeightSub,
              color: t.bodyFg,
              letterSpacing: t.bodyTracking,
            }}>
              {shopName}
            </div>
          </div>

          <div style={{
            backgroundColor: t.ctaBg,
            color: t.ctaFg,
            fontSize: px(12),
            fontWeight: t.fontWeightSub,
            padding: `${px(12)} ${px(24)}`,
            letterSpacing: t.bodyTracking,
            lineHeight: 1.4,
            textAlign: 'center',
            borderRadius: themeKey === 'cafe' || themeKey === 'washoku' ? '0px' : '4px',
          }}>
            お気軽に<br />ご応募ください
          </div>
        </div>
      </div>
    </div>
  )
})

RecruitPoster.displayName = 'RecruitPoster'
export default RecruitPoster
