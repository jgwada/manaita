'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Calculator, Plus, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Minus, Users, History } from 'lucide-react'
import { FLMonthlyRecord, MenuCostItem, StaffRow } from '@/types'

type HistoryRecord = Pick<FLMonthlyRecord, 'id' | 'year' | 'month' | 'revenue' | 'food_cost' | 'beverage_cost' | 'labor_cost' | 'fl_ratio' | 'food_ratio' | 'beverage_ratio' | 'labor_ratio'>

function fmt(n: number) { return n.toLocaleString('ja-JP') }
function parseNum(s: string) { return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0 }
function newStaff(): StaffRow { return { id: crypto.randomUUID(), name: '', type: 'hourly', hourlyWage: 0, hours: 0, monthlySalary: 0 } }
function staffSubtotal(s: StaffRow) { return s.type === 'salary' ? s.monthlySalary : s.hourlyWage * s.hours }

function FlGauge({ ratio }: { ratio: number }) {
  const pct = Math.min(ratio, 100)
  const color = ratio < 55 ? '#16a34a' : ratio < 60 ? '#ca8a04' : '#dc2626'
  const label = ratio < 55 ? '健全' : ratio < 60 ? '要注意' : '危険'
  const barColor = ratio < 55 ? 'bg-green-500' : ratio < 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="text-center py-4">
      <div className="text-5xl font-bold" style={{ color }}>{ratio.toFixed(1)}%</div>
      <div className="text-sm font-bold mt-1" style={{ color }}>{label}</div>
      <div className="mt-3 mx-auto max-w-xs">
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
          <span>0%</span><span>55% 目安</span><span>100%</span>
        </div>
        <div className="h-3 bg-[#F1F3F8] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function RatioBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-36 text-[#6B7280] text-xs flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 text-right text-xs font-medium text-[#111827]">{value.toFixed(1)}%</span>
    </div>
  )
}

