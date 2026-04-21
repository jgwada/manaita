'use client'

import { useEffect, useState, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import ToolCard from '@/components/ui/ToolCard'
import {
  Instagram, Star, Users, Wine, BarChart2,
  BookOpen, TrendingUp, Calculator,
  Calendar, Search, Tag,
  MessageSquare, MessageCircle, MapPin,
  Zap, Newspaper, Rocket, Bell, CheckSquare, Square, Plus, Trash2, X
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
  { icon: BookOpen, name: 'スタッフマニュアル', description: '接客・オープン・クローズ作業のマニュアルを作成', href: '/tools/manual', gradient: 'from-indigo-400 to-blue-500' },
  { icon: BarChart2, name: '日報・売上レポート', description: '今日の状況を入力するだけで日報を自動生成', href: '/tools/report', gradient: 'from-green-400 to-emerald-500' },
  { icon: TrendingUp, name: 'メニューABC分析', description: '売れ筋・利益貢献メニューを自動で分類・分析', href: '/tools/abc', disabled: true, gradient: 'from-cyan-400 to-teal-500' },
  { icon: Calculator, name: 'FLコスト計算', description: '食材費＋人件費の比率を業界標準と比較', href: '/tools/fl', gradient: 'from-orange-400 to-red-500' },
  { icon: Calendar, name: '集客カレンダー', description: '月ごとの商戦・イベントと施策アドバイスを表示', href: '/tools/calendar', disabled: true, gradient: 'from-purple-400 to-pink-500' },
]

const phase3Tools = [
  { icon: Search, name: '競合リサーチ', description: '業態・地域の競合傾向と差別化ポイントをAIが分析', href: '/tools/research', gradient: 'from-violet-400 to-indigo-500' },
  { icon: MessageSquare, name: '集客戦略アドバイザー', description: '宴会・集客・SNS戦略をAIとチャットで相談', href: '/tools/advisor', gradient: 'from-blue-400 to-violet-500' },
  { icon: MessageCircle, name: 'なんでも経営相談', description: '経営の悩みをなんでも気軽に相談できるAI', href: '/tools/chat', gradient: 'from-orange-400 to-red-500' },
  { icon: Tag, name: '価格相場チェッカー', description: 'メニューの価格が高め・適正・安めかをAIが判定', href: '/tools/price', disabled: true, gradient: 'from-amber-400 to-orange-500' },
]

const getStarterTools = (hasResearch: boolean) => [
  { icon: Instagram, name: 'SNS投稿文', href: '/tools/sns', gradient: 'from-pink-400 to-rose-500' },
  { icon: Star, name: 'Google口コミ返信', href: '/tools/review', gradient: 'from-yellow-400 to-orange-500' },
  ...(hasResearch ? [{ icon: MessageSquare, name: '集客アドバイザー', href: '/tools/advisor', gradient: 'from-blue-400 to-violet-500' }] : []),
  { icon: MessageCircle, name: 'なんでも経営相談', href: '/tools/chat', gradient: 'from-orange-400 to-red-500' },
]

const TOOL_INFO: Record<string, { icon: ComponentType<{ size?: number; className?: string }>; name: string; href: string; gradient: string }> = {
  sns: { icon: Instagram, name: 'SNS投稿文', href: '/tools/sns', gradient: 'from-pink-400 to-rose-500' },
  review: { icon: Star, name: 'Google口コミ返信', href: '/tools/review', gradient: 'from-yellow-400 to-orange-500' },
  'banquet-gen': { icon: Wine, name: '宴会プラン提案', href: '/tools/banquet', gradient: 'from-orange-400 to-red-500' },
  research: { icon: Search, name: '競合リサーチ', href: '/tools/research', gradient: 'from-violet-400 to-indigo-500' },
  'advisor-research': { icon: Search, name: '競合リサーチ', href: '/tools/research', gradient: 'from-violet-400 to-indigo-500' },
  advisor: { icon: MessageSquare, name: '集客アドバイザー', href: '/tools/advisor', gradient: 'from-blue-400 to-violet-500' },
  chat: { icon: MessageCircle, name: '経営相談AI', href: '/tools/chat', gradient: 'from-orange-400 to-red-500' },
  manual: { icon: BookOpen, name: 'スタッフマニュアル', href: '/tools/manual', gradient: 'from-indigo-400 to-blue-500' },
  recruit: { icon: Users, name: '求人票・募集文', href: '/tools/recruit', gradient: 'from-violet-400 to-purple-500' },
}

const NUDGE_RULES = [
  { tool: 'sns', message: 'SNS投稿文を今週まだ作っていません', href: '/tools/sns', days: 7 },
  { tool: 'review', message: 'Google口コミへの返信を確認しましょう', href: '/tools/review', days: 14 },
  { tool: 'advisor', message: '集客戦略を見直す時期かもしれません', href: '/tools/advisor', days: 30 },
]

type ActionRecord = { id: string; content: string; done: boolean; created_at: string }

export default function HomePage() {
  const router = useRouter()
  const { shopProfile, user } = useAppStore()

  const [toolCounts, setToolCounts] = useState<Record<string, number>>({})
  const [lastUsed, setLastUsed] = useState<Record<string, string>>({})
  const [usageLoaded, setUsageLoaded] = useState(false)
  const [actions, setActions] = useState<ActionRecord[]>([])
  const [actionInput, setActionInput] = useState('')
  const [addingAction, setAddingAction] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (user && user.role === 'shop' && shopProfile && !shopProfile.name) {
      router.push('/setup')
    }
  }, [user, shopProfile, router])

  useEffect(() => {
    if (!shopProfile?.id) return
    fetch(`/api/my-usage?shopId=${shopProfile.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setToolCounts(d.toolCounts); setLastUsed(d.lastUsed) }
        setUsageLoaded(true)
      })
    fetch(`/api/actions?shopId=${shopProfile.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setActions(d.data) })
  }, [shopProfile?.id])

  const addAction = async () => {
    const content = actionInput.trim()
    if (!content || !shopProfile?.id || addingAction) return
    setAddingAction(true)
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shopProfile.id, content }),
    })
    const json = await res.json()
    if (json.success) {
      setActions(prev => [json.data, ...prev])
      setActionInput('')
    }
    setAddingAction(false)
  }

  const toggleAction = async (id: string, done: boolean) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done } : a))
    await fetch('/api/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    })
  }

  const deleteAction = async (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/actions?id=${id}`, { method: 'DELETE' })
  }

  // ナッジ：新規ユーザー or 一定日数使っていないツール
  const isNewUser = usageLoaded &&
    Object.keys(toolCounts).length === 0 &&
    shopProfile?.createdAt &&
    (Date.now() - new Date(shopProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24) >= 3

  const nudge = !nudgeDismissed ? (
    isNewUser
      ? { message: 'まずSNS投稿文やGoogle口コミ返信を試してみましょう！', href: '/tools/sns' }
      : NUDGE_RULES.find(rule => {
          const last = lastUsed[rule.tool]
          if (!last) return false
          const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
          return daysSince >= rule.days
        }) ?? null
  ) : null

  // よく使う機能：利用回数上位（重複を排除してhref単位で表示）
  const topTools = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tool]) => TOOL_INFO[tool])
    .filter(Boolean)
    .filter((info, i, arr) => arr.findIndex(x => x.href === info.href) === i)
    .slice(0, 4)

  const hasUsageData = topTools.length >= 2
  const hasResearch = !!shopProfile?.researchCache
  const starterTools = getStarterTools(hasResearch)

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

          {/* ナッジ */}
          {nudge && shopProfile?.name && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bell size={14} className="text-orange-500 flex-shrink-0" />
                <p className="text-sm text-[#111827] truncate">{nudge.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(nudge.href)}
                  className="text-xs font-bold text-[#E8320A] whitespace-nowrap hover:underline"
                >
                  使う →
                </button>
                <button onClick={() => setNudgeDismissed(true)} className="text-[#C4C9D4] hover:text-[#6B7280] transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* まずここから / よく使う機能 */}
          {shopProfile?.name && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500">
                  {hasUsageData ? <TrendingUp size={12} className="text-white" /> : <Rocket size={12} className="text-white" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#E8320A] uppercase tracking-widest">
                    {hasUsageData ? 'よく使う機能' : 'まずここから'}
                  </span>
                  <span className="text-xs text-[#6B7280] ml-2">
                    {hasUsageData ? 'よく使うツールのショートカット' : 'おすすめの使い始め方'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {hasUsageData
                  ? topTools.map(info => (
                      <ToolCard key={info.href} icon={info.icon} name={info.name} href={info.href} gradient={info.gradient} description="" />
                    ))
                  : starterTools.map((tool) => (
                      <ToolCard key={tool.href} {...tool} description="" />
                    ))
                }
              </div>
            </div>
          )}

          {/* 施策メモ */}
          {shopProfile?.name && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500">
                  <CheckSquare size={12} className="text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#E8320A] uppercase tracking-widest">施策メモ</span>
                  <span className="text-xs text-[#6B7280] ml-2">実行したい施策を記録</span>
                </div>
              </div>
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
                {actions.length === 0 && (
                  <p className="text-xs text-[#9A8880] text-center py-2 mb-2">
                    施策がありません。アドバイザーに相談した後、実行する施策をメモしましょう。
                  </p>
                )}
                {actions.filter(a => !a.done).map(action => (
                  <div key={action.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#F1F3F8] last:border-0">
                    <button onClick={() => toggleAction(action.id, true)} className="flex-shrink-0">
                      <Square size={16} className="text-[#9A8880]" />
                    </button>
                    <p className="text-sm flex-1 leading-snug text-[#111827]">{action.content}</p>
                    <button onClick={() => deleteAction(action.id)} className="flex-shrink-0 text-[#E5E9F2] hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {actions.some(a => a.done) && (
                  <button
                    onClick={() => setShowCompleted(v => !v)}
                    className="text-xs text-[#9A8880] hover:text-[#6B7280] mt-2 mb-1 transition-colors"
                  >
                    {showCompleted ? '▲ 完了済みを隠す' : `▼ 完了済み ${actions.filter(a => a.done).length}件を表示`}
                  </button>
                )}
                {showCompleted && actions.filter(a => a.done).map(action => (
                  <div key={action.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#F1F3F8] last:border-0">
                    <button onClick={() => toggleAction(action.id, false)} className="flex-shrink-0">
                      <CheckSquare size={16} className="text-green-500" />
                    </button>
                    <p className="text-sm flex-1 leading-snug line-through text-[#9A8880]">{action.content}</p>
                    <button onClick={() => deleteAction(action.id)} className="flex-shrink-0 text-[#E5E9F2] hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <input
                    value={actionInput}
                    onChange={e => setActionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAction()}
                    placeholder="施策を入力して Enter..."
                    className="flex-1 text-sm text-[#111827] placeholder-[#9A8880] border border-[#E5E9F2] rounded-lg px-3 py-2 focus:outline-none focus:border-[#E8320A]"
                  />
                  <button
                    onClick={addAction}
                    disabled={addingAction || !actionInput.trim()}
                    className="bg-[#E8320A] text-white rounded-lg px-3 py-2 hover:bg-[#c92b09] transition-colors disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
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
