'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import ThreadSidebar from '@/components/chat/ThreadSidebar'
import { useChatThreads } from '@/hooks/useChatThreads'
import { ChatMessage } from '@/types'
import { Send, FileText, ClipboardList, Plus, CheckCircle, Menu } from 'lucide-react'

const MEMBERS = [
  { key: 'マーケッター｜田中',      short: 'マーケッター',   name: '田中', emoji: '📊', color: 'bg-blue-50 border-blue-200',    nameColor: 'text-blue-700',   dot: 'bg-blue-500' },
  { key: 'サービス責任者｜中村',    short: 'サービス責任者', name: '中村', emoji: '🎯', color: 'bg-green-50 border-green-200',   nameColor: 'text-green-700',  dot: 'bg-green-500' },
  { key: '料理長｜鈴木',            short: '料理長',          name: '鈴木', emoji: '👨‍🍳', color: 'bg-amber-50 border-amber-200',   nameColor: 'text-amber-700',  dot: 'bg-amber-500' },
  { key: 'SNS・広報担当｜山田',     short: 'SNS・広報',       name: '山田', emoji: '📱', color: 'bg-purple-50 border-purple-200', nameColor: 'text-purple-700', dot: 'bg-purple-500' },
  { key: '経営顧問｜佐藤',          short: '経営顧問',        name: '佐藤', emoji: '💼', color: 'bg-slate-50 border-slate-200',   nameColor: 'text-slate-700',  dot: 'bg-slate-500' },
]

type MemberMessage = { key: string; text: string }
type Turn =
  | { role: 'ceo'; text: string }
  | { role: 'team'; members: MemberMessage[] }
  | { role: 'summary'; text: string }

