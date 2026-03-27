'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import {
  ChevronLeft, ChevronRight, Cloud, Camera, Sparkles,
  Save, Trash2, History, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import { DailyReport } from '@/types'

function fmt(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('ja-JP')
}
function parseNum(s: string) {
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0
}
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}
function jpDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

type HistoryItem = Pick<DailyReport, 'id' | 'date' | 'lunch_sales' | 'dinner_sales' | 'lunch_customers' | 'dinner_customers' | 'weather_condition' | 'temperature' | 'temp_vs_avg' | 'ai_report'>

export default function ReportPage() {
  const { shopProfile } = useAppStore()

  // 日付
  const [date, setDate] = useState(toDateStr(new Date()))

  // 売上・客数
  const [lunchSales, setLunchSales] = useState('')
  const [dinnerSales, setDinnerSales] = useState('')
  const [lunchCustomers, setLunchCustomers] = useState('')
  const [dinnerCustomers, setDinnerCustomers] = useState('')

  // 営業タイプ
  const [hasLunch, setHasLunch] = useState(true)
  const [hasDinner, setHasDinner] = useState(true)
  const [isToshi, setIsToshi] = useState(false)

  // 天気
  const [weatherCondition, setWeatherCondition] = useState('')
  const [temperature, setTemperature] = useState<number | null>(null)
  const [tempVsAvg, setTempVsAvg] = useState<number | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')

  // メモ
  const [memo, setMemo] = useState('')

  // AI日報
  const [aiReport, setAiReport] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // OCR抽出
  const [extracting, setExtractLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 保存
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [currentRecord, setCurrentRecord] = useState<DailyReport | null>(null)

  // 履歴
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 日付変更時にデータ読み込み
  useEffect(() => {
    if (!shopProfile?.id) return
    loadRecord(date)
  }, [date, shopProfile?.id])

  // 履歴読み込み
  useEffect(() => {
    if (!shopProfile?.id) return
    fetch(`/api/daily-report?shopId=${shopProfile.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.data) })
  }, [shopProfile?.id])

  async function loadRecord(d: string) {
    if (!shopProfile?.id) return
    const res = await fetch(`/api/daily-report?shopId=${shopProfile.id}&date=${d}`)
    const json = await res.json()
    if (json.success && json.data) {
      const r: DailyReport = json.data
      setCurrentRecord(r)
      setLunchSales(r.lunch_sales != null ? String(r.lunch_sales) : '')
      setDinnerSales(r.dinner_sales != null ? String(r.dinner_sales) : '')
      setLunchCustomers(r.lunch_customers != null ? String(r.lunch_customers) : '')
      setDinnerCustomers(r.dinner_customers != null ? String(r.dinner_customers) : '')
      setHasLunch(r.lunch_sales != null || r.lunch_customers != null)
      setHasDinner(r.dinner_sales != null || r.dinner_customers != null)
      setIsToshi(false)
      setWeatherCondition(r.weather_condition ?? '')
      setTemperature(r.temperature ?? null)
      setTempVsAvg(r.temp_vs_avg ?? null)
      setMemo(r.memo ?? '')
      setAiReport(r.ai_report ?? '')
    } else {
      setCurrentRecord(null)
      setLunchSales(''); setDinnerSales('')
      setLunchCustomers(''); setDinnerCustomers('')
      setHasLunch(true); setHasDinner(true); setIsToshi(false)
      setWeatherCondition(''); setTemperature(null); setTempVsAvg(null)
      setMemo(''); setAiReport('')
    }
  }

  function prevDay() {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(toDateStr(d))
  }
  function nextDay() {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    const today = toDateStr(new Date())
    if (toDateStr(d) <= today) setDate(toDateStr(d))
  }

  async function fetchWeather() {
    if (!shopProfile?.area) { setWeatherError('店舗エリアが設定されていません'); return }
    setWeatherLoading(true); setWeatherError('')
    try {
      const res = await fetch(`/api/weather?area=${encodeURIComponent(shopProfile.area)}&date=${date}`)
      const json = await res.json()
      if (json.success) {
        setWeatherCondition(json.data.condition)
        setTemperature(json.data.temperature)
        setTempVsAvg(json.data.tempVsAvg)
      } else {
        setWeatherError(json.error ?? '取得失敗')
      }
    } catch {
      setWeatherError('天気の取得に失敗しました')
    } finally {
      setWeatherLoading(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtractLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/daily-report/extract', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        if (d.lunch_sales != null) setLunchSales(String(d.lunch_sales))
        if (d.dinner_sales != null) setDinnerSales(String(d.dinner_sales))
        if (d.lunch_customers != null) setLunchCustomers(String(d.lunch_customers))
        if (d.dinner_customers != null) setDinnerCustomers(String(d.dinner_customers))
      }
    } catch {
      // silent
    } finally {
      setExtractLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGenerate() {
    if (!shopProfile?.id) { setGenerateError('店舗情報が読み込めていません'); return }
    setGenerating(true); setAiReport(''); setGenerateError('')
    try {
      const res = await fetch('/api/daily-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopProfile,
          date,
          lunchSales: (hasLunch || isToshi) && lunchSales ? parseNum(lunchSales) : null,
          dinnerSales: hasDinner && !isToshi && dinnerSales ? parseNum(dinnerSales) : null,
          lunchCustomers: (hasLunch || isToshi) && lunchCustomers ? parseNum(lunchCustomers) : null,
          dinnerCustomers: hasDinner && !isToshi && dinnerCustomers ? parseNum(dinnerCustomers) : null,
          weatherCondition: weatherCondition || null,
          temperature,
          tempVsAvg,
          memo,
        }),
      })
      if (!res.body) { setGenerateError('レスポンスが取得できませんでした'); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        if (chunk.startsWith('ERROR:')) {
          setGenerateError(chunk.replace('ERROR:', ''))
          break
        }
        accumulated += chunk
        setAiReport(accumulated)
      }
    } catch (e) {
      setGenerateError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!shopProfile?.id) { setSaveError('店舗情報が読み込めていません'); return }
    setSaving(true); setSaveError(''); setSaved(false)
    try {
      const res = await fetch('/api/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopProfile.id,
          date,
          lunchSales: (hasLunch || isToshi) && lunchSales ? parseNum(lunchSales) : null,
          dinnerSales: hasDinner && !isToshi && dinnerSales ? parseNum(dinnerSales) : null,
          lunchCustomers: (hasLunch || isToshi) && lunchCustomers ? parseNum(lunchCustomers) : null,
          dinnerCustomers: hasDinner && !isToshi && dinnerCustomers ? parseNum(dinnerCustomers) : null,
          weatherCondition: weatherCondition || null,
          temperature,
          tempVsAvg,
          memo: memo || null,
          aiReport: aiReport || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSaved(true)
        setCurrentRecord(json.data)
        // 履歴更新
        const hres = await fetch(`/api/daily-report?shopId=${shopProfile.id}`)
        const hj = await hres.json()
        if (hj.success) setHistory(hj.data)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setSaveError(json.error ?? '保存に失敗しました')
      }
    } catch {
      setSaveError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この日報を削除しますか？')) return
    await fetch(`/api/daily-report?id=${id}`, { method: 'DELETE' })
    setHistory(prev => prev.filter(h => h.id !== id))
    if (currentRecord?.id === id) {
      setCurrentRecord(null)
      setLunchSales(''); setDinnerSales('')
      setLunchCustomers(''); setDinnerCustomers('')
      setMemo(''); setAiReport('')
    }
  }

  const lunchSalesNum = (hasLunch || isToshi) && lunchSales ? parseNum(lunchSales) : 0
  const dinnerSalesNum = hasDinner && !isToshi && dinnerSales ? parseNum(dinnerSales) : 0
  const lunchCustomersNum = (hasLunch || isToshi) && lunchCustomers ? parseNum(lunchCustomers) : 0
  const dinnerCustomersNum = hasDinner && !isToshi && dinnerCustomers ? parseNum(dinnerCustomers) : 0
  const totalSales = lunchSalesNum + dinnerSalesNum
  const totalCustomers = lunchCustomersNum + dinnerCustomersNum
  const avgSpend = totalCustomers > 0 ? Math.round(totalSales / totalCustomers) : null

  const isToday = date === toDateStr(new Date())
  const isFuture = date > toDateStr(new Date())

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PageHeader title="日報・売上レポート" description="今日の営業を記録・振り返り" />

          {/* 日付ナビゲーション */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <button onClick={prevDay} className="p-2 rounded-lg hover:bg-[#F1F3F8] transition-colors">
                <ChevronLeft size={20} className="text-[#6B7280]" />
              </button>
              <div className="text-center">
                <input
                  type="date"
                  value={date}
                  max={toDateStr(new Date())}
                  onChange={e => setDate(e.target.value)}
                  className="text-lg font-bold text-[#111827] text-center bg-transparent border-none outline-none cursor-pointer"
                />
                {isToday && <p className="text-xs text-[#E8320A] font-medium mt-0.5">今日</p>}
              </div>
              <button
                onClick={nextDay}
                disabled={isToday}
                className="p-2 rounded-lg hover:bg-[#F1F3F8] transition-colors disabled:opacity-30"
              >
                <ChevronRight size={20} className="text-[#6B7280]" />
              </button>
            </div>
          </div>

          {/* レジジャーナル写真読み取り */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#111827]">レジジャーナル読み取り</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="flex items-center gap-1.5 bg-[#111827] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
                {extracting ? '読み取り中...' : '写真を撮影・選択'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-[#9CA3AF]">POSレジのジャーナル・日計表を撮影すると売上・客数を自動入力します</p>
          </div>

          {/* 売上・客数入力 */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            {/* 営業タイプ選択 */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <p className="text-sm font-bold text-[#111827]">売上・客数</p>
              <div className="flex items-center gap-3 ml-auto flex-wrap">
                {!isToshi && (
                  <>
                    <label className="flex items-center gap-1.5 text-sm text-[#374151] cursor-pointer select-none">
                      <input type="checkbox" checked={hasLunch} onChange={e => setHasLunch(e.target.checked)} className="accent-[#E8320A]" />
                      ランチ
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-[#374151] cursor-pointer select-none">
                      <input type="checkbox" checked={hasDinner} onChange={e => setHasDinner(e.target.checked)} className="accent-[#E8320A]" />
                      ディナー
                    </label>
                  </>
                )}
                <label className="flex items-center gap-1.5 text-sm text-[#374151] cursor-pointer select-none">
                  <input type="checkbox" checked={isToshi} onChange={e => { setIsToshi(e.target.checked); if (e.target.checked) { setHasLunch(true); setHasDinner(true) } }} className="accent-[#E8320A]" />
                  通し営業
                </label>
              </div>
            </div>

            {isToshi ? (
              /* 通し営業：一本化フォーム */
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">売上（円）</label>
                  <input type="text" inputMode="numeric" value={lunchSales} onChange={e => setLunchSales(e.target.value)} placeholder="0"
                    className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">客数（名）</label>
                  <input type="text" inputMode="numeric" value={lunchCustomers} onChange={e => setLunchCustomers(e.target.value)} placeholder="0"
                    className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                </div>
              </div>
            ) : (
              /* ランチ・ディナー個別フォーム */
              <div className="grid grid-cols-2 gap-3 mb-3">
                {hasLunch && (
                  <>
                    <div>
                      <label className="text-xs text-[#6B7280] mb-1 block">ランチ売上（円）</label>
                      <input type="text" inputMode="numeric" value={lunchSales} onChange={e => setLunchSales(e.target.value)} placeholder="0"
                        className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7280] mb-1 block">ランチ客数（名）</label>
                      <input type="text" inputMode="numeric" value={lunchCustomers} onChange={e => setLunchCustomers(e.target.value)} placeholder="0"
                        className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                    </div>
                  </>
                )}
                {hasDinner && (
                  <>
                    <div>
                      <label className="text-xs text-[#6B7280] mb-1 block">ディナー売上（円）</label>
                      <input type="text" inputMode="numeric" value={dinnerSales} onChange={e => setDinnerSales(e.target.value)} placeholder="0"
                        className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7280] mb-1 block">ディナー客数（名）</label>
                      <input type="text" inputMode="numeric" value={dinnerCustomers} onChange={e => setDinnerCustomers(e.target.value)} placeholder="0"
                        className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#E8320A]" />
                    </div>
                  </>
                )}
                {!hasLunch && !hasDinner && (
                  <p className="col-span-2 text-xs text-[#9CA3AF] text-center py-2">ランチ・ディナーどちらかにチェックを入れてください</p>
                )}
              </div>
            )}

            {(totalSales > 0 || totalCustomers > 0) && (
              <div className="bg-[#F1F3F8] rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">合計売上</p>
                  <p className="text-sm font-bold text-[#111827]">{totalSales.toLocaleString('ja-JP')}円</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">合計客数</p>
                  <p className="text-sm font-bold text-[#111827]">{totalCustomers}名</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">客単価</p>
                  <p className="text-sm font-bold text-[#111827]">{avgSpend != null ? `${avgSpend.toLocaleString('ja-JP')}円` : '—'}</p>
                </div>
              </div>
            )}
          </div>

          {/* 天気 */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#111827]">天気・気温</p>
              <button
                onClick={fetchWeather}
                disabled={weatherLoading}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Cloud size={14} />
                {weatherLoading ? '取得中...' : '自動取得'}
              </button>
            </div>
            {weatherError && <p className="text-xs text-red-500 mb-2">{weatherError}</p>}
            {weatherCondition ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-[#111827]">{weatherCondition}</span>
                {temperature != null && (
                  <span className="text-sm text-[#6B7280]">{temperature}℃</span>
                )}
                {tempVsAvg != null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${tempVsAvg > 0 ? 'text-red-500' : tempVsAvg < 0 ? 'text-blue-500' : 'text-[#6B7280]'}`}>
                    {tempVsAvg > 0 ? <TrendingUp size={12} /> : tempVsAvg < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    平年比 {tempVsAvg > 0 ? '+' : ''}{tempVsAvg}℃
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#9CA3AF]">「自動取得」を押すと{shopProfile?.area ?? '店舗エリア'}の天気を取得します</p>
            )}
          </div>

          {/* メモ */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <label className="text-sm font-bold text-[#111827] block mb-2">メモ・特記事項</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="イベント、スタッフ欠員、仕込みの特記事項など"
              rows={3}
              className="w-full border border-[#E5E9F2] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8320A] resize-none"
            />
          </div>

          {/* AI日報生成 */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#111827]">AI日報</p>
              <button
                onClick={handleGenerate}
                disabled={generating || (!lunchSales && !dinnerSales)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Sparkles size={14} />
                {generating ? '生成中...' : 'AI日報を生成'}
              </button>
            </div>
            {generateError && <p className="text-xs text-red-500 mb-2">{generateError}</p>}
            {aiReport || generating ? (
              <textarea
                value={aiReport}
                onChange={e => setAiReport(e.target.value)}
                placeholder={generating ? 'AI日報を生成中...' : ''}
                rows={8}
                className="w-full bg-[#FFFBF5] border border-orange-100 rounded-xl px-3 py-3 text-sm text-[#111827] leading-relaxed focus:outline-none focus:border-orange-300 resize-none"
              />
            ) : (
              <p className="text-xs text-[#9CA3AF]">売上・客数を入力後、AI日報を自動生成できます</p>
            )}
          </div>

          {/* 保存ボタン */}
          {saveError && <p className="text-sm text-red-500 mb-2">{saveError}</p>}
          {currentRecord && (
            <p className="text-xs text-[#6B7280] mb-2 text-center">保存済み — 編集して再保存できます</p>
          )}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleSave}
              disabled={saving || isFuture}
              className="flex-1 flex items-center justify-center gap-2 bg-[#E8320A] text-white font-bold py-3 rounded-2xl hover:bg-[#c92b09] transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '保存中...' : saved ? '保存しました！' : currentRecord ? '上書き保存' : '日報を保存'}
            </button>
            {currentRecord && (
              <button
                onClick={() => handleDelete(currentRecord.id)}
                className="flex items-center justify-center gap-1.5 bg-white border border-[#E5E9F2] text-red-400 font-medium px-4 py-3 rounded-2xl hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Trash2 size={16} />
                削除
              </button>
            )}
          </div>

          {/* 履歴 */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#6B7280]" />
                <span className="text-sm font-bold text-[#111827]">日報履歴</span>
                <span className="text-xs text-[#9CA3AF]">{history.length}件</span>
              </div>
              <span className="text-xs text-[#9CA3AF]">{showHistory ? '▲ 閉じる' : '▼ 表示'}</span>
            </button>

            {showHistory && (
              <div className="border-t border-[#E5E9F2]">
                {history.length === 0 && (
                  <p className="text-xs text-[#9CA3AF] text-center py-6">保存された日報はありません</p>
                )}
                {history.map(item => (
                  <div key={item.id} className="border-b border-[#F1F3F8] last:border-0">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setExpandedId(expandedId === item.id ? null : item.id)
                        setDate(item.date)
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{jpDate(item.date)}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {(item.lunch_sales != null || item.dinner_sales != null) && (
                            <span className="text-xs text-[#6B7280]">
                              売上 {((item.lunch_sales ?? 0) + (item.dinner_sales ?? 0)).toLocaleString('ja-JP')}円
                            </span>
                          )}
                          {(item.lunch_customers != null || item.dinner_customers != null) && (
                            <span className="text-xs text-[#6B7280]">
                              客数 {(item.lunch_customers ?? 0) + (item.dinner_customers ?? 0)}名
                            </span>
                          )}
                          {item.weather_condition && (
                            <span className="text-xs text-[#9CA3AF]">{item.weather_condition}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                        className="text-[#E5E9F2] hover:text-red-400 transition-colors p-1 ml-2 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>

                    {expandedId === item.id && (
                      <div className="px-4 pb-3 bg-[#FAFAFA]">
                        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                          <div className="bg-white rounded-lg p-2 border border-[#E5E9F2]">
                            <p className="text-[#9CA3AF] mb-0.5">ランチ</p>
                            <p className="font-medium text-[#111827]">{fmt(item.lunch_sales)}円 / {fmt(item.lunch_customers)}名</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-[#E5E9F2]">
                            <p className="text-[#9CA3AF] mb-0.5">ディナー</p>
                            <p className="font-medium text-[#111827]">{fmt(item.dinner_sales)}円 / {fmt(item.dinner_customers)}名</p>
                          </div>
                        </div>
                        {item.temperature != null && (
                          <p className="text-xs text-[#6B7280] mb-2">
                            気温 {item.temperature}℃
                            {item.temp_vs_avg != null && ` (平年比 ${item.temp_vs_avg > 0 ? '+' : ''}${item.temp_vs_avg}℃)`}
                          </p>
                        )}
                        {item.ai_report && (
                          <div className="bg-[#FFFBF5] border border-orange-100 rounded-lg p-2">
                            <p className="text-[10px] text-orange-400 font-medium mb-1">AI日報</p>
                            <p className="text-xs text-[#111827] leading-relaxed whitespace-pre-wrap">{item.ai_report}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </AuthGuard>
  )
}
