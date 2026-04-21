'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import ThreadSidebar from '@/components/chat/ThreadSidebar'
import { useChatThreads } from '@/hooks/useChatThreads'
import { ChatMessage } from '@/types'
import { Menu } from 'lucide-react'

const MANUAL_TYPES = [
  { key: '接客基本',    icon: '🤝', desc: 'あいさつ・注文取り・提供・お見送り' },
  { key: 'オープン作業', icon: '🌅', desc: '開店前の準備・チェック項目一式' },
  { key: 'クローズ作業', icon: '🌙', desc: '閉店後の清掃・締め・翌日準備' },
  { key: 'クレーム対応', icon: '🙇', desc: 'お客様からのクレーム・苦情対応' },
  { key: '衛生管理',    icon: '🧼', desc: '食品衛生・手洗い・身だしなみ' },
]

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

function extractManual(content: string): { before: string; manual: string; after: string } | null {
  const start = content.indexOf('===MANUAL_START===')
  const end = content.indexOf('===MANUAL_END===')
  if (start === -1 || end === -1) return null
  return {
    before: content.slice(0, start).trim(),
    manual: content.slice(start + 18, end).trim(),
    after: content.slice(end + 16).trim(),
  }
}

function ManualLines({ lines, forPdf = false }: { lines: string[]; forPdf?: boolean }) {
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return forPdf
            ? <div key={i} style={{ fontSize: '18px', fontWeight: 'bold', color: '#111008', marginBottom: '8px', marginTop: '4px' }}>{line.replace(/^# /, '')}</div>
            : <h2 key={i} className="text-base font-bold text-[#111827] mb-2 mt-1">{line.replace(/^# /, '')}</h2>
        }
        if (line.startsWith('## ')) {
          return forPdf
            ? <div key={i} style={{ fontSize: '13px', fontWeight: 'bold', color: '#E8320A', marginTop: '20px', marginBottom: '6px', borderBottom: '1px solid #EDE5DF', paddingBottom: '4px' }}>{line.replace(/^## /, '')}</div>
            : <h3 key={i} className="text-sm font-bold text-[#E8320A] mt-4 mb-1.5 border-b border-[#E5E9F2] pb-1">{line.replace(/^## /, '')}</h3>
        }
        const isChecklist = /^[\d]+[.\）\)、]/.test(line)
        if (isChecklist) {
          return forPdf
            ? <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', borderBottom: '1px solid #F0EBE8' }}>
                <div style={{ width: '14px', height: '14px', border: '1.5px solid #CCC', borderRadius: '2px', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: '#111008', lineHeight: 1.6 }}>{line}</span>
              </div>
            : <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-[#E5E9F2] last:border-0">
                <div className="w-4 h-4 mt-0.5 rounded border-2 border-[#E5E9F2] flex-shrink-0" />
                <span className="text-sm text-[#111827] leading-relaxed">{line}</span>
              </div>
        }
        if (line.startsWith('- ') || line.startsWith('・')) {
          const body = line.replace(/^[-・]\s*/, '')
          return forPdf
            ? <div key={i} style={{ display: 'flex', gap: '6px', padding: '3px 0' }}>
                <span style={{ color: '#E8320A', fontSize: '10px', marginTop: '3px' }}>▸</span>
                <span style={{ fontSize: '12px', color: '#111008', lineHeight: 1.6 }}>{body}</span>
              </div>
            : <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="text-[#E8320A] mt-1 text-xs flex-shrink-0">▸</span>
                <span className="text-sm text-[#111827] leading-relaxed">{body}</span>
              </div>
        }
        return forPdf
          ? <p key={i} style={{ fontSize: '12px', color: '#333', lineHeight: 1.7, margin: '3px 0' }}>{line}</p>
          : <p key={i} className="text-sm text-[#555] leading-relaxed">{line}</p>
      })}
    </>
  )
}

function ManualBlock({ text, shopName, manualType }: { text: string; shopName: string; manualType: string }) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  const lines = text.split('\n').filter(l => l.trim())

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPDF = useCallback(async () => {
    const el = pdfRef.current
    if (!el) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const jsPDF = (await import('jspdf')).jsPDF
      await toPng(el)
      const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#FFFFFF' })
      const img = new Image()
      img.src = imgData
      await new Promise<void>(resolve => { img.onload = () => resolve() })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const imgHeightMm = (img.height / img.width) * pageW * (1 / 2)
      if (imgHeightMm <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgHeightMm)
      } else {
        const canvas = document.createElement('canvas')
        const pxPerPageH = Math.round((pageH / pageW) * img.width)
        const totalPages = Math.ceil(img.height / pxPerPageH)
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage()
          canvas.width = img.width
          canvas.height = pxPerPageH
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, page * pxPerPageH, img.width, pxPerPageH, 0, 0, img.width, pxPerPageH)
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH)
        }
      }
      pdf.save(`${shopName}_${manualType}マニュアル.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
      alert('PDF出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }, [shopName, manualType])

  return (
    <div className="my-3 rounded-xl overflow-hidden border-2 border-[#E8320A]">
      <div className="bg-[#111008] px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-widest">Generated Manual</p>
          <p className="text-sm font-bold text-white">{shopName}　{manualType}マニュアル</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleCopy} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {copied ? 'コピー済み' : 'コピー'}
          </button>
          <button onClick={handleExportPDF} disabled={exporting} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#E8320A] text-white hover:bg-[#c92b09] transition-colors disabled:opacity-50">
            {exporting ? '生成中…' : 'PDF'}
          </button>
        </div>
      </div>
      <div className="bg-white px-4 py-4 space-y-1">
        <ManualLines lines={lines} />
      </div>
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        <div ref={pdfRef} style={{ width: '595px', backgroundColor: '#FFFFFF', fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif', padding: '0' }}>
          <div style={{ backgroundColor: '#111008', padding: '28px 36px 24px' }}>
            <div style={{ fontSize: '10px', color: '#9A8880', letterSpacing: '0.1em', marginBottom: '6px' }}>STAFF MANUAL</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', lineHeight: 1.2 }}>{shopName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div style={{ width: '24px', height: '2px', backgroundColor: '#E8320A' }} />
              <div style={{ fontSize: '13px', color: '#E8320A', fontWeight: 'bold' }}>{manualType}マニュアル</div>
            </div>
          </div>
          <div style={{ padding: '28px 36px 40px' }}><ManualLines lines={lines} forPdf /></div>
          <div style={{ borderTop: '1px solid #EDE5DF', padding: '12px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#9A8880' }}>{shopName}　{manualType}マニュアル</span>
            <span style={{ fontSize: '10px', color: '#9A8880' }}>Powered by Manaita</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, shopProfile, manualType }: {
  message: Message
  shopProfile: { name: string } | null
  manualType: string
}) {
  const isUser = message.role === 'user'
  const extracted = !isUser ? extractManual(message.content) : null
  if (extracted) {
    return (
      <div className="space-y-2">
        {extracted.before && (
          <div className="bg-white border border-[#E5E9F2] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{extracted.before}</p>
          </div>
        )}
        <ManualBlock text={extracted.manual} shopName={shopProfile?.name || ''} manualType={manualType} />
        {extracted.after && (
          <div className="bg-white border border-[#E5E9F2] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{extracted.after}</p>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#E8320A] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">AI</div>
      )}
      <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-[#111008] text-white rounded-tr-sm' : 'bg-white border border-[#E5E9F2] text-[#111827] rounded-tl-sm'}`}>
        {message.content}
        {message.isStreaming && <span className="inline-block w-1.5 h-4 bg-[#E8320A] ml-1 animate-pulse rounded-sm" />}
      </div>
    </div>
  )
}

