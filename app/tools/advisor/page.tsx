'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Send, Plus, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'

const MEMBERS = [
  { key: 'マーケッター｜田中',      short: 'マーケッター',   name: '田中', emoji: '📊', color: 'bg-blue-50 border-blue-200',    nameColor: 'text-blue-700',   dot: 'bg-blue-500' },
  { key: 'サービス責任者｜中村',    short: 'サービス責任者', name: '中村', emoji: '🎯', color: 'bg-green-50 border-green-200',   nameColor: 'text-green-700',  dot: 'bg-green-500' },
  { key: '料理長｜鈴木',            short: '料理長',          name: '鈴木', emoji: '👨‍🍳', color: 'bg-amber-50 border-amber-200',   nameColor: 'text-amber-700',  dot: 'bg-amber-500' },
  { key: 'SNS・広報担当｜山田',     short: 'SNS・広報',       name: '山田', emoji: '📱', color: 'bg-purple-50 border-purple-200', nameColor: 'text-purple-700', dot: 'bg-purple-500' },
  { key: '経営顧問｜佐藤',          short: '経営顧問',        name: '佐藤', emoji: '💼', color: 'bg-slate-50 border-slate-200',   nameColor: 'text-slate-700',  dot: 'bg-slate-500' },
]

type MemberMessage = { key: string; text: string }
type Turn = { role: 'ceo'; text: string } | { role: 'team'; members: MemberMessage[] }

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseMemberMessages(raw: string): MemberMessage[] {
  return MEMBERS.reduce<MemberMessage[]>((acc, m, i) => {
    const nextM = MEMBERS[i + 1]
    const pattern = new RegExp(
      `【${escapeRegex(m.key)}】([\\s\\S]*?)${nextM ? `(?=【${escapeRegex(nextM.key)}】)` : '$'}`
    )
    const match = raw.match(pattern)
    if (match) acc.push({ key: m.key, text: match[1].trim() })
    return acc
  }, [])
}

