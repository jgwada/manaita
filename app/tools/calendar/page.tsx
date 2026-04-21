'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import { ChevronLeft, ChevronRight, Sparkles, X, Pencil, Check } from 'lucide-react'

// ---------- 型定義 ----------
type CalendarEvent = {
  id: string
  date: string
  title: string
  description: string
  scale: 'large' | 'medium'
  category: string
  impact: string
}

type CalendarMemo = {
  id: string
  date: string
  memo: string
}

type WeatherData = Record<string, { icon: string; temp: number | null }>

// ---------- ユーティリティ ----------
function getDates(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay() // 0=日
  const lastDate = new Date(year, month, 0).getDate()
  const blanks = Array(firstDow).fill(null)
  const days = Array.from({ length: lastDate }, (_, i) => i + 1)
  return [...blanks, ...days]
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const SCALE_CONFIG = {
  large: { label: '◎大型', color: 'bg-[#E8320A] text-white' },
  medium: { label: '○中型', color: 'bg-amber-400 text-white' },
}

// ---------- メインページ ----------
export default function CalendarPage() {
  const { shopProfile } = useAppStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [memos, setMemos] = useState<Record<string, string>>({}) // date → memo
  const [weather, setWeather] = useState<WeatherData>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editMemo, setEditMemo] = useState('')
  const [editingMemo, setEditingMemo] = useState(false)
  const [savingMemo, setSavingMemo] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!shopProfile?.id) return
    setLoading(true)
    const [evRes, memoRes, wxRes] = await Promise.all([
      fetch(`/api/calendar/events?shopId=${shopProfile.id}&year=${year}&month=${month}`),
      fetch(`/api/calendar/memos?shopId=${shopProfile.id}&year=${year}&month=${month}`),
      fetch(`/api/calendar/weather?area=${encodeURIComponent(shopProfile.area)}&year=${year}&month=${month}`),
    ])
    const [evJson, memoJson, wxJson] = await Promise.all([evRes.json(), memoRes.json(), wxRes.json()])

    if (evJson.success) setEvents(evJson.data ?? [])
    if (memoJson.success) {
      const map: Record<string, string> = {}
      for (const m of (memoJson.data ?? []) as CalendarMemo[]) map[m.date] = m.memo
      setMemos(map)
    }
    if (wxJson.success) setWeather(wxJson.data ?? {})
    setLoading(false)
  }, [shopProfile?.id, shopProfile?.area, year, month])

  useEffect(() => { loadData() }, [loadData])

  const navigate = (dir: 1 | -1) => {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setYear(y); setMonth(m)
    setSelectedDate(null)
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setEditMemo(memos[dateStr] ?? '')
    setEditingMemo(false)
  }

  const saveMemo = async () => {
    if (!shopProfile?.id || !selectedDate) return
    setSavingMemo(true)
    await fetch('/api/calendar/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shopProfile.id, date: selectedDate, memo: editMemo }),
    })
    setMemos(prev => ({ ...prev, [selectedDate]: editMemo }))
    setEditingMemo(false)
    setSavingMemo(false)
  }

  const handleGenerate = async () => {
    if (!shopProfile || generating) return
    setGenerating(true)
    setGenerateMsg('')
    const res = await fetch('/api/calendar/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopProfile, year, month }),
    })
    const json = await res.json()
    if (json.success) {
      setEvents(json.data ?? [])
      setGenerateMsg(`${(json.data ?? []).length}件のイベントを取得しました`)
    } else {
      setGenerateMsg('取得に失敗しました。もう一度お試しください。')
    }
    setGenerating(false)
    setTimeout(() => setGenerateMsg(''), 4000)
  }

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/events?id=${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // 各日のイベントをまとめる
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const ev of events) {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = []
    eventsByDate[ev.date].push(ev)
  }

  const dates = getDates(year, month)
  const today = now.toISOString().slice(0, 10)
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []
  const selectedWeather = selectedDate ? weather[selectedDate] : undefined

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-3 py-5">

          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                <ChevronLeft size={18} className="text-[#6B7280]" />
              </button>
              <h1 className="text-lg font-bold text-[#111827]">
                {year}年{MONTH_NAMES[month - 1]}
              </h1>
              <button onClick={() => navigate(1)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                <ChevronRight size={18} className="text-[#6B7280]" />
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 bg-[#E8320A] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#c92b09] transition-colors disabled:opacity-50"
            >
              {generating
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />取得中...</>
                : <><Sparkles size={12} />AIでイベント取得</>
              }
            </button>
          </div>

          {generateMsg && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-xl">
              {generateMsg}
            </div>
          )}

          {/* 凡例 */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E8320A]" />大型イベント
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />中型イベント
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <Pencil size={8} className="text-[#9CA3AF]" />メモあり
            </span>
          </div>

          {/* カレンダーグリッド */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden mb-4">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b border-[#E5E9F2]">
              {DOW.map((d, i) => (
                <div key={d} className={`text-center text-[10px] font-bold py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-[#9CA3AF]'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* 日付グリッド */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {dates.map((day, idx) => {
                  if (!day) return <div key={`blank-${idx}`} className="aspect-square border-b border-r border-[#F1F3F8] last:border-r-0" />
                  const dateStr = toDateStr(year, month, day)
                  const dow = (idx) % 7
                  const isSun = dow === 0
                  const isSat = dow === 6
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const dayEvents = eventsByDate[dateStr] ?? []
                  const hasMemo = !!memos[dateStr]
                  const wx = weather[dateStr]
                  const hasLarge = dayEvents.some(e => e.scale === 'large')
                  const hasMedium = dayEvents.some(e => e.scale === 'medium')

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className={`min-h-[64px] sm:min-h-[80px] border-b border-r border-[#F1F3F8] p-1 text-left transition-colors flex flex-col ${
                        isSelected ? 'bg-red-50 border-[#E8320A]' : 'hover:bg-[#F9FAFB]'
                      } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                      {/* 日付 */}
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                        isToday ? 'bg-[#E8320A] text-white' :
                        isSun ? 'text-red-500' :
                        isSat ? 'text-blue-500' :
                        'text-[#111827]'
                      }`}>
                        {day}
                      </span>

                      {/* 天気 */}
                      {wx && (
                        <span className="text-[10px] text-[#6B7280] leading-none mt-0.5 flex items-center gap-0.5">
                          <span>{wx.icon}</span>
                          {wx.temp != null && <span>{wx.temp}°</span>}
                        </span>
                      )}

                      {/* イベントドット */}
                      {(hasLarge || hasMedium) && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap">
                          {hasLarge && <span className="w-1.5 h-1.5 rounded-full bg-[#E8320A] flex-shrink-0" />}
                          {hasMedium && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                        </div>
                      )}

                      {/* メモインジケーター */}
                      {hasMemo && <Pencil size={8} className="text-[#9CA3AF] mt-auto" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 選択日の詳細パネル */}
          {selectedDate && (
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">
                    {parseInt(selectedDate.slice(5, 7))}月{parseInt(selectedDate.slice(8, 10))}日
                    （{DOW[new Date(selectedDate).getDay()]}）
                  </p>
                  {selectedWeather && (
                    <span className="text-sm text-[#6B7280]">
                      {selectedWeather.icon} {selectedWeather.temp != null ? `${selectedWeather.temp}°C` : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelectedDate(null)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                  <X size={16} />
                </button>
              </div>

              {/* イベント一覧 */}
              {selectedEvents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className={`rounded-xl p-3 ${ev.scale === 'large' ? 'bg-red-50 border border-[#E8320A]/20' : 'bg-amber-50 border border-amber-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SCALE_CONFIG[ev.scale].color}`}>
                              {SCALE_CONFIG[ev.scale].label}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF] bg-white px-1.5 py-0.5 rounded-full border border-[#E5E9F2]">{ev.category}</span>
                          </div>
                          <p className="text-sm font-bold text-[#111827] leading-snug">{ev.title}</p>
                          {ev.description && <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{ev.description}</p>}
                          {ev.impact && (
                            <p className="text-xs text-[#E8320A] mt-1.5 font-medium">💡 {ev.impact}</p>
                          )}
                        </div>
                        <button onClick={() => deleteEvent(ev.id)} className="text-[#C4C9D4] hover:text-red-400 flex-shrink-0 mt-0.5">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#9CA3AF] mb-3">この日のイベント情報はありません</p>
              )}

              {/* メモ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-[#6B7280]">📝 施策メモ</p>
                  {!editingMemo && (
                    <button onClick={() => setEditingMemo(true)} className="flex items-center gap-1 text-xs text-[#E8320A] hover:underline">
                      <Pencil size={10} />編集
                    </button>
                  )}
                </div>
                {editingMemo ? (
                  <div className="space-y-2">
                    <textarea
                      value={editMemo}
                      onChange={e => setEditMemo(e.target.value)}
                      placeholder={`例：\n・花火大会の日→ビアガーデンメニューを準備\n・SNSで1週間前から告知する\n・スタッフを2名追加確保する`}
                      rows={4}
                      autoFocus
                      className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveMemo} disabled={savingMemo}
                        className="flex items-center gap-1 text-xs bg-[#E8320A] text-white px-3 py-1.5 rounded-lg hover:bg-[#c92b09] transition-colors disabled:opacity-50">
                        <Check size={11} />{savingMemo ? '保存中...' : '保存'}
                      </button>
                      <button onClick={() => { setEditingMemo(false); setEditMemo(memos[selectedDate] ?? '') }}
                        className="text-xs text-[#6B7280] border border-[#E5E9F2] px-3 py-1.5 rounded-lg hover:border-[#111827] transition-colors">
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingMemo(true)}
                    className="min-h-[48px] border border-dashed border-[#E5E9F2] rounded-xl px-3 py-2 cursor-pointer hover:border-[#E8320A] hover:bg-red-50 transition-colors"
                  >
                    {memos[selectedDate] ? (
                      <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">{memos[selectedDate]}</p>
                    ) : (
                      <p className="text-xs text-[#C4C9D4]">タップしてメモを入力...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
