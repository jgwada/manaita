'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Copy, CheckCircle, ExternalLink } from 'lucide-react'

type Result = {
  shopName: string
  reviewUrl: string
  placeId: string
  mapsUrl: string
}

function parseResult(raw: string): Result {
  const get = (label: string) =>
    raw.match(new RegExp(`${label}：([^\n]+)`))?.[1]?.trim() ?? ''
  return {
    shopName: get('店名'),
    reviewUrl: get('Google口コミURL'),
    placeId: get('Place ID'),
    mapsUrl: get('Googleマップ URL'),
  }
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const isEmpty = !value || value === '情報なし'

  const handleCopy = () => {
    if (isEmpty) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-[#EDE5DF] rounded-xl p-3">
      <p className="text-xs font-bold text-[#9A8880] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`flex-1 text-sm break-all ${isEmpty ? 'text-[#9A8880] italic' : 'text-[#111008]'}`}>
          {value || '情報なし'}
        </p>
        {!isEmpty && (
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-[#9A8880] border border-[#EDE5DF] rounded-lg px-2 py-1 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors"
          >
            {copied ? <CheckCircle size={11} className="text-green-500" /> : <Copy size={11} />}
            {copied ? 'コピー済' : 'コピー'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function GoogleInfoPage() {
  const [tabelogUrl, setTabelogUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!tabelogUrl.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const response = await fetch('/api/google-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabelogUrl: tabelogUrl.trim() }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        raw += decoder.decode(value)
      }

      if (raw.startsWith('ERROR:RATE_LIMIT')) {
        setError('APIのレート制限に達しました。1分ほど待ってから再試行してください。')
      } else if (raw.startsWith('ERROR:')) {
        setError(raw.replace('ERROR:', '').trim())
      } else {
        setResult(parseResult(raw))
      }
    } catch {
      setError('取得に失敗しました。もう一度お試しください。')
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
            title="Google情報メーカー"
            description="食べログURLからGoogle口コミURLとPlace IDを自動取得"
            backHref="/"
          />

          <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-[#111008] mb-2">
              食べログURL <span className="text-[#E8320A]">*</span>
            </label>
            <input
              type="url"
              value={tabelogUrl}
              onChange={e => setTabelogUrl(e.target.value)}
              placeholder="https://tabelog.com/osaka/A2701/..."
              className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !tabelogUrl.trim()}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '検索中...' : '🔍 Google情報を取得する'}
          </button>

          {loading && (
            <div className="bg-white border border-[#EDE5DF] rounded-xl p-6 text-center mb-4">
              <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#111008]">Googleマップを検索中...</p>
              <p className="text-xs text-[#9A8880] mt-1">Place IDを特定しています</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-[#111008]">{result.shopName}</p>

              <CopyField label="Place ID" value={result.placeId} />
              <CopyField label="Google口コミURL" value={result.reviewUrl} />

              {result.mapsUrl && result.mapsUrl !== '情報なし' && (
                <a
                  href={result.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#E8320A] hover:underline"
                >
                  <ExternalLink size={12} />
                  Googleマップで確認する
                </a>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                取得したPlace IDとGoogle口コミURLは、店舗プロフィール設定画面から登録できます。
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
