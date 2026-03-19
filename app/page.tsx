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
  MessageSquare, MessageCircle, FileText, MapPin,
  Zap, Newspaper
} from 'lucide-react'

const phase1Tools = [
  { icon: Instagram, name: 'SNS投稿文', description: 'Instagram・X・Google用の投稿文を10秒で生成', href: '/tools/sns', gradient: 'from-pink-400 to-rose-500' },
  { icon: Star, name: 'Google口コミ返信', description: '高評価・低評価どちらにも最適な返信文を生成', href: '/tools/review', gradient: 'from-yellow-400 to-orange-500' },
  { icon: Users, name: '求人票・募集文', description: 'アルバイト・社員・シフト募集の文章を自動作成', href: '/tools/recruit', disabled: true, gradient: 'from-violet-400 to-purple-500' },
  { icon: Wine, name: '宴会プラン提案', description: '忘年会・新年会などの提案書を瞬時に作成', href: '/tools/banquet', gradient: 'from-orange-400 to-red-500' },
  { icon: Star, name: '満足度アンケートメーカー', description: '高評価客をGoogleへ誘導・不満はダッシュボードに集約', href: '/dashboard', gradient: 'from-emerald-400 to-teal-500' },
  { icon: MapPin, name: 'Google情報メーカー', description: 'GoogleマップURLからPlace IDを自動取得', href: '/tools/google-info', gradient: 'from-blue-400 to-cyan-500' },
  { icon: Newspaper, name: '飲食ニュース', description: '外食・農業・水産業界の最新情報を毎朝自動更新', href: '/tools/news', gradient: 'from-blue-400 to-indigo-500' },
]

const phase2Tools = [
  { icon: FileText, name: 'メニュー表・POP', description: '料理のキャッチコピーと説明文を自動生成', href: '/tools/menu', disabled: true, gradient: 'from-orange-400 to-amber-500' },
  { icon: BookOpen, name: 'スタッフマニュアル', description: '接客・オープン・クローズ作業のマニュアルを作成', href: '/tools/manual', gradient: 'from-indigo-400 to-blue-500' },
  { icon: BarChart2, name: '日報・売上レポート', description: '今日の状況を入力するだけで日報を自動生成', href: '/tools/report', disabled: true, gradient: 'from-green-400 to-emerald-500' },
  { icon: TrendingUp, name: 'メニューABC分析', description: '売れ筋・利益貢献メニューを自動で分類・分析', href: '/tools/abc', disabled: true, gradient: 'from-cyan-400 to-teal-500' },
  { icon: DollarSign, name: '原価計算', description: '食材費から原価率を自動計算してアドバイス', href: '/tools/cost', disabled: true, gradient: 'from-lime-400 to-green-500' },
  { icon: Calculator, name: 'FLコスト計算', description: '食材費＋人件費の比率を業界標準と比較', href: '/tools/fl', disabled: true, gradient: 'from-orange-400 to-red-500' },
  { icon: Calendar, name: '集客カレンダー', description: '月ごとの商戦・イベントと施策アドバイスを表示', href: '/tools/calendar', disabled: true, gradient: 'from-purple-400 to-pink-500' },
  { icon: UserCheck, name: '常連客管理', description: '来店頻度を記録・長期来店なしの顧客をアラート', href: '/tools/customers', disabled: true, gradient: 'from-rose-400 to-pink-500' },
]

const phase3Tools = [
  { icon: Search, name: '競合リサーチ', description: '業態・地域の競合傾向と差別化ポイントをAIが分析', href: '/tools/research', gradient: 'from-violet-400 to-indigo-500' },
  { icon: MessageSquare, name: '集客戦略アドバイザー', description: '宴会・集客・SNS戦略をAIとチャットで相談', href: '/tools/advisor', gradient: 'from-blue-400 to-violet-500' },
  { icon: MessageCircle, name: 'なんでも経営相談', description: '経営の悩みをなんでも気軽に相談できるAI', href: '/tools/chat', gradient: 'from-orange-400 to-red-500' },
  { icon: Tag, name: '価格相場チェッカー', description: 'メニューの価格が高め・適正・安めかをAIが判定', href: '/tools/price', disabled: true, gradient: 'from-amber-400 to-orange-500' },
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
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* 店舗バナー */}
          {shopProfile?.name && (
            <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg shadow-orange-200">
              <div>
                <p className="text-xs text-orange-100 font-medium">現在の店舗</p>
                <p className="font-bold text-white text-lg leading-tight">{shopProfile.name}</p>
                <p className="text-xs text-orange-100 mt-0.5">{shopProfile.area} · {shopProfile.industry}</p>
              </div>
              <button
                onClick={() => router.push('/setup')}
                className="text-xs bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1.5 transition-colors backdrop-blur-sm"
              >
                設定
              </button>
            </div>
          )}

          <Section title="Phase 1" subtitle="営業で今すぐ使える" tools={phase1Tools} />
          <Section title="Phase 2" subtitle="毎日使う経営ツール" tools={phase2Tools} />
          <Section title="Phase 3" subtitle="差別化・戦略ツール" tools={phase3Tools} />
        </div>
      </div>
    </AuthGuard>
  )
}

type Tool = {
  icon: ComponentType<{ size?: number; className?: string }>
  name: string
  description: string
  href: string
  disabled?: boolean
  gradient?: string
}

function Section({ title, subtitle, tools }: { title: string; subtitle: string; tools: Tool[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500">
          <Zap size={12} className="text-white" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#E8320A] uppercase tracking-widest">{title}</span>
          <span className="text-xs text-[#6B7280] ml-2">{subtitle}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </div>
  )
}
