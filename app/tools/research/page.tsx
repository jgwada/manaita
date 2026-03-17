'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Copy, CheckCircle } from 'lucide-react'

const SECTIONS = [
  { key: '1', title: '周辺の競合店', emoji: '🏪' },
  { key: '2', title: '競合の強み', emoji: '💪' },
  { key: '3', title: '自店の勝てるポイント', emoji: '⭐' },
  { key: '4', title: '競合に勝つための施策', emoji: '🎯' },
  { key: '5', title: '競合が使っている広告媒体・掲載先', emoji: '📣' },
]

function parseSections(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  SECTIONS.forEach(({ key }, i) => {
    const nextKey = SECTIONS[i + 1]?.key
    const pattern = new RegExp(
      `【${key}\\.[^】]*】([\\s\\S]*?)${nextKey ? `(?=【${nextKey}\\.)` : '$'}`
    )
    const match = raw.match(pattern)
    if (match) result[key] = match[1].trim()
  })
  return result
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-xs text-[#9A8880] border border-[#EDE5DF] bg-white rounded-lg px-2.5 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors"
    >
      {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? 'コピー済' : 'コピー'}
    </button>
  )
}

// テキストを行単位で解析してJSXに変換
function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) {
      i++
      continue
    }

    // 【見出し】パターン
    if (/^【.+】/.test(line)) {
      elements.push(
        <div key={i} className="mt-4 mb-2 first:mt-0">
          <span className="inline-block text-xs font-bold text-[#E8320A] bg-red-50 border border-red-100 rounded-md px-2 py-0.5">
            {line.replace(/^【|】$/g, '')}
          </span>
        </div>
      )
      i++
      continue
    }

    // ▼ や ■ などの小見出しパターン（行が短く末尾が：で終わる）
    if (/^[▼■◆●▶]/.test(line) || (line.endsWith('：') && line.length < 30)) {
      elements.push(
        <p key={i} className="mt-3 mb-1 text-sm font-bold text-[#111008]">
          {line}
        </p>
      )
      i++
      continue
    }

    // 箇条書き：・ - • 数字. など
    if (/^[・\-•]/.test(line) || /^\d+[.．]/.test(line)) {
      const bulletLines: string[] = []
      while (i < lines.length && (/^[・\-•]/.test(lines[i].trim()) || /^\d+[.．]/.test(lines[i].trim()))) {
        bulletLines.push(lines[i].trim())
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="mt-1 space-y-1.5">
          {bulletLines.map((bl, bi) => {
            const body = bl.replace(/^[・\-•]\s*/, '').replace(/^\d+[.．]\s*/, '')
            // 「店名：説明」のように：で区切られる場合
            const colonIdx = body.indexOf('：')
            if (colonIdx > 0 && colonIdx < 20) {
              const label = body.slice(0, colonIdx)
              const desc = body.slice(colonIdx + 1)
              return (
                <li key={bi} className="flex gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8320A] flex-shrink-0 mt-2" />
                  <span>
                    <span className="font-bold text-[#111008]">{label}：</span>
                    <span className="text-[#333]">{desc}</span>
                  </span>
                </li>
              )
            }
            return (
              <li key={bi} className="flex gap-2 text-sm text-[#111008]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8320A] flex-shrink-0 mt-2" />
                <span>{body}</span>
              </li>
            )
          })}
        </ul>
      )
      continue
    }

    // 通常テキスト
    elements.push(
      <p key={i} className="text-sm text-[#111008] leading-relaxed mt-1">
        {line}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

function SectionCard({ section, content }: { section: typeof SECTIONS[0]; content: string }) {
  return (
    <div className="bg-white border border-[#EDE5DF] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDE5DF] bg-[#FFF9F5]">
        <div className="flex items-center gap-2">
          <span className="text-base">{section.emoji}</span>
          <span className="text-sm font-bold text-[#111008]">{section.title}</span>
        </div>
        <CopyButton text={content} />
      </div>
      <div className="px-5 py-5">
        <RichText text={content} />
      </div>
    </div>
  )
}

export default function ResearchPage() {
  const { shopProfile } = useAppStore()
  const [competitorInfo, setCompetitorInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')

  const sections = parseSections(rawOutput)
  const hasResults = Object.keys(sections).length > 0

  const handleAnalyze = async () => {
    if (!shopProfile) return
    setError('')
    setRawOutput('')
    setLoading(true)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopProfile, competitorInfo }),
      })

      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `エラーが発生しました (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setRawOutput(result)
      }
      if (result.startsWith('ERROR:')) {
        setError(result.replace('ERROR:', '').trim())
        setRawOutput('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="競合リサーチ"
            description="業態・地域をもとに競合を丸裸にするレポートを生成します"
            backHref="/"
          />

          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <label className="block text-sm font-bold text-[#111008] mb-2">
              気になる競合店の情報
              <span className="text-xs font-normal text-[#9A8880] ml-2">（任意）</span>
            </label>
            <textarea
              value={competitorInfo}
              onChange={e => setCompetitorInfo(e.target.value)}
              placeholder={`例：
・駅前に最近オープンした焼肉チェーン
・近くの個人居酒屋、席数30席ぐらい、SNSをうまく使っている
・〇〇というグループ店が近くに2店舗ある`}
              rows={5}
              className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
            />
            <p className="text-xs text-[#9A8880] mt-2">
              空欄でも店舗プロフィールをもとに分析します
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '分析中...' : '🔍 競合を丸裸にする'}
          </button>

          {loading && (
            <div className="bg-white border border-[#EDE5DF] rounded-2xl p-8 text-center mb-6">
              <div className="w-10 h-10 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-[#111008] text-sm">競合を分析しています...</p>
              <p className="text-xs text-[#9A8880] mt-1">市場データをもとにレポートを作成中</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          {!loading && hasResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-[#9A8880] uppercase tracking-widest">競合リサーチレポート</p>
                <CopyButton text={rawOutput} />
              </div>
              {SECTIONS.map(section => sections[section.key] ? (
                <SectionCard key={section.key} section={section} content={sections[section.key]} />
              ) : null)}
            </div>
          )}

          {/* ストリーミング中の途中表示 */}
          {loading && rawOutput && (
            <div className="bg-white border border-[#EDE5DF] rounded-2xl p-5 mt-4">
              <p className="text-xs font-bold text-[#9A8880] mb-3">生成中...</p>
              <p className="text-sm text-[#111008] leading-relaxed whitespace-pre-wrap">{rawOutput}</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