function messagesToTurns(messages: ChatMessage[]): Turn[] {
  return messages.flatMap(msg => {
    if (msg.role === 'ceo' && msg.content.text) return [{ role: 'ceo' as const, text: msg.content.text }]
    if (msg.role === 'team' && msg.content.members) return [{ role: 'team' as const, members: msg.content.members }]
    if (msg.role === 'summary' && msg.content.text) return [{ role: 'summary' as const, text: msg.content.text }]
    return []
  })
}

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
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [chatError, setChatError] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [summaryStream, setSummaryStream] = useState('')
  const [actionOpenIdx, setActionOpenIdx] = useState<number | null>(null)
  const [actionText, setActionText] = useState('')
  const [actionSavedIndices, setActionSavedIndices] = useState<number[]>([])
  const [actionSaving, setActionSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { fetchThreads, createThread, saveMessage } = useChatThreads(shopProfile?.id, 'advisor')

  useEffect(() => {
    if (shopProfile?.id) fetchThreads()
  }, [shopProfile?.id, fetchThreads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, streamText])

  const handleSelectThread = useCallback((threadId: string, messages: ChatMessage[]) => {
    setCurrentThreadId(threadId)
    setTurns(messagesToTurns(messages))
    setActionSavedIndices([])
    setActionOpenIdx(null)
    setChatError('')
  }, [])

  const handleNewThread = useCallback(() => {
    setCurrentThreadId(null)
    setTurns([])
    setActionSavedIndices([])
    setActionOpenIdx(null)
    setChatError('')
    setInput('')
  }, [])

  const buildMessages = (userText: string) => {
    const msgs: { role: 'user' | 'assistant'; content: string }[] = []
    turns.forEach(t => {
      if (t.role === 'ceo') {
        msgs.push({ role: 'user', content: t.text })
      } else if (t.role === 'team') {
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

    let threadId = currentThreadId
    if (!threadId) {
      threadId = await createThread(text.slice(0, 40))
      if (threadId) setCurrentThreadId(threadId)
    }

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: buildMessages(text),
          shopProfile,
          researchContext: shopProfile.researchCache ?? undefined,
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
        const members = parseMemberMessages(result)
        setTurns(prev => [...prev, { role: 'team', members }])
        if (threadId) {
          saveMessage(threadId, 'ceo', { text })
          saveMessage(threadId, 'team', { members })
        }
      }
    } catch (e) {
      setChatError(e instanceof Error ? e.message : '送信に失敗しました。')
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }

  const handleSummary = async () => {
    if (summarizing || loading || !shopProfile || turns.length < 2) return
    setSummarizing(true)
    setSummaryStream('')
    try {
      const response = await fetch('/api/chat-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns, shopProfile, context: 'advisor' }),
      })
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setSummaryStream(result)
      }
      if (!result.startsWith('ERROR:')) {
        setTurns(prev => [...prev, { role: 'summary', text: result }])
        if (currentThreadId) saveMessage(currentThreadId, 'summary', { text: result })
      }
    } catch {
      // サイレントフェイル
    } finally {
      setSummarizing(false)
      setSummaryStream('')
    }
  }

  const addToActions = async (turnIdx: number) => {
    if (!shopProfile || !actionText.trim() || actionSaving) return
    setActionSaving(true)
    try {
      await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: shopProfile.id, content: actionText.trim() }),
      })
      setActionSavedIndices(prev => [...prev, turnIdx])
      setActionOpenIdx(null)
      setActionText('')
    } catch {
      // サイレントフェイル
    } finally {
      setActionSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  return (
    <AuthGuard>
      <div className="h-screen bg-[#F1F3F8] flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* サイドバー */}
          <ThreadSidebar
            shopId={shopProfile?.id}
            toolName="advisor"
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onNewThread={handleNewThread}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* メインエリア */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-0 flex flex-col flex-1 overflow-hidden">
              {/* ページヘッダー */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-white rounded-lg transition-colors flex-shrink-0"
                >
                  <Menu size={18} />
                </button>
                <div className="flex-1">
                  <PageHeader
                    title="集客戦略アドバイザー"
                    description="CEOとして5人のプロジェクトチームに相談できます"
                    backHref="/"
                  />
                </div>
              </div>

              {/* チャットスクロールエリア */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {/* チームメンバー紹介（初回のみ） */}
                {turns.length === 0 && !loading && (
                  <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
                    <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-3">プロジェクトチーム</p>
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
                    {shopProfile?.researchCache && (
                      <p className="text-xs text-green-600 font-bold mt-3 text-center">✅ 店舗リサーチ済み — チームは全情報を把握しています</p>
                    )}
                  </div>
                )}

                {/* チャット履歴 */}
                {turns.map((turn, i) => {
                  if (turn.role === 'ceo') {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[85%]">
                          <p className="text-[10px] text-[#6B7280] text-right mb-1">CEO（あなた）</p>
                          <div className="bg-[#E8320A] text-white rounded-2xl rounded-tr-sm px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  if (turn.role === 'summary') {
                    return (
                      <div key={i} className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500">
                          <ClipboardList size={14} className="text-white" />
                          <span className="text-xs font-bold text-white">相談の要約・議事録</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="space-y-3">
                      {turn.members.map(m => <MemberBubble key={m.key} memberKey={m.key} text={m.text} />)}
                      {actionSavedIndices.includes(i) ? (
                        <div className="flex justify-end">
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle size={13} /> 施策に追加済み
                          </span>
                        </div>
                      ) : actionOpenIdx === i ? (
                        <div className="bg-white border border-[#E5E9F2] rounded-xl p-3 space-y-2">
                          <p className="text-xs font-medium text-[#6B7280]">施策メモに追加する内容を入力</p>
                          <textarea
                            value={actionText}
                            onChange={e => setActionText(e.target.value)}
                            placeholder="例：SNS投稿を週3回実施する"
                            rows={2}
                            className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setActionOpenIdx(null); setActionText('') }} className="text-xs text-[#6B7280] hover:text-[#111827] px-3 py-1.5">キャンセル</button>
                            <button onClick={() => addToActions(i)} disabled={!actionText.trim() || actionSaving} className="flex items-center gap-1 text-xs bg-[#E8320A] text-white rounded-lg px-3 py-1.5 hover:bg-[#c92b09] disabled:opacity-40 disabled:cursor-not-allowed">
                              <Plus size={12} /> 追加する
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => { setActionOpenIdx(i); setActionText(turn.members.map(m => m.text).join('\n\n').slice(0, 100)) }}
                            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#E8320A] border border-[#E5E9F2] hover:border-[#E8320A] bg-white rounded-full px-3 py-1.5 transition-colors"
                          >
                            <Plus size={12} /> 施策に追加
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {loading && streamText && <StreamingBubble text={streamText} />}
                {loading && !streamText && (
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-[#9A8880] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                    <span className="text-xs">チームが議論中...</span>
                  </div>
                )}
                {summarizing && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500">
                      <ClipboardList size={14} className="text-white" />
                      <span className="text-xs font-bold text-white">相談の要約・議事録</span>
                      <span className="ml-auto flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{summaryStream || '　'}</p>
                    </div>
                  </div>
                )}
                {chatError && <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl">{chatError}</div>}
                <div ref={bottomRef} />
              </div>

              {/* 要約ボタン */}
              {turns.length >= 2 && (
                <div className="mb-2 flex justify-center">
                  <button
                    onClick={handleSummary}
                    disabled={summarizing || loading}
                    className="flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-400 rounded-full px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={13} />
                    {summarizing ? '要約を生成中...' : 'ここまでを要約する'}
                  </button>
                </div>
              )}

              {/* 入力エリア */}
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-3 flex gap-2 items-end mb-4">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="CEOとして相談内容を入力..."
                  rows={2}
                  className="flex-1 resize-none text-sm text-[#111827] placeholder-[#9A8880] focus:outline-none"
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
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