export default function FlPage() {
  const { shopProfile } = useAppStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [record, setRecord] = useState<FLMonthlyRecord | null>(null)
  const [prevRecord, setPrevRecord] = useState<FLMonthlyRecord | null>(null)
  const [menuItems, setMenuItems] = useState<MenuCostItem[]>([])

  // form inputs
  const [revenue, setRevenue] = useState('')
  const [foodCost, setFoodCost] = useState('')
  const [beverageCost, setBeverageCost] = useState('')
  const [staffRows, setStaffRows] = useState<StaffRow[]>([newStaff()])

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showCopyBanner, setShowCopyBanner] = useState(false)

  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // menu cost form
  const [menuName, setMenuName] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [menuCategory, setMenuCategory] = useState<'food' | 'beverage'>('food')
  const [addingMenu, setAddingMenu] = useState(false)

  const loadData = useCallback(async () => {
    if (!shopProfile?.id) return
    setSaved(false)
    const res = await fetch(`/api/fl?shopId=${shopProfile.id}&year=${year}&month=${month}`)
    const json = await res.json()
    if (json.success) {
      setRecord(json.data)
      setPrevRecord(json.prevData)
      if (json.data) {
        setRevenue(json.data.revenue > 0 ? fmt(json.data.revenue) : '')
        setFoodCost(json.data.food_cost > 0 ? fmt(json.data.food_cost) : '')
        setBeverageCost(json.data.beverage_cost > 0 ? fmt(json.data.beverage_cost) : '')
        setStaffRows(json.data.staff_details?.length ? json.data.staff_details : [newStaff()])
        setSaved(true)
        setShowCopyBanner(false)
      } else {
        setRevenue('')
        setFoodCost('')
        setBeverageCost('')
        setStaffRows([newStaff()])
        setShowCopyBanner(!!json.prevData)
      }
    }
  }, [shopProfile?.id, year, month])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!shopProfile?.id) return
    fetch(`/api/menu-cost?shopId=${shopProfile.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMenuItems(d.data) })
    fetch(`/api/fl?shopId=${shopProfile.id}&history=true`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.data ?? []) })
  }, [shopProfile?.id])

  const loadLatestStaff = async () => {
    if (!shopProfile?.id) return
    const res = await fetch(`/api/fl?shopId=${shopProfile.id}&latestStaff=true`)
    const json = await res.json()
    if (json.success && json.data?.staff_details?.length) {
      setStaffRows(json.data.staff_details.map((s: StaffRow) => ({ ...s })))
    }
  }

  const copyFromPrev = () => {
    if (!prevRecord) return
    setRevenue('')
    setFoodCost(prevRecord.food_cost > 0 ? fmt(prevRecord.food_cost) : '')
    setBeverageCost(prevRecord.beverage_cost > 0 ? fmt(prevRecord.beverage_cost) : '')
    setStaffRows(prevRecord.staff_details?.length ? prevRecord.staff_details.map(s => ({ ...s })) : [newStaff()])
    setShowCopyBanner(false)
  }

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setYear(y); setMonth(m)
  }

  const laborTotal = staffRows.reduce((sum, s) => sum + staffSubtotal(s), 0)
  const revenueNum = parseNum(revenue)
  const foodNum = parseNum(foodCost)
  const bevNum = parseNum(beverageCost)
  const fTotal = foodNum + bevNum

  const handleSave = async () => {
    setSaveError('')
    if (!shopProfile?.id) { setSaveError('店舗情報が読み込めていません。ページを再読み込みしてください。'); return }
    if (revenueNum === 0) { setSaveError('売上を入力してください'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/fl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopProfile.id, year, month,
          revenue: revenueNum, foodCost: foodNum, beverageCost: bevNum, laborCost: laborTotal,
          staffDetails: staffRows.filter(s => s.name || s.hourlyWage || s.hours || s.monthlySalary),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setRecord(json.data)
        setSaved(true)
        setHistory(prev => {
          const filtered = prev.filter(h => !(h.year === year && h.month === month))
          return [json.data, ...filtered].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
        })
      } else {
        setSaveError(json.error ?? '保存に失敗しました')
      }
    } catch (e) {
      setSaveError('通信エラーが発生しました')
    }
    setSaving(false)
  }


  const addMenuItem = async () => {
    if (!shopProfile?.id || !menuName || !sellPrice || !costPrice) return
    setAddingMenu(true)
    const res = await fetch('/api/menu-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shopProfile.id, menuName, sellPrice: parseNum(sellPrice), costPrice: parseNum(costPrice), category: menuCategory }),
    })
    const json = await res.json()
    if (json.success) {
      setMenuItems(prev => [...prev, json.data])
      setMenuName(''); setSellPrice(''); setCostPrice('')
    }
    setAddingMenu(false)
  }

  const deleteMenuItem = async (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id))
    await fetch(`/api/menu-cost?id=${id}`, { method: 'DELETE' })
  }

  const inputCls = "w-full border border-[#E5E9F2] rounded-lg px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white"

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PageHeader title="FLコスト計算" description="食材費・人件費の比率で経営の健全度を確認" />

          {/* 月ナビゲーション */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-colors">
              <ChevronLeft size={18} className="text-[#6B7280]" />
            </button>
            <span className="text-base font-bold text-[#111827] min-w-[120px] text-center">{year}年{month}月</span>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white rounded-lg transition-colors">
              <ChevronRight size={18} className="text-[#6B7280]" />
            </button>
          </div>

          {/* 前月コピーバナー */}
          {showCopyBanner && prevRecord && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-[#111827]">前月（{prevRecord.year}年{prevRecord.month}月）のスタッフ情報を引き継ぎますか？</p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={copyFromPrev} className="text-xs font-bold text-white bg-[#E8320A] rounded-lg px-3 py-1.5 hover:bg-[#c92b09] transition-colors">引き継ぐ</button>
                <button onClick={() => setShowCopyBanner(false)} className="text-xs text-[#6B7280] border border-[#E5E9F2] rounded-lg px-3 py-1.5 hover:border-[#111827] transition-colors">新規入力</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* 売上 */}
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3">今月の売上</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text" inputMode="numeric" value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  onBlur={e => { const n = parseNum(e.target.value); if (n > 0) setRevenue(fmt(n)) }}
                  onFocus={e => setRevenue(e.target.value.replace(/,/g, ''))}
                  placeholder="1,000,000"
                  className={inputCls}
                />
                <span className="text-sm text-[#6B7280] flex-shrink-0">円</span>
              </div>
            </div>

            {/* 食材費 */}
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3">F（食材費）</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">フード仕入れ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric" value={foodCost}
                      onChange={e => setFoodCost(e.target.value)}
                      onBlur={e => { const n = parseNum(e.target.value); if (n > 0) setFoodCost(fmt(n)) }}
                      onFocus={e => setFoodCost(e.target.value.replace(/,/g, ''))}
                      placeholder="300,000"
                      className={inputCls}
                    />
                    <span className="text-sm text-[#6B7280] flex-shrink-0">円</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">ビバレッジ仕入れ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric" value={beverageCost}
                      onChange={e => setBeverageCost(e.target.value)}
                      onBlur={e => { const n = parseNum(e.target.value); if (n > 0) setBeverageCost(fmt(n)) }}
                      onFocus={e => setBeverageCost(e.target.value.replace(/,/g, ''))}
                      placeholder="80,000"
                      className={inputCls}
                    />
                    <span className="text-sm text-[#6B7280] flex-shrink-0">円</span>
                  </div>
                </div>
                {(foodNum > 0 || bevNum > 0) && (
                  <div className="flex justify-end text-xs text-[#6B7280]">
                    食材費合計：<span className="font-bold text-[#111827] ml-1">{fmt(fTotal)}円</span>
                  </div>
                )}
              </div>
            </div>

            {/* 人件費 */}
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#111827]">L（人件費）</h3>
                <button
                  onClick={loadLatestStaff}
                  className="flex items-center gap-1 text-xs text-[#6B7280] border border-[#E5E9F2] rounded-lg px-2.5 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors"
                >
                  <Users size={11} />前回のスタッフを読み込む
                </button>
              </div>
              <div className="space-y-2">
                {staffRows.map((row, i) => (
                  <div key={row.id} className="space-y-1.5 pb-2.5 border-b border-[#F1F3F8] last:border-0">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text" value={row.name}
                        onChange={e => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                        placeholder="田中 花子"
                        className="flex-1 border border-[#E5E9F2] rounded-lg px-2 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white"
                      />
                      {/* 時給／月給 切替 */}
                      <div className="flex rounded-lg border border-[#E5E9F2] overflow-hidden text-[10px] flex-shrink-0">
                        <button
                          onClick={() => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, type: 'hourly' } : s))}
                          className={`px-2 py-2 transition-colors ${row.type === 'hourly' ? 'bg-[#E8320A] text-white font-bold' : 'bg-white text-[#6B7280]'}`}
                        >時給</button>
                        <button
                          onClick={() => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, type: 'salary' } : s))}
                          className={`px-2 py-2 transition-colors ${row.type === 'salary' ? 'bg-[#E8320A] text-white font-bold' : 'bg-white text-[#6B7280]'}`}
                        >月給</button>
                      </div>
                      <button
                        onClick={() => setStaffRows(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev)}
                        className="flex items-center justify-center text-[#C4C9D4] hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Minus size={14} />
                      </button>
                    </div>

                    {row.type === 'hourly' ? (
                      <div className="grid grid-cols-[1fr_1fr_80px] gap-1.5 items-center">
                        <div className="flex items-center gap-1">
                          <input
                            type="text" inputMode="numeric" value={row.hourlyWage || ''}
                            onChange={e => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, hourlyWage: parseInt(e.target.value) || 0 } : s))}
                            placeholder="時給"
                            className="w-full border border-[#E5E9F2] rounded-lg px-2 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white text-right"
                          />
                          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">円</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text" inputMode="numeric" value={row.hours || ''}
                            onChange={e => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, hours: parseInt(e.target.value) || 0 } : s))}
                            placeholder="時間数"
                            className="w-full border border-[#E5E9F2] rounded-lg px-2 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white text-right"
                          />
                          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">h</span>
                        </div>
                        <div className="text-xs text-[#6B7280] text-right">
                          {row.hourlyWage && row.hours ? <span className="font-bold text-[#111827]">{fmt(row.hourlyWage * row.hours)}円</span> : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_80px] gap-1.5 items-center">
                        <div className="flex items-center gap-1">
                          <input
                            type="text" inputMode="numeric" value={row.monthlySalary || ''}
                            onChange={e => setStaffRows(prev => prev.map((s, j) => j === i ? { ...s, monthlySalary: parseInt(e.target.value.replace(/,/g, '')) || 0 } : s))}
                            placeholder="月給（例：250,000）"
                            className="w-full border border-[#E5E9F2] rounded-lg px-2 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white text-right"
                          />
                          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">円/月</span>
                        </div>
                        <div className="text-xs text-right">
                          {row.monthlySalary ? <span className="font-bold text-[#111827]">{fmt(row.monthlySalary)}円</span> : '—'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setStaffRows(prev => [...prev, newStaff()])}
                  className="flex items-center gap-1 text-xs text-[#E8320A] hover:underline mt-1"
                >
                  <Plus size={12} />スタッフを追加
                </button>
                {laborTotal > 0 && (
                  <div className="flex justify-end text-xs text-[#6B7280] pt-1 border-t border-[#F1F3F8]">
                    人件費合計：<span className="font-bold text-[#111827] ml-1">{fmt(laborTotal)}円</span>
                  </div>
                )}
              </div>
            </div>

            {/* 計算ボタン */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#E8320A] text-white font-bold py-3.5 rounded-2xl hover:bg-[#c92b09] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={16} />}
              {saving ? '計算中...' : '計算する'}
            </button>
            {saveError && <p className="text-xs text-red-500 text-center -mt-2">{saveError}</p>}

            {/* 計算結果 */}
            {saved && record?.fl_ratio != null && (
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#111827]">計算結果</h3>

                <FlGauge ratio={record.fl_ratio} />

                {/* 先月比 */}
                {prevRecord?.fl_ratio != null && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-[#6B7280]">先月 {prevRecord.fl_ratio.toFixed(1)}%</span>
                    <span className="text-[#9CA3AF]">→</span>
                    {record.fl_ratio > prevRecord.fl_ratio ? (
                      <span className="flex items-center gap-0.5 text-red-500 font-bold">
                        <TrendingUp size={14} />+{(record.fl_ratio - prevRecord.fl_ratio).toFixed(1)}pt 悪化
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-green-600 font-bold">
                        <TrendingDown size={14} />{(record.fl_ratio - prevRecord.fl_ratio).toFixed(1)}pt 改善
                      </span>
                    )}
                  </div>
                )}

                {/* 内訳バー */}
                <div className="space-y-2 pt-2 border-t border-[#F1F3F8]">
                  {record.food_ratio != null && <RatioBar label="フード原価率" value={record.food_ratio} color="#f97316" />}
                  {record.beverage_ratio != null && <RatioBar label="ビバレッジ原価率" value={record.beverage_ratio} color="#fb923c" />}
                  {record.labor_ratio != null && <RatioBar label="人件費率" value={record.labor_ratio} color="#60a5fa" />}
                </div>

                {/* 金額サマリー */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F1F3F8]">
                  {[
                    { label: '売上', value: record.revenue },
                    { label: 'フード仕入れ', value: record.food_cost },
                    { label: 'ビバレッジ仕入れ', value: record.beverage_cost },
                    { label: '人件費', value: record.labor_cost },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#F9FAFB] rounded-lg px-3 py-2">
                      <div className="text-[10px] text-[#9CA3AF]">{label}</div>
                      <div className="text-sm font-bold text-[#111827]">{fmt(value)}円</div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* メニュー別原価率 */}
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3">メニュー別原価率</h3>

              {menuItems.length > 0 && (
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-[1fr_72px_72px_64px_28px] gap-1.5 text-[10px] text-[#9CA3AF] px-1 mb-1">
                    <span>メニュー名</span><span className="text-right">売価</span><span className="text-right">原価</span><span className="text-right">原価率</span><span />
                  </div>
                  {menuItems.map(item => {
                    const ratio = item.sell_price > 0 ? (item.cost_price / item.sell_price) * 100 : 0
                    const threshold = item.category === 'food' ? 35 : 25
                    const ok = ratio <= threshold
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_72px_72px_64px_28px] gap-1.5 items-center py-1.5 border-b border-[#F1F3F8] last:border-0">
                        <div>
                          <div className="text-xs text-[#111827]">{item.menu_name}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{item.category === 'food' ? 'フード' : 'ビバレッジ'}</div>
                        </div>
                        <div className="text-xs text-right text-[#6B7280]">{fmt(item.sell_price)}円</div>
                        <div className="text-xs text-right text-[#6B7280]">{fmt(item.cost_price)}円</div>
                        <div className={`text-xs text-right font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>
                          {ratio.toFixed(1)}% {ok ? '✓' : '⚠'}
                        </div>
                        <button onClick={() => deleteMenuItem(item.id)} className="flex items-center justify-center text-[#C4C9D4] hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* メニュー追加フォーム */}
              <div className="space-y-2">
                <input
                  type="text" value={menuName} onChange={e => setMenuName(e.target.value)}
                  placeholder="メニュー名（例：ランチ定食）"
                  className={inputCls}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="numeric" value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      placeholder="売価"
                      className="border border-[#E5E9F2] rounded-lg px-2 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white w-full"
                    />
                    <span className="text-xs text-[#9CA3AF]">円</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="numeric" value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      placeholder="原価"
                      className="border border-[#E5E9F2] rounded-lg px-2 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white w-full"
                    />
                    <span className="text-xs text-[#9CA3AF]">円</span>
                  </div>
                  <select
                    value={menuCategory} onChange={e => setMenuCategory(e.target.value as 'food' | 'beverage')}
                    className="border border-[#E5E9F2] rounded-lg px-2 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#E8320A] bg-white"
                  >
                    <option value="food">フード</option>
                    <option value="beverage">ビバレッジ</option>
                  </select>
                </div>
                <button
                  onClick={addMenuItem}
                  disabled={addingMenu || !menuName || !sellPrice || !costPrice}
                  className="flex items-center gap-1 text-xs text-[#E8320A] hover:underline disabled:opacity-40"
                >
                  <Plus size={12} />メニューを追加
                </button>
              </div>
            </div>
            {/* 過去の履歴 */}
            {history.length > 0 && (
              <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-[#6B7280]" />
                    <span className="text-sm font-bold text-[#111827]">過去の履歴</span>
                    <span className="text-xs text-[#9CA3AF]">{history.length}件</span>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{showHistory ? '▲' : '▼'}</span>
                </button>

                {showHistory && (
                  <div className="mt-4 space-y-2">
                    {history.map(h => {
                      const color = !h.fl_ratio ? '#9CA3AF' : h.fl_ratio < 55 ? '#16a34a' : h.fl_ratio < 60 ? '#ca8a04' : '#dc2626'
                      const label = !h.fl_ratio ? '—' : h.fl_ratio < 55 ? '健全' : h.fl_ratio < 60 ? '要注意' : '危険'
                      const isActive = h.year === year && h.month === month
                      return (
                        <button
                          key={h.id}
                          onClick={() => { setYear(h.year); setMonth(h.month); setShowHistory(false) }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${isActive ? 'border-[#E8320A] bg-orange-50' : 'border-[#F1F3F8] hover:border-[#E5E9F2] bg-[#FAFAFA]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#111827]">{h.year}年{h.month}月</span>
                            <span className="text-xs font-bold" style={{ color }}>{label}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                            <span>売上 {fmt(h.revenue)}円</span>
                            {h.fl_ratio != null && (
                              <span className="text-base font-bold" style={{ color }}>{h.fl_ratio.toFixed(1)}%</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
