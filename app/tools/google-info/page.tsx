'use client'

import { useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Copy, CheckCircle, ExternalLink, RotateCcw } from 'lucide-react'

type Result = { shopName?: string; address?: string; placeId: string; reviewUrl: string; mapsUrl: string }
type Phase = 'input' | 'generating' | 'done'

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
  const [phase, setPhase] = useState<Phase>('input')
  const [mapsUrl, setMapsUrl] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const reset = () => {
    setPhase('input')
    setResult(null)
    setError('')
  }

  const handleGenerate = async () => {
    if (!mapsUrl.trim()) return
    setError('')
    setResult(null)
    setPhase('generating')

    try {
      const res = await fetch('/api/google-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapsUrl: mapsUrl.trim() }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || '取得に失敗しました。')
        setPhase('input')
      } else {
        setResult(json)
        setPhase('done')
      }
    } catch {
      setError('取得に失敗しました。もう一度お試しください。')
      setPhase('input')
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="Google情報メーカー"
            description="Google口コミURLとPlace IDを自動取得"
            backHref="/"
          />

          {/* 入力フェーズ */}
          {phase === 'input' && (
            <>
              {error && (
                <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-[#111008] mb-0.5">GoogleマップのURLで取得</p>
                <p className="text-xs text-[#9A8880] mb-3">Googleマップアプリで「共有」→「リンクをコピー」で取得したURLを貼り付けてください</p>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={e => setMapsUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleGenerate() } }}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] mb-3"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!mapsUrl.trim()}
                  className="w-full bg-[#E8320A] text-white rounded-xl py-3 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔍 URLから取得する
                </button>
              </div>

              <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl px-4 py-3 text-xs text-[#9A8880] space-y-1.5">
                <p className="font-bold text-[#111008]">📌 URLの取得方法</p>
                <p>① Googleマップアプリでお店を検索して開く</p>
                <p>② 右上の「共有」ボタン（📤）をタップ</p>
                <p>③ 「リンクをコピー」で <span className="font-medium text-[#111008]">maps.app.goo.gl/...</span> のURLを取得</p>
                <p>④ そのURLをここに貼り付ける</p>
              </div>
            </>
          )}

          {/* 取得中 */}
          {phase === 'generating' && (
            <div className="bg-white border border-[#EDE5DF] rounded-xl p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#111008]">情報を取得中...</p>
            </div>
          )}

          {/* 結果 */}
          {phase === 'done' && result && (
            <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  {result.shopName && <p className="text-sm font-bold text-[#111008]">{result.shopName}</p>}
                  {result.address && <p className="text-xs text-[#9A8880]">{result.address}</p>}
                </div>
                <button onClick={reset} className="text-xs text-[#9A8880] hover:text-[#E8320A] flex items-center gap-1">
                  <RotateCcw size={12} /> やり直す
                </button>
              </div>

              <CopyField label="Place ID" value={result.placeId} />
              <CopyField label="Google口コミURL" value={result.reviewUrl} />

              <div className="flex gap-3">
                {result.mapsUrl && (
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
                <a
                  href="/setup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#9A8880] hover:text-[#111008] hover:underline"
                >
                  <ExternalLink size={12} />
                  店舗プロフィールを編集する
                </a>
              </div>

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
