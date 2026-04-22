'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Search, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Plus, Trash2, ListChecks, Camera, FileText, X } from 'lucide-react'

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

type BatchItem = {
  id: string
  menuName: string
  price: number
  category: string
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
  const [batchMode, setBatchMode] = useState(false)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [files, setFiles] = useState<File[]>([])
  const [extracting, setExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canCheck = menuName.trim() && price && Number(price) > 0 && !!shopProfile
  const canBatchAdd = menuName.trim() && price && Number(price) > 0

  const addToBatch = () => {
    if (!canBatchAdd) return
    setBatchItems(prev => [...prev, {
      id: Date.now().toString(),
      menuName: menuName.trim(),
      price: Number(price),
      category,
    }])
    setMenuName('')
    setPrice('')
    setCategory('')
  }

  const removeBatchItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleExtractFromFiles = async () => {
    if (files.length === 0) return
    setExtracting(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('file', f))

      const res = await fetch('/api/price-extract', { method: 'POST', body: formData })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || '読み取りに失敗しました')
        return
      }

      const items: BatchItem[] = (json.data as { menu_name: string; sell_price: number | null; category: string }[])
        .filter(d => d.menu_name && d.sell_price && d.sell_price > 0)
        .map(d => ({
          id: Date.now().toString() + Math.random(),
          menuName: d.menu_name,
          price: d.sell_price as number,
          category: d.category || '',
        }))

      if (items.length === 0) {
        setError('メニュー情報を読み取れませんでした。写真が鮮明か確認してください。')
        return
      }

      setBatchItems(prev => [...prev, ...items])
      setFiles([])
    } catch {
      setError('ファイルの読み取りに失敗しました。もう一度お試しください。')
    } finally {
      setExtracting(false)
    }
  }

  const checkSingleItem = async (item: { menuName: string; price: number; category: string }): Promise<CheckResult | null> => {
    if (!shopProfile) return null

    const response = await fetch('/api/price-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopProfile, menuName: item.menuName, price: item.price, category: item.category }),
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

    if (raw.startsWith('ERROR:')) return null

    const parsed = parseResult(raw)
    if (!parsed) return null

    return {
      id: Date.now().toString() + Math.random(),
      menuName: item.menuName,
      price: item.price,
      category: item.category,
      ...parsed,
    }
  }

  const handleCheck = async () => {
    if (!canCheck || !shopProfile) return
    setError('')
    setStreamText('')
    setLoading(true)

    try {
      const result = await checkSingleItem({ menuName: menuName.trim(), price: Number(price), category })
      if (result) {
        setResults(prev => [result, ...prev])
        setMenuName('')
        setPrice('')
        setCategory('')
      } else {
        setError('結果の解析に失敗しました。もう一度お試しください。')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '調査に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }

  const handleBatchCheck = async () => {
    if (batchItems.length === 0 || !shopProfile) return
    setError('')
    setStreamText('')
    setLoading(true)
    setBatchProgress({ current: 0, total: batchItems.length })

    const newResults: CheckResult[] = []
    let failCount = 0

    for (let i = 0; i < batchItems.length; i++) {
      setBatchProgress({ current: i + 1, total: batchItems.length })
      try {
        const result = await checkSingleItem(batchItems[i])
        if (result) {
          newResults.push(result)
          setResults(prev => [result, ...prev])
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
      setStreamText('')
    }

    setBatchItems([])
    setBatchProgress({ current: 0, total: 0 })
    setLoading(false)

    if (failCount > 0) {
      setError(`${batchItems.length}件中${failCount}件の調査に失敗しました`)
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

          {/* モード切替 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBatchMode(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${!batchMode ? 'bg-[#E8320A] text-white' : 'bg-white text-[#6B7280] border border-[#E5E9F2]'}`}
            >
              <Search size={14} className="inline mr-1.5 -mt-0.5" />
              1件ずつチェック
            </button>
            <button
              onClick={() => setBatchMode(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${batchMode ? 'bg-[#E8320A] text-white' : 'bg-white text-[#6B7280] border border-[#E5E9F2]'}`}
            >
              <ListChecks size={14} className="inline mr-1.5 -mt-0.5" />
              一括チェック
            </button>
          </div>

          {/* 入力フォーム */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111827] mb-3">
              {batchMode ? 'メニューを追加' : 'チェックするメニュー'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6B7280] mb-1 block">メニュー名 <span className="text-[#E8320A]">*</span></label>
                <input
                  type="text"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  onKeyDown={e => { if (batchMode && e.key === 'Enter' && canBatchAdd) addToBatch() }}
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

          {/* 一括モード：リストに追加ボタン + ファイル添付 */}
          {batchMode && (
            <>
              <button
                onClick={addToBatch}
                disabled={loading || extracting || !canBatchAdd}
                className="w-full bg-white border-2 border-dashed border-[#E8320A] text-[#E8320A] rounded-xl py-3 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                リストに追加
              </button>

              {/* ファイル添付エリア */}
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-[#111827] mb-1">メニュー表から自動読み取り</p>
                <p className="text-xs text-[#6B7280] mb-3">写真・PDF・CSV/Excelを添付するとAIがメニューと価格を抽出します</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.csv,.xlsx,.xls"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || extracting}
                  className="w-full border-2 border-dashed border-[#9CA3AF] rounded-xl py-4 text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Camera size={18} />
                  <span className="text-sm font-bold">写真・ファイルを追加</span>
                </button>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#F1F3F8] rounded-lg px-3 py-2">
                        <FileText size={14} className="text-[#6B7280] flex-shrink-0" />
                        <span className="text-xs text-[#111827] flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-[#9CA3AF] flex-shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                        <button onClick={() => removeFile(i)} className="text-[#9CA3AF] hover:text-[#E8320A]">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleExtractFromFiles}
                      disabled={extracting || loading}
                      className="w-full bg-[#111827] text-white rounded-xl py-3 font-bold text-sm hover:bg-[#1f2937] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {extracting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          読み取り中...
                        </>
                      ) : (
                        <>
                          <Camera size={14} />
                          {files.length}件のファイルからメニューを読み取る
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* バッチリスト */}
              {batchItems.length > 0 && (
                <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-[#6B7280] mb-3">
                    チェックリスト — {batchItems.length}件
                  </p>
                  <div className="space-y-2">
                    {batchItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[#F1F3F8] rounded-xl px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#111827] truncate">{item.menuName}</p>
                          <p className="text-xs text-[#6B7280]">{item.price.toLocaleString()}円{item.category ? ` · ${item.category}` : ''}</p>
                        </div>
                        <button
                          onClick={() => removeBatchItem(item.id)}
                          disabled={loading}
                          className="text-[#9CA3AF] hover:text-[#E8320A] transition-colors ml-2 flex-shrink-0 disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBatchCheck}
                disabled={loading || batchItems.length === 0 || !shopProfile}
                className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
              >
                <ListChecks size={16} />
                {loading
                  ? `調査中... (${batchProgress.current}/${batchProgress.total})`
                  : `${batchItems.length}件をまとめてチェック`}
              </button>
            </>
          )}

          {/* 単品モード：チェックボタン */}
          {!batchMode && (
            <button
              onClick={handleCheck}
              disabled={loading || !canCheck}
              className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
            >
              <Search size={16} />
              {loading ? 'Web検索で相場を調査中...' : '相場をチェックする'}
            </button>
          )}

          {/* ストリーミング中 */}
          {loading && (
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 text-center mb-6">
              <div className="w-10 h-10 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-[#111827] text-sm">
                {batchMode
                  ? `Web検索で相場を調査中... (${batchProgress.current}/${batchProgress.total})`
                  : 'Web検索で相場を調査中...'}
              </p>
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
