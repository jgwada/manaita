import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Caveat, Kaushan_Script, Kiwi_Maru } from 'next/font/google'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-caveat',
})

const kaushanScript = Kaushan_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-kaushan',
})

const kiwiMaru = Kiwi_Maru({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-kiwi-maru',
})

export const metadata: Metadata = {
  title: 'I love 飲食店 - 飲食店経営サポートツール',
  description: '飲食店経営の「めんどくさい」をAIで10秒で解決',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${caveat.variable} ${kaushanScript.variable} ${kiwiMaru.variable} font-sans antialiased bg-[#F1F3F8]`}>
        {children}
      </body>
    </html>
  )
}
