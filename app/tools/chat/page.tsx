'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Send, FileText, ClipboardList } from 'lucide-react'

const MEMBERS = [
  { key: '経営顧問｜田村',           short: '経営顧問',          name: '田村', emoji: '💼', color: 'bg-slate-50 border-slate-200',   nameColor: 'text-slate-700',   dot: 'bg-slate-500' },
  { key: '集客コンサル｜林',         short: '集客コンサル',      name: '林',   emoji: '🎯', color: 'bg-orange-50 border-orange-200', nameColor: 'text-orange-700',  dot: 'bg-orange-500' },
  { key: 'マーケター｜中島',         short: 'マーケター',         name: '中島', emoji: '📊', color: 'bg-blue-50 border-blue-200',    nameColor: 'text-blue-700',    dot: 'bg-blue-500' },
  { key: '社労士｜川口',             short: '社労士',             name: '川口', emoji: '👔', color: 'bg-green-50 border-green-200',  nameColor: 'text-green-700',   dot: 'bg-green-500' },
  { key: '財務アドバイザー｜松本',   short: '財務アドバイザー',  name: '松本', emoji: '💰', color: 'bg-amber-50 border-amber-200',  nameColor: 'text-amber-700',   dot: 'bg-amber-500' },
  { key: '中小企業診断士｜吉田',     short: '中小企業診断士',    name: '吉田', emoji: '📋', color: 'bg-purple-50 border-purple-200', nameColor: 'text-purple-700',  dot: 'bg-purple-500' },
  { key: 'フードコーディネーター｜村上', short: 'フードコーディネーター', name: '村上', emoji: '🍴', color: 'bg-pink-50 border-pink-200', nameColor: 'text-pink-700', dot: 'bg-pink-500' },
  { key: 'ITコンサル｜斎藤',         short: 'ITコンサル',         name: '斎藤', emoji: '💻', color: 'bg-teal-50 border-teal-200',   nameColor: 'text-teal-700',    dot: 'bg-teal-500' },
  { key: 'DXコンサル｜橋本',         short: 'DXコンサル',         name: '橋本', emoji: '🔄', color: 'bg-indigo-50 border-indigo-200',nameColor: 'text-indigo-700',  dot: 'bg-indigo-500' },
]

const SUGGESTIONS = [
  '売上が伸び悩んでいます。何から手をつければいいですか？',
  '使える補助金や助成金を教えてください',
  'アルバイトがすぐ辞めてしまいます。どう改善すればいいですか？',
  '原価率が高くて利益が出ません',
  'SNSを始めたいのですが何から始めればいいですか？',
  'デリバリーを導入すべきですか？',
]

type MemberMessage = { key: string; text: string }
type Turn =
  | { role: 'owner'; text: string }
  | { role: 'team'; members: MemberMessage[] }
  | { role: 'summary'; text: string }

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseMemberMessages(raw: string): MemberMessage[] {
  return MEMBERS.reduce<MemberMessage[]>((acc, m, i) => {
    const nextMembers = MEMBERS.slice(i + 1)
    const nextPattern = nextMembers.map(nm => `【${escapeRegex(nm.key)}】`).join('|')
    const pattern = new RegExp(
      `【${escapeRegex(m.key)}】([\\s\\S]*?)${nextPattern ? `(?=${nextPattern})` : '$'}`
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
        const isStreaming = !nextKey || !text.includes(`【${nextKey}】`)
        return (
          <div key={m.key} className={`border rounded-2xl rounded-tl-sm overflow-hidden ${m.color}`}>
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${m.color}`}>
              <span>{m.emoji}</span>
              <span className={`text-xs font-bold ${m.nameColor}`}>{m.short}</span>
              <span className="text-xs text-gray-400">（{m.name}）</span>
              {isStreaming && (
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

export default function ChatPage() {
  const { shopProfile } = useAppStore()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [summaryStream, setSummaryStream] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, streamText])

  const buildMessages = (userText: string) => {
    const msgs: { role: 'user' | 'assistant'; content: string }[] = []
    turns.forEach(t => {
      if (t.role === 'owner') {
        msgs.push({ role: 'user', content: t.text })
      } else if (t.role === 'team') {
        msgs.push({ role: 'assistant', content: t.members.map(m => `【${m.key}】\n${m.text}`).join('\n\n') })
      }
    })
    msgs.push({ role: 'user', content: userText })
    return msgs
  }

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || !shopProfile) return
    setInput('')
    setError('')
    setStreamText('')
    setTurns(prev => [...prev, { role: 'owner', text: msg }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: buildMessages(msg), shopProfile }),
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
        setError(result.replace('ERROR:', '').trim())
      } else {
        setTurns(prev => [...prev, { role: 'team', members: parseMemberMessages(result) }])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました。')
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
        body: JSON.stringify({ turns, shopProfile }),
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
      }
    } catch {
      // サイレントフェイル
    } finally {
      setSummarizing(false)
      setSummaryStream('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  const showWelcome = turns.length === 0 && !loading

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8] flex flex-col">
        <Header />
        <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col flex-1">
          <PageHeader
            title="なんでも経営相談AI"
            description="9人の専門家チームが経営の悩みに何でも答えます"
            backHref="/"
          />

          {/* ウェルカム */}
          {showWelcome && (
            <div className="space-y-3 mb-4">
              {/* チーム紹介 */}
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-3">あなたの専門家チーム</p>
                <div className="grid grid-cols-3 gap-2">
                  {MEMBERS.map(m => (
                    <div key={m.key} className={`flex items-center gap-2 border rounded-xl p-2 ${m.color}`}>
                      <span className="text-sm">{m.emoji}</span>
                      <span className={`text-[10px] font-bold leading-tight ${m.nameColor}`}>{m.short}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* サジェスト */}
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
                <p className="text-xs font-bold text-[#6B7280] mb-3">💡 こんなことを相談できます</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="w-full text-left text-xs text-[#111827] border border-[#E5E9F2] rounded-xl px-3 py-2.5 hover:border-[#E8320A] hover:bg-red-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* チャット */}
          <div className="flex-1 space-y-4 mb-4">
            {turns.map((turn, i) => {
              if (turn.role === 'owner') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <p className="text-[10px] text-[#6B7280] text-right mb-1">オーナー（あなた）</p>
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
                </div>
              )
            })}

            {loading && streamText && <StreamingBubble text={streamText} />}
            {loading && !streamText && (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-[#9A8880] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <span className="text-xs">チームが考えています...</span>
              </div>
            )}
            {summarizing && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500">
                  <ClipboardList size={14} className="text-white" />
                  <span className="text-xs font-bold text-white">相談の要約・議事録</span>
                  <span className="ml-auto flex gap-0.5">
                    {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{summaryStream || '　'}</p>
                </div>
              </div>
            )}
            {error && <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl">{error}</div>}
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

          {/* 入力 */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-3 flex gap-2 items-end sticky bottom-4">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="経営の悩みを何でも相談してください..."
              rows={2}
              className="flex-1 resize-none text-sm text-[#111827] placeholder-[#9A8880] focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
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
