'use client'

import { useEffect, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import ToolCard from '@/components/ui/ToolCard'
import {
  Instagram, Star, Users, Wine, BarChart2,
  BookOpen, TrendingUp, DollarSign, Calculator,
  Calendar, UserCheck, Search, Tag,
  MessageSquare, MessageCircle, FileText
} from 'lucide-react'

const phase1Tools = [
  { icon: Instagram, name: 'SNS投稿文', description: 'Instagram・X・Googleビジネス用の投稿文を10秒で生成', href: '/tools/sns' },
  { icon: Star, name: 'Google口コミ返信', description: '高評価・低評価どちらの口コミにも最適な返信文を生成', href: '/tools/review' },
  { icon: Users, name: '求人票・募集文', description: 'アルバイト・社員・シフト募集の文章を自動作成', href: '/tools/recruit' },
  { icon: Wine, name: '宴会プラン提案', description: '忘年会・新年会などの提案書を瞬時に作成', href: '/tools/banquet' },
  { icon: Star, name: '満足度アンケートメーカー', description: '高評価客をGoogleへ誘導・不満はダッシュボードに集約', href: '/dashboard' },
]

const phase2Tools = [
  { icon: FileText, name: 'メニュー表・POP', description: '料理のキャッチコピーと説明文を自動生成', href: '/tools/menu' },
  { icon: BookOpen, name: 'スタッフマニュアル', description: '接客・オープン・クローズ作業のマニュアルを作成', href: '/tools/manual' },
  { icon: BarChart2, name: '日報・売上レポート', description: '今日の状況を入力するだけで日報を自動生成', href: '/tools/report', disabled: true },
  { icon: TrendingUp, name: 'メニューABC分析', description: '売れ筋・利益貢献メニューを自動で分類・分析', href: '/tools/abc', disabled: true },
  { icon: DollarSign, name: '原価計算', description: '食材費から原価率を自動計算してアドバイス', href: '/tools/cost', disabled: true },
  { icon: Calculator, name: 'FLコスト計算', description: '食材費＋人件費の比率を業界標準と比較', href: '/tools/fl', disabled: true },
  { icon: Calendar, name: '集客カレンダー', description: '月ごとの商戦・イベントと施策アドバイスを表示', href: '/tools/calendar', disabled: true },
  { icon: UserCheck, name: '常連客管理', description: '来店頻度を記録・長期来店なしの顧客をアラート', href: '/tools/customers', disabled: true },
]

const phase3Tools = [
  { icon: Search, name: '競合リサーチ', description: '業態・地域の競合傾向と差別化ポイントをAIが分析', href: '/tools/research' },
  { icon: MessageSquare, name: '集客戦略アドバイザー', description: '宴会・集客・SNS戦略をAIとチャットで相談', href: '/tools/advisor' },
  { icon: MessageCircle, name: 'なんでも経営相談', description: '経営の悩みをなんでも気軽に相談できるAI', href: '/tools/chat' },
  { icon: Tag, name: '価格相場チェッカー', description: 'メニューの価格が高め・適正・安めかをAIが判定', href: '/tools/price', disabled: true },
]

export default function HomePage() {
  const router = useRouter()
  const { shopProfile, user } = useAppStore()

  useEffect(() => {
    if (user && user.role === 'shop' && shopProfile && !shopProfile.name) {
      router.push('/setup')
    }
  }, [user, shopProfile, router])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">

          {shopProfile?.name && (
            <div className="mb-6 bg-white border border-[#EDE5DF] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9A8880]">現在の店舗</p>
                <p className="font-bold text-[#111008]">{shopProfile.name}</p>
                <p className="text-xs text-[#9A8880]">{shopProfile.area} · {shopProfile.industry}</p>
              </div>
              <button onClick={() => router.push('/setup')} className="text-xs text-[#E8320A] hover:underline">
                店舗プロフィール設定
              </button>
            </div>
          )}

          <Section title="Phase 1 · 営業で今すぐ使える" tools={phase1Tools} />
          <Section title="Phase 2 · 毎日使う経営ツール" tools={phase2Tools} />
          <Section title="Phase 3 · 差別化・戦略ツール" tools={phase3Tools} />
        </div>
      </div>
    </AuthGuard>
  )
}

type Tool = { icon: ComponentType<{ size?: number; className?: string }>; name: string; description: string; href: string; disabled?: boolean }

function Section({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-bold text-[#9A8880] uppercase tracking-widest mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </div>
  )
}
