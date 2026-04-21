'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { MenuCostItem } from '@/types'
import { Upload, X, Plus, ChevronRight, AlertTriangle, Sparkles } from 'lucide-react'

// ---------- 型定義 ----------
type Phase = 'upload' | 'confirm' | 'result'
type InputMode = 'photo' | 'manual'
type Quadrant = 'star' | 'improve' | 'hidden' | 'review'

type ConfirmRow = {
  id: string
  extractedName: string
  matchedId: string | null
  matchedName: string | null
  count: number | null
  confidence: 'high' | 'low'
}

type AnalyzedItem = {
  id: string
  menuName: string
  sellPrice: number
  costPrice: number
  profitRate: number
  count: number
  totalRevenue: number
  totalProfit: number
  quadrant: Quadrant
}

type Advice = {
  star: string
  improve: string
  hidden: string
  review: string
  overall: string
}

// ---------- 定数 ----------
const QUADRANT_CONFIG: Record<Quadrant, { label: string; icon: string; color: string; bg: string; border: string; desc: string }> = {
  star:    { label: 'スター',    icon: '⭐️', color: 'text-[#E8320A]', bg: 'bg-red-50',    border: 'border-[#E8320A]', desc: '注文多・利益率高' },
  improve: { label: '要改善',   icon: '🔧', color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-400',  desc: '注文多・利益率低' },
  hidden:  { label: '隠れた宝', icon: '💎', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400', desc: '注文少・利益率高' },
  review:  { label: '見直し',   icon: '⚠️', color: 'text-[#9CA3AF]', bg: 'bg-gray-50',   border: 'border-gray-300',  desc: '注文少・利益率低' },
}

// ---------- ユーティリティ ----------
function classifyItems(rows: ConfirmRow[], menuMap: Record<string, MenuCostItem>): AnalyzedItem[] {
  const valid = rows.filter(r => r.matchedId && r.count && r.count > 0 && menuMap[r.matchedId])
  if (valid.length === 0) return []

  const items = valid.map(r => {
    const m = menuMap[r.matchedId!]
    const profitRate = m.sell_price > 0 ? (m.sell_price - m.cost_price) / m.sell_price : 0
    return { matchedId: r.matchedId!, menuName: m.menu_name, sellPrice: m.sell_price, costPrice: m.cost_price, profitRate, count: r.count! }
  })

  const avgCount = items.reduce((s, i) => s + i.count, 0) / items.length
  const avgProfitRate = items.reduce((s, i) => s + i.profitRate, 0) / items.length

  return items.map((item, idx) => {
    const q: Quadrant =
      item.count > avgCount && item.profitRate > avgProfitRate ? 'star' :
      item.count > avgCount && item.profitRate <= avgProfitRate ? 'improve' :
      item.count <= avgCount && item.profitRate > avgProfitRate ? 'hidden' : 'review'
    return {
      id: `${idx}`,
      menuName: item.menuName,
      sellPrice: item.sellPrice,
      costPrice: item.costPrice,
      profitRate: item.profitRate,
      count: item.count,
      totalRevenue: item.sellPrice * item.count,
      totalProfit: (item.sellPrice - item.costPrice) * item.count,
      quadrant: q,
    }
  })
}

function parseAdvice(raw: string): Advice {
  const get = (key: string) => raw.match(new RegExp(`===${key}===([\\s\\S]*?)(?:===|$)`))?.[1]?.trim() ?? ''
  return { star: get('STAR'), improve: get('IMPROVE'), hidden: get('HIDDEN'), review: get('REVIEW'), overall: get('OVERALL') }
}

// ---------- サブコンポーネント ----------
function QuadrantCard({ quadrant, items, advice }: { quadrant: Quadrant; items: AnalyzedItem[]; advice: string }) {
  const cfg = QUADRANT_CONFIG[quadrant]
  return (
    <div className={`border-2 ${cfg.border} rounded-2xl overflow-hidden`}>
      <div className={`${cfg.bg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-lg">{cfg.icon}</span>
        <div>
          <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-[10px] text-[#9CA3AF]">{cfg.desc}</p>
        </div>
        <span className={`ml-auto text-lg font-bold ${cfg.color}`}>{items.length}</span>
      </div>
      <div className="bg-white px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] py-1">該当メニューなし</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[#F1F3F8] last:border-0">
              <p className="text-sm font-medium text-[#111827] flex-1 min-w-0 truncate">{item.menuName}</p>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <span className="text-xs text-[#6B7280]">{item.count}件</span>
                <span className="text-xs font-bold text-[#111827]">{Math.round(item.profitRate * 100)}%</span>
              </div>
            </div>
          ))
        )}
        {advice && (
          <div className={`mt-2 ${cfg.bg} rounded-xl p-3`}>
            <p className="text-xs font-bold text-[#6B7280] mb-1">💡 施策</p>
            <p className="text-xs text-[#111827] leading-relaxed">{advice}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- メインページ ----------
export default function AbcPage() {
  const { shopProfile } = useAppStore()
  const [phase, setPhase] = useState<Phase>('upload')
  const [inputMode, setInputMode] = useState<InputMode>('photo')
  const [menuCostItems, setMenuCostItems] = useState<MenuCostItem[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [confirmRows, setConfirmRows] = useState<ConfirmRow[]>([])
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([])
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const menuMap: Record<string, MenuCostItem> = Object.fromEntries(menuCostItems.map(m => [m.id, m]))

  useEffect(() => {
    if (!shopProfile?.id) return
    fetch(`/api/menu-cost?shopId=${shopProfile.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMenuCostItems(d.data) })
  }, [shopProfile?.id])

  // 写真から抽出
  const handleExtract = async () => {
    if (files.length === 0 || !shopProfile) return
    setExtracting(true)
    setExtractError('')
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('file', f))
      formData.append('menuNames', JSON.stringify(menuCostItems.map(m => m.menu_name)))

      const res = await fetch('/api/abc-extract', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const rows: ConfirmRow[] = json.data.map((row: { extracted: string; matched_name: string | null; count: number | null; confidence: 'high' | 'low' }, i: number) => {
        const matched = menuCostItems.find(m => m.menu_name === row.matched_name) ?? null
        return {
          id: `${i}`,
          extractedName: row.extracted,
          matchedId: matched?.id ?? null,
          matchedName: matched?.menu_name ?? null,
          count: row.count,
          confidence: row.confidence,
        }
      })
      setConfirmRows(rows)
      setPhase('confirm')
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : '読み取りに失敗しました')
    } finally {
      setExtracting(false)
    }
  }

  // 手入力で行追加
  const addManualRow = () => {
    setConfirmRows(prev => [...prev, {
      id: Date.now().toString(),
      extractedName: '',
      matchedId: menuCostItems[0]?.id ?? null,
      matchedName: menuCostItems[0]?.menu_name ?? null,
      count: null,
      confidence: 'high',
    }])
  }

  const updateRow = (id: string, patch: Partial<ConfirmRow>) => {
    setConfirmRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const deleteRow = (id: string) => {
    setConfirmRows(prev => prev.filter(r => r.id !== id))
  }

  // 分析実行
  const handleAnalyze = async () => {
    if (!shopProfile) return
    const items = classifyItems(confirmRows, menuMap)
    if (items.length === 0) return
    setAnalyzedItems(items)
    setAnalyzing(true)
    setPhase('result')

    try {
      const res = await fetch('/api/abc-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopProfile,
          items: items.map(i => ({ menuName: i.menuName, sellPrice: i.sellPrice, costPrice: i.costPrice, count: i.count, quadrant: i.quadrant }))
        }),
      })
      const json = await res.json()
      if (json.success) setAdvice(parseAdvice(json.data))
    } catch {
      // アドバイス取得失敗しても分析結果は表示する
    } finally {
      setAnalyzing(false)
    }
  }

  const validRowCount = confirmRows.filter(r => r.matchedId && r.count && r.count > 0).length
  const lowConfidenceCount = confirmRows.filter(r => r.confidence === 'low' || !r.matchedId).length

  // ---------- Upload フェーズ ----------
  if (phase === 'upload') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F1F3F8]">
          <Header />
          <div className="max-w-lg mx-auto px-4 py-6">
            <PageHeader title="メニューABC分析" description="注文数と利益率で全メニューを4象限に分類し、施策を自動提案" backHref="/" />

            {menuCostItems.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-amber-700">
                ⚠️ メニューの原価データがありません。先に <a href="/tools/fl" className="font-bold underline">FLコスト計算</a> でメニューを登録してください。
              </div>
            )}

            {/* モード切替 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setInputMode('photo')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${inputMode === 'photo' ? 'border-[#E8320A] bg-red-50' : 'border-[#E5E9F2] bg-white hover:border-[#E8320A]'}`}>
                <span className="text-2xl">📸</span>
                <span className={`text-xs font-bold ${inputMode === 'photo' ? 'text-[#E8320A]' : 'text-[#111827]'}`}>伝票写真から読み取り</span>
                <span className="text-[10px] text-[#9CA3AF] text-center">POS伝票・月次レポート<br />複数枚OK</span>
              </button>
              <button onClick={() => { setInputMode('manual'); setConfirmRows([]); setPhase('confirm') }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${inputMode === 'manual' ? 'border-[#E8320A] bg-red-50' : 'border-[#E5E9F2] bg-white hover:border-[#E8320A]'}`}>
                <span className="text-2xl">✏️</span>
                <span className={`text-xs font-bold ${inputMode === 'manual' ? 'text-[#E8320A]' : 'text-[#111827]'}`}>手入力</span>
                <span className="text-[10px] text-[#9CA3AF] text-center">メニューを選んで<br />注文数を入力</span>
              </button>
            </div>

            {inputMode === 'photo' && (
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-[#111827] mb-1">伝票・売上レポートの写真</p>
                <p className="text-xs text-[#6B7280] mb-3">POS日次レポート・月次集計表など複数枚添付できます</p>

                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => {
                  const newFiles = Array.from(e.target.files ?? [])
                  setFiles(prev => [...prev, ...newFiles])
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }} className="hidden" />

                {files.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <span className="text-base">🖼️</span>
                        <p className="text-xs font-medium text-[#111827] flex-1 truncate">{f.name}</p>
                        <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-[#9CA3AF] hover:text-[#E8320A]">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E9F2] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[#E8320A] hover:bg-red-50 transition-all">
                  <Upload size={22} className="text-[#6B7280]" />
                  <p className="text-xs font-bold text-[#111827]">写真を追加</p>
                  <p className="text-[10px] text-[#9CA3AF]">タップして選択</p>
                </div>

                {extractError && <p className="mt-2 text-xs text-[#E8320A] bg-red-50 rounded-xl px-3 py-2">{extractError}</p>}
              </div>
            )}

            {inputMode === 'photo' && (
              <button onClick={handleExtract} disabled={extracting || files.length === 0 || menuCostItems.length === 0}
                className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {extracting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />読み取り中...</>
                ) : (
                  <>📸 写真からメニューを読み取る</>
                )}
              </button>
            )}
          </div>
        </div>
      </AuthGuard>
    )
  }

  // ---------- Confirm フェーズ ----------
  if (phase === 'confirm') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F1F3F8]">
          <Header />
          <div className="max-w-lg mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPhase('upload')} className="text-[#6B7280] hover:text-[#111827] p-1 text-lg">‹</button>
              <div>
                <p className="text-base font-bold text-[#111827]">内容を確認してください</p>
                <p className="text-xs text-[#6B7280]">メニュー名・注文数を修正できます</p>
              </div>
            </div>

            {lowConfidenceCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700"><span className="font-bold">{lowConfidenceCount}件</span>が要確認です。黄色の行を確認してください。</p>
              </div>
            )}

            <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden mb-4">
              {confirmRows.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-8">まだデータがありません。下の「行を追加」から入力してください。</p>
              ) : (
                <div className="divide-y divide-[#F1F3F8]">
                  {confirmRows.map(row => {
                    const isWarning = row.confidence === 'low' || !row.matchedId
                    return (
                      <div key={row.id} className={`px-4 py-3 ${isWarning ? 'bg-amber-50' : ''}`}>
                        {row.extractedName && row.extractedName !== row.matchedName && (
                          <p className="text-[10px] text-[#9CA3AF] mb-1">読取：{row.extractedName}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <select
                            value={row.matchedId ?? ''}
                            onChange={e => {
                              const m = menuCostItems.find(m => m.id === e.target.value) ?? null
                              updateRow(row.id, { matchedId: m?.id ?? null, matchedName: m?.menu_name ?? null, confidence: 'high' })
                            }}
                            className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] bg-white ${isWarning ? 'border-amber-300' : 'border-[#E5E9F2]'}`}
                          >
                            <option value="">-- メニューを選択 --</option>
                            {menuCostItems.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
                          </select>
                          <input
                            type="number"
                            min={1}
                            placeholder="件数"
                            value={row.count ?? ''}
                            onChange={e => updateRow(row.id, { count: e.target.value ? Number(e.target.value) : null })}
                            className="w-20 border border-[#E5E9F2] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] text-right"
                          />
                          <button onClick={() => deleteRow(row.id)} className="text-[#9CA3AF] hover:text-[#E8320A] flex-shrink-0">
                            <X size={16} />
                          </button>
                        </div>
                        {row.matchedId && menuMap[row.matchedId] && (
                          <p className="text-[10px] text-[#9CA3AF] mt-1 pl-1">
                            売価 {menuMap[row.matchedId].sell_price.toLocaleString()}円　原価 {menuMap[row.matchedId].cost_price.toLocaleString()}円　利益率 {Math.round((menuMap[row.matchedId].sell_price - menuMap[row.matchedId].cost_price) / menuMap[row.matchedId].sell_price * 100)}%
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button onClick={addManualRow}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#E5E9F2] rounded-xl py-3 text-sm text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] transition-colors mb-4">
              <Plus size={14} />行を追加
            </button>

            <button onClick={handleAnalyze} disabled={validRowCount < 2}
              className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <ChevronRight size={16} />
              {validRowCount}品を分析する
            </button>
            {validRowCount < 2 && (
              <p className="text-xs text-[#9CA3AF] text-center mt-2">2品以上のデータが必要です</p>
            )}
          </div>
        </div>
      </AuthGuard>
    )
  }

  // ---------- Result フェーズ ----------
  const quadrants: Quadrant[] = ['star', 'improve', 'hidden', 'review']
  const totalRevenue = analyzedItems.reduce((s, i) => s + i.totalRevenue, 0)
  const totalProfit = analyzedItems.reduce((s, i) => s + i.totalProfit, 0)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => { setPhase('confirm'); setAdvice(null) }} className="text-[#6B7280] hover:text-[#111827] p-1 text-lg">‹</button>
            <div>
              <p className="text-base font-bold text-[#111827]">メニューABC分析結果</p>
              <p className="text-xs text-[#6B7280]">{analyzedItems.length}品を分析</p>
            </div>
          </div>

          {/* サマリーカード */}
          <div className="bg-[#111008] rounded-2xl px-5 py-4 mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#9A8880] mb-0.5">合計売上</p>
              <p className="text-lg font-bold text-white">{totalRevenue.toLocaleString()}<span className="text-xs text-[#9A8880]">円</span></p>
            </div>
            <div>
              <p className="text-xs text-[#9A8880] mb-0.5">合計粗利</p>
              <p className="text-lg font-bold text-[#E8320A]">{totalProfit.toLocaleString()}<span className="text-xs text-[#9A8880]">円</span></p>
            </div>
          </div>

          {/* 4象限 */}
          <div className="space-y-3 mb-6">
            {quadrants.map(q => (
              <QuadrantCard
                key={q}
                quadrant={q}
                items={analyzedItems.filter(i => i.quadrant === q)}
                advice={advice?.[q] ?? ''}
              />
            ))}
          </div>

          {/* AIアドバイス総評 */}
          {analyzing && (
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 text-center">
              <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#111827]">AIが施策を考えています...</p>
            </div>
          )}

          {advice?.overall && (
            <div className="bg-white border-2 border-[#E8320A] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#E8320A]" />
                <p className="text-sm font-bold text-[#111827]">AI総評</p>
              </div>
              <p className="text-sm text-[#111827] leading-relaxed">{advice.overall}</p>
            </div>
          )}

          {/* 再分析 */}
          <button onClick={() => { setPhase('upload'); setFiles([]); setConfirmRows([]); setAnalyzedItems([]); setAdvice(null) }}
            className="w-full mt-4 border-2 border-[#E5E9F2] bg-white rounded-xl py-3 text-sm font-bold text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] transition-colors">
            別の期間で再分析
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