export default function ManualPage() {
  const { shopProfile } = useAppStore()
  const [phase, setPhase] = useState<'select' | 'chat'>('select')
  const [manualType, setManualType] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { fetchThreads, createThread, saveMessage } = useChatThreads(shopProfile?.id, 'manual')

  useEffect(() => {
    if (shopProfile?.id) fetchThreads()
  }, [shopProfile?.id, fetchThreads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  const handleSelectThread = useCallback((threadId: string, dbMessages: ChatMessage[]) => {
    const restored: Message[] = dbMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content.text ?? '',
    }))
    // スレッドタイトル（manualType）を復元
    const firstAssistant = dbMessages[0]
    const titleHint = firstAssistant?.content?.text?.slice(0, 20) ?? ''
    // threadのtool_nameからmanualTypeは取れないのでデフォルト値を使う
    setManualType(titleHint || 'マニュアル')
    setCurrentThreadId(threadId)
    setMessages(restored)
    setPhase('chat')
  }, [])

  const handleNewThread = useCallback(() => {
    setCurrentThreadId(null)
    setMessages([])
    setManualType('')
    setPhase('select')
  }, [])

  const sendMessage = async (userContent?: string) => {
    if (isLoading) return
    const content = userContent ?? input.trim()
    if (!content && userContent === undefined) return

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content },
    ]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }])

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/manual-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, shopProfile, manualType }),
      })
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: result } : m))
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m))

      // DBに保存
      if (currentThreadId) {
        saveMessage(currentThreadId, 'user', { text: content })
        saveMessage(currentThreadId, 'assistant', { text: result })
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: '応答に失敗しました。もう一度お試しください。', isStreaming: false } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const startChat = async (type: string) => {
    setManualType(type)
    setMessages([])
    setPhase('chat')
    setIsLoading(true)

    // スレッドを作成
    const threadId = await createThread(`${type}マニュアル`)
    if (threadId) setCurrentThreadId(threadId)

    const assistantId = Date.now().toString()
    setMessages([{ id: assistantId, role: 'assistant', content: '', isStreaming: true }])

    try {
      const response = await fetch('/api/manual-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], shopProfile, manualType: type }),
      })
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setMessages([{ id: assistantId, role: 'assistant', content: result, isStreaming: true }])
      }
      setMessages([{ id: assistantId, role: 'assistant', content: result, isStreaming: false }])

      // 初回メッセージを保存
      if (threadId) saveMessage(threadId, 'assistant', { text: result })
    } catch {
      setMessages([{ id: assistantId, role: 'assistant', content: '申し訳ありません。接続に失敗しました。', isStreaming: false }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sidebar = (
    <ThreadSidebar
      shopId={shopProfile?.id}
      toolName="manual"
      currentThreadId={currentThreadId}
      onSelectThread={handleSelectThread}
      onNewThread={handleNewThread}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />
  )

  if (phase === 'select') {
    return (
      <AuthGuard>
        <div className="h-screen bg-[#F1F3F8] flex flex-col overflow-hidden">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            {sidebar}
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setSidebarOpen(true)} className="md:hidden w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-white rounded-lg transition-colors">
                    <Menu size={18} />
                  </button>
                  <PageHeader title="スタッフマニュアル作成" description="AIが徹底的にヒアリングして、最強のマニュアルを一緒に作ります" backHref="/" />
                </div>
                <p className="text-sm text-[#6B7280] mb-4">どのマニュアルを作りますか？</p>
                <div className="space-y-3">
                  {MANUAL_TYPES.map(t => (
                    <button key={t.key} onClick={() => startChat(t.key)}
                      className="w-full flex items-center gap-4 bg-white border border-[#E5E9F2] rounded-xl px-5 py-4 text-left hover:border-[#E8320A] hover:shadow-sm transition-all group">
                      <span className="text-3xl">{t.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-[#111827] group-hover:text-[#E8320A] transition-colors">{t.key}マニュアル</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{t.desc}</p>
                      </div>
                      <span className="text-[#EDE5DF] group-hover:text-[#E8320A] transition-colors text-lg">›</span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 bg-[#111008] rounded-xl p-4 text-sm text-[#6B7280]">
                  <p className="text-white font-bold mb-1">💬 チャット形式でヒアリング</p>
                  <p className="text-xs leading-relaxed">AIがお店のことを徹底的に質問しながら、繁盛店の知恵も交えて、あなたのお店だけの最強マニュアルを一緒に作ります。</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="h-screen bg-[#F1F3F8] flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {sidebar}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-[#E5E9F2] px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#6B7280] hover:text-[#111827] p-1">
                <Menu size={18} />
              </button>
              <button onClick={() => setPhase('select')} className="text-[#6B7280] hover:text-[#111827] transition-colors p-1">‹</button>
              <div className="w-8 h-8 rounded-full bg-[#E8320A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
              <div>
                <p className="text-sm font-bold text-[#111827]">{manualType}マニュアル作成</p>
                <p className="text-xs text-[#6B7280]">AIコンサルタントがヒアリング中</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} shopProfile={shopProfile} manualType={manualType} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="bg-white border-t border-[#E5E9F2] px-4 py-3 flex-shrink-0">
              {!isLoading && messages.length > 0 && messages.length < 4 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {['今は口頭で教えています', 'マニュアルはありません', '困ったことがよくあります'].map(hint => (
                    <button key={hint} onClick={() => sendMessage(hint)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#E5E9F2] text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] transition-colors bg-white">
                      {hint}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="メッセージを入力…（Shift+Enterで送信）" rows={1} disabled={isLoading}
                  className="flex-1 border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none disabled:opacity-50" />
                <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#E8320A] text-white flex items-center justify-center hover:bg-[#c92b09] transition-colors disabled:opacity-40 flex-shrink-0">
                  {isLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="text-base">↑</span>
                  }
                </button>
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1 text-center">Shift+Enter で送信　｜　「もう作って」と言うとマニュアルを生成します</p>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
