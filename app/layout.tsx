import type { Metadata } from 'next'
import { Noto_Sans_JP, Oswald } from 'next/font/google'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-oswald',
})

export const metadata: Metadata = {
  title: 'Manaita - 飲食店経営サポートツール',
  description: '飲食店経営の「めんどくさい」をAIで10秒で解決',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${oswald.variable} font-sans antialiased bg-[#FFF9F5]`}>
        {children}
      </body>
    </html>
  )
}
