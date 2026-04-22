'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ResultBlock from '@/components/ui/ResultBlock'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { Lightbulb } from 'lucide-react'

const TONES = ['カジュアル', '丁寧・上品', '食欲そそる系', '賑やか・POP']

type Results = {
  instagram: string
  x: string
  google: string
}

type Idea = { title: string; description: string }

function parseResults(raw: string): Results {
  const instagram = raw.match(/\[Instagram\]([\s\S]*?)(?=\[X\]|$)/)?.[1]?.trim() ?? ''
  const x = raw.match(/\[X\]([\s\S]*?)(?=\[Googleビジネス\]|$)/)?.[1]?.trim() ?? ''
  const google = raw.match(/\[Googleビジネス\]([\s\S]*?)$/)?.[1]?.trim() ?? ''
  return { instagram, x, google }
}

function parseIdeas(raw: string): Idea[] {
  return raw.split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => {
      const body = l.replace(/^\d+\.\s*/, '').trim()
      const [title, description] = body.split('｜').map(s => s.trim())
      return { title: title ?? body, description: description ?? '' }
    })
}

function SnsPageContent() {
  const { shopProfile } = useAppStore()
  const searchParams = useSearchParams()
  const [content, setContent] = useState(() => searchParams.get('content') ?? '')
  const [tone, setTone] = useState('カジュアル')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')

  const [ideasLoading, setIdeasLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasError, setIdeasError] = useState('')

  const handleGenerate = async () => {
    if (!content.trim()) return
    if (!shopProfile) return

    setError('')
    setRawOutput('')
    setLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'sns',
          shopProfile,
          inputs: { content },
          tone,
        }),
      })

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
        setError(result.replace('ERROR:', ''))
      }
    } catch {
      setError('生成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchIdeas = async () => {
    if (!shopProfile) return
    setIdeasError('')
    setIdeas([])
    setIdeasLoading(true)

    try {
      const response = await fetch('/api/sns-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopProfile }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
      }

      if (result.startsWith('ERROR:')) {
        setIdeasError(result.replace('ERROR:', '').trim())
      } else {
        setIdeas(parseIdeas(result))
      }
    } catch {
      setIdeasError('提案の取得に失敗しました。')
    } finally {
      setIdeasLoading(false)
    }
  }

  const results = parseResults(rawOutput)
  const hasResults = results.instagram || results.x || results.google

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="SNS投稿文ジェネレーター"
            description="店名・地域・業態はプロフィールから自動参照されます"
            backHref="/"
          />

          {/* 投稿ネタ提案 */}
          <div className="bg-white border border-[#E5E9F2] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[#111827]">💡 投稿ネタを提案してもらう</p>
                <p className="text-xs text-[#6B7280] mt-0.5">お店の特徴をもとにAIがネタを提案します</p>
              </div>
              <button
                onClick={handleFetchIdeas}
                disabled={ideasLoading}
                className="flex items-center gap-1.5 text-xs bg-[#111008] text-white rounded-lg px-3 py-2 hover:bg-[#333] transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Lightbulb size={13} />
                {ideasLoading ? '提案中...' : 'ネタを見る'}
              </button>
            </div>

            {ideasLoading && (
              <div className="flex items-center gap-2 text-[#6B7280] py-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#9A8880] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <span className="text-xs">お店の情報から提案を生成中...</span>
              </div>
            )}

            {ideasError && <p className="text-xs text-[#E8320A]">{ideasError}</p>}

            {ideas.length > 0 && (
              <div className="space-y-2">
                {ideas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => setContent(idea.title + (idea.description ? `\n${idea.description}` : ''))}
                    className="w-full text-left border border-[#E5E9F2] rounded-xl px-3 py-2.5 hover:border-[#E8320A] hover:bg-red-50 transition-colors"
                  >
                    <p className="text-xs font-bold text-[#111827]">{idea.title}</p>
                    {idea.description && <p className="text-[11px] text-[#6B7280] mt-0.5">{idea.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 入力エリア */}
          <div className="bg-white border border-[#E5E9F2] rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-[#111827] mb-2">
              今日の投稿内容・伝えたいこと <span className="text-[#E8320A]">*</span>
            </label>
            {searchParams.get('content') && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 mb-2">
                <span>📅</span>
                <span>集客カレンダーのイベント情報を反映しました。内容を確認・編集してから生成してください。</span>
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例：本日のランチは肉じゃが定食！ほっこり温かい味でお待ちしてます"
              rows={4}
              className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
            />

            <label className="block text-sm font-medium text-[#111827] mt-3 mb-2">トーン</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                    tone === t
                      ? 'bg-[#E8320A] text-white border-[#E8320A]'
                      : 'bg-white text-[#111827] border-[#E5E9F2] hover:border-[#E8320A]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '生成中...' : '投稿文を生成する'}
          </button>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}

          {!loading && hasResults && (
            <div className="space-y-3">
              {results.instagram && (
                <ResultBlock label="Instagram" text={results.instagram} onRegenerate={handleGenerate} />
              )}
              {results.x && (
                <ResultBlock label="X（Twitter）" text={results.x} onRegenerate={handleGenerate} />
              )}
              {results.google && (
                <ResultBlock label="Googleビジネスプロフィール" text={results.google} onRegenerate={handleGenerate} />
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}


export default function SnsPage() {
  return (
    <Suspense>
      <SnsPageContent />
    </Suspense>
  )
}
