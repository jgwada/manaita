'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ResultBlock from '@/components/ui/ResultBlock'
import ErrorMessage from '@/components/ui/ErrorMessage'

const TONES = ['カジュアル', '丁寧・上品', '食欲そそる系', '賑やか・POP']

type Results = {
  instagram: string
  x: string
  google: string
}

function parseResults(raw: string): Results {
  const instagram = raw.match(/\[Instagram\]([\s\S]*?)(?=\[X\]|$)/)?.[1]?.trim() ?? ''
  const x = raw.match(/\[X\]([\s\S]*?)(?=\[Googleビジネス\]|$)/)?.[1]?.trim() ?? ''
  const google = raw.match(/\[Googleビジネス\]([\s\S]*?)$/)?.[1]?.trim() ?? ''
  return { instagram, x, google }
}

export default function SnsPage() {
  const { shopProfile } = useAppStore()
  const [content, setContent] = useState('')
  const [tone, setTone] = useState('カジュアル')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')

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

  const results = parseResults(rawOutput)
  const hasResults = results.instagram || results.x || results.google

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="SNS投稿文ジェネレーター"
            description="店名・地域・業態はプロフィールから自動参照されます"
            backHref="/"
          />

          {/* 入力エリア */}
          <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-[#111008] mb-2">
              今日の投稿内容・伝えたいこと <span className="text-[#E8320A]">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例：本日のランチは肉じゃが定食！ほっこり温かい味でお待ちしてます"
              rows={4}
              className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
            />

            <label className="block text-sm font-medium text-[#111008] mt-3 mb-2">トーン</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                    tone === t
                      ? 'bg-[#E8320A] text-white border-[#E8320A]'
                      : 'bg-white text-[#111008] border-[#EDE5DF] hover:border-[#E8320A]'
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

          {/* ローディング */}
          {loading && <LoadingSpinner />}

          {/* エラー */}
          {error && <ErrorMessage message={error} />}

          {/* 結果 */}
          {!loading && hasResults && (
            <div className="space-y-3">
              {results.instagram && (
                <ResultBlock
                  label="Instagram"
                  text={results.instagram}
                  onRegenerate={handleGenerate}
                />
              )}
              {results.x && (
                <ResultBlock
                  label="X（Twitter）"
                  text={results.x}
                  onRegenerate={handleGenerate}
                />
              )}
              {results.google && (
                <ResultBlock
                  label="Googleビジネスプロフィール"
                  text={results.google}
                  onRegenerate={handleGenerate}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
