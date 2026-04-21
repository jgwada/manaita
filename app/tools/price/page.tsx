'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Search, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'

type Verdict = '高め' | '適正' | '安め'

type CheckResult = {
  id: string
  menuName: string
  price: number
  category: string
  verdict: Verdict
  range: string
  reason: string
  advice: string
}

const CATEGORIES = ['料理', 'ドリンク', 'デザート', 'コース', 'その他']

function parseResult(raw: string): Omit<CheckResult, 'id' | 'menuName' | 'price' | 'category'> | null {
  const get = (key: string) => {
    const regex = new RegExp(`===${key}===([\\s\\S]*?)(?:===|$)`)
    return raw.match(regex)?.[1]?.trim() ?? ''
  }
  const verdict = get('VERDICT')
  if (!verdict) return null
  return {
    verdict: (verdict.includes('高め') ? '高め' : verdict.includes('安め') ? '安め' : '適正') as Verdict,
    range: get('RANGE'),
    reason: get('REASON'),
    advice: get('ADVICE'),
  }
}

const VERDICT_CONFIG: Record<Verdict, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  高め: {
    icon: <TrendingUp size={18} />,
    color: 'text-[#E8320A]',
    bg: 'bg-red-50',
    border: 'border-[#E8320A]',
    label: '相場より高め',
  },
  適正: {
    icon: <Minus size={18} />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-500',
    label: '相場に適正',
  },
  安め: {
    icon: <TrendingDown size={18} />,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    label: '相場より安め',
  },
}

function ResultCard({ result }: { result: CheckResult }) {
  const [open, setOpen] = useState(true)
  const cfg = VERDICT_CONFIG[result.verdict]

  return (
    <div className={`bg-white border-2 ${cfg.border} rounded-2xl overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full ${cfg.bg} px-5 py-4 flex items-center gap-3`}
      >
        <div className={`${cfg.color} flex-shrink-0`}>{cfg.icon}</div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111827] text-sm">{result.menuName}</p>
          <p className="text-xs text-[#6B7280]">{result.price.toLocaleString()}円 · {result.category || 'カテゴリ未指定'}</p>
        </div>
        <div className={`flex items-center gap-2 flex-shrink-0`}>
          <span className={`text-sm font-bold ${cfg.color}`}>{result.verdict}</span>
          {open ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
        </div>
      </button>

      {open && (
        <div className="px-5 py-4 space-y-4">
          {result.range && (
            <div className="flex items-center justify-between bg-[#F1F3F8] rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-[#6B7280]">相場レンジ</p>
              <p className={`text-sm font-bold ${cfg.color}`}>{result.range}</p>
            </div>
          )}

          {result.reason && (
            <div>
              <p className="text-xs font-bold text-[#6B7280] mb-1.5">📊 判定理由</p>
              <p className="text-sm text-[#111827] leading-relaxed">{result.reason}</p>
            </div>
          )}

          {result.advice && (
            <div className={`${cfg.bg} rounded-xl p-3`}>
              <p className="text-xs font-bold text-[#6B7280] mb-1">💡 アドバイス</p>
              <p className="text-sm text-[#111827] leading-relaxed">{result.advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PriceCheckPage() {
  const { shopProfile } = useAppStore()
  const [menuName, setMenuName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<CheckResult[]>([])

  const canCheck = menuName.trim() && price && Number(price) > 0 && !!shopProfile

  const handleCheck = async () => {
    if (!canCheck || !shopProfile) return
    setError('')
    setStreamText('')
    setLoading(true)

    try {
      const response = await fetch('/api/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopProfile, menuName: menuName.trim(), price: Number(price), category }),
      })

      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `エラーが発生しました (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        raw += decoder.decode(value)
        setStreamText(raw)
      }

      if (raw.startsWith('ERROR:')) {
        setError(raw.replace('ERROR:', '').trim())
      } else {
        const parsed = parseResult(raw)
        if (parsed) {
          setResults(prev => [{
            id: Date.now().toString(),
            menuName: menuName.trim(),
            price: Number(price),
            category,
            ...parsed,
          }, ...prev])
          setMenuName('')
          setPrice('')
          setCategory('')
        } else {
          setError('結果の解析に失敗しました。もう一度お試しください。')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '調査に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="価格相場チェッカー"
            description="メニューの価格がエリア・業態の相場と比べて高め・適正・安めかをAIが判定"
            backHref="/"
          />

          {/* 入力フォーム */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111827] mb-3">チェックするメニュー</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6B7280] mb-1 block">メニュー名 <span className="text-[#E8320A]">*</span></label>
                <input
                  type="text"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  placeholder="例：生ビール、ランチセット、刺身盛り合わせ"
                  className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">価格（円） <span className="text-[#E8320A]">*</span></label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="例：580"
                    min={1}
                    className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">カテゴリ <span className="text-[#9CA3AF]">（任意）</span></label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] bg-white"
                  >
                    <option value="">未選択</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading || !canCheck}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
          >
            <Search size={16} />
            {loading ? 'Web検索で相場を調査中...' : '相場をチェックする'}
          </button>

          {/* ストリーミング中 */}
          {loading && (
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 text-center mb-6">
              <div className="w-10 h-10 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-[#111827] text-sm">Web検索で相場を調査中...</p>
              <p className="text-xs text-[#6B7280] mt-1">
                {shopProfile?.area}の{shopProfile?.industry}の相場を確認しています
              </p>
              {streamText && (
                <p className="text-xs text-[#9CA3AF] mt-3 text-left bg-[#F1F3F8] rounded-xl p-3 leading-relaxed line-clamp-3">
                  {streamText.slice(-120)}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* 結果一覧 */}
          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">
                チェック結果 — {results.length}件
              </p>
              {results.map(r => <ResultCard key={r.id} result={r} />)}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