function MemberBubble({ memberKey, text }: { memberKey: string; text: string }) {
  const m = MEMBERS.find(m => m.key === memberKey) ?? MEMBERS[0]
  return (
    <div className={`border rounded-2xl rounded-tl-sm overflow-hidden ${m.color}`}>
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${m.color}`}>
        <span>{m.emoji}</span>
        <span className={`text-xs font-bold ${m.nameColor}`}>{m.short}</span>
        <span className="text-xs text-gray-400">（{m.name}）</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {MEMBERS.map((m, idx) => {
        if (!text.includes(`【${m.key}】`)) return null
        const nextKey = MEMBERS[idx + 1]?.key
        const afterThis = text.split(`【${m.key}】`)[1] ?? ''
        const finalContent = nextKey && afterThis.includes(`【${nextKey}】`)
          ? afterThis.split(`【${nextKey}】`)[0].trim()
          : afterThis.trim()
        const isLast = !nextKey || !text.includes(`【${nextKey}】`)
        return (
          <div key={m.key} className={`border rounded-2xl rounded-tl-sm overflow-hidden ${m.color}`}>
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${m.color}`}>
              <span>{m.emoji}</span>
              <span className={`text-xs font-bold ${m.nameColor}`}>{m.short}</span>
              <span className="text-xs text-gray-400">（{m.name}）</span>
              {isLast && (
                <span className="ml-auto flex gap-0.5">
                  {[0,1,2].map(i => <span key={i} className={`w-1 h-1 rounded-full ${m.dot} animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{finalContent}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdvisorPage() {
  const { shopProfile } = useAppStore()

  // リサーチフェーズ
  const [urls, setUrls] = useState<string[]>([''])
  const [researching, setResearching] = useState(false)
  const [researchStream, setResearchStream] = useState('')
  const [researchDone, setResearchDone] = useState(false)
  const [showResearch, setShowResearch] = useState(true)
  const [researchError, setResearchError] = useState('')

  // チャットフェーズ
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [chatError, setChatError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, streamText, researchStream])

  const handleResearch = async () => {
    if (!shopProfile) return
    setResearching(true)
    setResearchStream('')
    setResearchError('')

    try {
      const response = await fetch('/api/advisor-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopProfile, urls: urls.filter(Boolean) }),
      })
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'エラーが発生しました')
      }
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setResearchStream(result)
      }
      if (result.startsWith('ERROR:')) {
        setResearchError(result.replace('ERROR:', '').trim())
      } else {
        setResearchDone(true)
        setShowResearch(false)
      }
    } catch (e) {
      setResearchError(e instanceof Error ? e.message : 'リサーチに失敗しました。')
    } finally {
      setResearching(false)
    }
  }

  const buildMessages = (userText: string) => {
    const msgs: { role: 'user' | 'assistant'; content: string }[] = []
    turns.forEach(t => {
      if (t.role === 'ceo') {
        msgs.push({ role: 'user', content: t.text })
      } else {
        msgs.push({ role: 'assistant', content: t.members.map(m => `【${m.key}】\n${m.text}`).join('\n\n') })
      }
    })
    msgs.push({ role: 'user', content: userText })
    return msgs
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !shopProfile) return
    setInput('')
    setChatError('')
    setStreamText('')
    setTurns(prev => [...prev, { role: 'ceo', text }])
    setLoading(true)

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: buildMessages(text),
          shopProfile,
          researchContext: researchDone ? researchStream : undefined,
        }),
      })
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'エラーが発生しました')
      }
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setStreamText(result)
      }
      if (result.startsWith('ERROR:')) {
        setChatError(result.replace('ERROR:', '').trim())
      } else {
        setTurns(prev => [...prev, { role: 'team', members: parseMemberMessages(result) }])
      }
    } catch (e) {
      setChatError(e instanceof Error ? e.message : '送信に失敗しました。')
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend()
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5] flex flex-col">
        <Header />
        <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col flex-1">
          <PageHeader
            title="集客戦略アドバイザー"
            description="CEOとして5人のプロジェクトチームに相談できます"
            backHref="/"
          />

          {/* ── リサーチパネル ── */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl overflow-hidden mb-4">
            <button
              onClick={() => setShowResearch(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FFF9F5] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search size={16} className="text-[#E8320A]" />
                <span className="text-sm font-bold text-[#111008]">
                  {researchDone ? '✅ 店舗リサーチ完了' : '店舗ディープリサーチ'}
                </span>
                {researchDone && (
                  <span className="text-xs text-[#9A8880]">（タップで確認）</span>
                )}
              </div>
              {showResearch ? <ChevronUp size={16} className="text-[#9A8880]" /> : <ChevronDown size={16} className="text-[#9A8880]" />}
            </button>

            {showResearch && (
              <div className="border-t border-[#EDE5DF] px-5 py-4">
                {!researchDone && (
                  <>
                    <p className="text-xs text-[#9A8880] mb-3">
                      食べログ・ホットペッパー・公式サイト・InstagramなどのURLを入力すると、チームがネット上の情報を徹底リサーチします。URLなしでも店舗プロフィールをもとに分析します。
                    </p>
                    <div className="space-y-2 mb-3">
                      {urls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={e => {
                              const next = [...urls]
                              next[i] = e.target.value
                              setUrls(next)
                            }}
                            placeholder={`URL ${i + 1}（例：食べログのページ）`}
                            className="flex-1 border border-[#EDE5DF] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                          />
                          {urls.length > 1 && (
                            <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="text-[#9A8880] hover:text-[#E8320A]">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {urls.length < 5 && (
                      <button onClick={() => setUrls([...urls, ''])} className="flex items-center gap-1 text-xs text-[#9A8880] hover:text-[#E8320A] mb-4">
                        <Plus size={12} /> URLを追加
                      </button>
                    )}
                    <button
                      onClick={handleResearch}
                      disabled={researching}
                      className="w-full bg-[#111008] text-white rounded-xl py-3 font-bold text-sm hover:bg-black transition-colors disabled:opacity-40"
                    >
                      {researching ? 'リサーチ中...' : '🔍 ディープリサーチ開始'}
                    </button>
                  </>
                )}

                {researchError && (
                  <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mt-3">{researchError}</div>
                )}

                {(researching || researchDone) && researchStream && (
                  <div className="mt-4">
                    {researching && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 border-2 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-[#9A8880]">ネット上の情報を収集しています...</span>
                      </div>
                    )}
                    <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl p-4 max-h-64 overflow-y-auto">
                      <p className="text-xs text-[#111008] leading-relaxed whitespace-pre-wrap">{researchStream}</p>
                    </div>
                    {researchDone && (
                      <button
                        onClick={() => { setShowResearch(false) }}
                        className="w-full mt-3 bg-[#E8320A] text-white rounded-xl py-3 font-bold text-sm hover:bg-[#c92b09] transition-colors"
                      >
                        チームと議論を始める →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── チームメンバー紹介（初回のみ） ── */}
          {turns.length === 0 && !loading && (
            <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-[#9A8880] uppercase tracking-widest mb-3">プロジェクトチーム</p>
              <div className="grid grid-cols-2 gap-2">
                {MEMBERS.map(m => (
                  <div key={m.key} className={`flex items-center gap-2 border rounded-xl p-2.5 ${m.color}`}>
                    <span>{m.emoji}</span>
                    <div>
                      <p className={`text-xs font-bold ${m.nameColor}`}>{m.short}</p>
                      <p className="text-[10px] text-gray-400">{m.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              {researchDone && (
                <p className="text-xs text-green-600 font-bold mt-3 text-center">✅ 店舗リサーチ完了 — チームは全情報を把握しています</p>
              )}
            </div>
          )}

          {/* ── チャット履歴 ── */}
          <div className="flex-1 space-y-4 mb-4">
            {turns.map((turn, i) => {
              if (turn.role === 'ceo') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <p className="text-[10px] text-[#9A8880] text-right mb-1">CEO（あなた）</p>
                      <div className="bg-[#E8320A] text-white rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={i} className="space-y-3">
                  {turn.members.map(m => <MemberBubble key={m.key} memberKey={m.key} text={m.text} />)}
                </div>
              )
            })}

            {loading && streamText && <StreamingBubble text={streamText} />}
            {loading && !streamText && (
              <div className="flex items-center gap-2 text-[#9A8880]">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-[#9A8880] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <span className="text-xs">チームが議論中...</span>
              </div>
            )}
            {chatError && <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl">{chatError}</div>}
            <div ref={bottomRef} />
          </div>

          {/* ── 入力エリア ── */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-3 flex gap-2 items-end sticky bottom-4">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="CEOとして相談内容を入力...（⌘+Enter で送信）"
              rows={2}
              className="flex-1 resize-none text-sm text-[#111008] placeholder-[#9A8880] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-[#E8320A] text-white rounded-xl p-2.5 hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
