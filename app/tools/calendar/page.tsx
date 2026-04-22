'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import { ChevronLeft, ChevronRight, Sparkles, X, Pencil, Check, Calendar as CalendarIcon, Info, Share2 } from 'lucide-react'

// ---------- 型定義 ----------
type CalendarEvent = {
  id: string
  date: string
  end_date?: string | null
  title: string
  description: string
  scale: 'large' | 'medium'
  category: string
  impact: string
  created_at?: string
}

type CalendarMemo = {
  id: string
  date: string
  memo: string
}

type WeatherData = Record<string, { icon: string; temp: number | null }>

// ---------- ユーティリティ ----------
function getDates(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const lastDate = new Date(year, month, 0).getDate()
  return [...Array(firstDow).fill(null), ...Array.from({ length: lastDate }, (_, i) => i + 1)]
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
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
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  // 月をまたいでキャッシュ（一度取得したら再取得しない）
  const [eventsCache, setEventsCache] = useState<Record<string, CalendarEvent[]>>({})
  const [memosCache, setMemosCache] = useState<Record<string, Record<string, string>>>({})
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData>>({})
  const loadedRef = useRef<Set<string>>(new Set())

  // 現在表示中の月のデータ
  const key = monthKey(year, month)
  const events = eventsCache[key] ?? []
  const memos = memosCache[key] ?? {}
  const weather = weatherCache[key] ?? {}

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editMemo, setEditMemo] = useState('')
  const [editingMemo, setEditingMemo] = useState(false)
  const [savingMemo, setSavingMemo] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')
  const [loading, setLoading] = useState(false)
  // key: monthKey → nextAt ISO文字列（7日間クールダウン）
  const [nextAtCache, setNextAtCache] = useState<Record<string, string | null>>({})

  const loadData = useCallback(async (y: number, m: number, force = false) => {
    if (!shopProfile?.id) return
    const k = monthKey(y, m)
    if (!force && loadedRef.current.has(k)) return // キャッシュ済みはスキップ
    setLoading(true)
    const [evRes, memoRes, wxRes] = await Promise.all([
      fetch(`/api/calendar/events?shopId=${shopProfile.id}&year=${y}&month=${m}`),
      fetch(`/api/calendar/memos?shopId=${shopProfile.id}&year=${y}&month=${m}`),
      fetch(`/api/calendar/weather?area=${encodeURIComponent(shopProfile.area)}&year=${y}&month=${m}`),
    ])
    const [evJson, memoJson, wxJson] = await Promise.all([evRes.json(), memoRes.json(), wxRes.json()])

    if (evJson.success) {
      const evData: CalendarEvent[] = evJson.data ?? []
      setEventsCache(prev => ({ ...prev, [k]: evData }))
      setNextAtCache(prev => ({ ...prev, [k]: evJson.nextAt ?? null }))
    }
    if (memoJson.success) {
      const map: Record<string, string> = {}
      for (const memo of (memoJson.data ?? []) as CalendarMemo[]) map[memo.date] = memo.memo
      setMemosCache(prev => ({ ...prev, [k]: map }))
    }
    if (wxJson.success) {
      setWeatherCache(prev => ({ ...prev, [k]: wxJson.data ?? {} }))
    }
    loadedRef.current.add(k)
    setLoading(false)
  }, [shopProfile?.id, shopProfile?.area])

  useEffect(() => { loadData(year, month) }, [loadData, year, month])

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
    setMemosCache(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), [selectedDate]: editMemo } }))
    setEditingMemo(false)
    setSavingMemo(false)
  }

  const handleGenerate = async (targetYear?: number, targetMonth?: number) => {
    if (!shopProfile || generating) return
    const ty = targetYear ?? year
    const tm = targetMonth ?? month
    setGenerating(true)
    setGenerateMsg('')
    const res = await fetch('/api/calendar/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopProfile, year: ty, month: tm }),
    })
    const json = await res.json()
    if (json.cooldown) {
      // クールダウン中
      const tk = monthKey(ty, tm)
      setNextAtCache(prev => ({ ...prev, [tk]: json.nextAt }))
      const daysLeft = Math.ceil((new Date(json.nextAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      setGenerateMsg(`取得済みです。次回取得可能まであと${daysLeft}日です。`)
    } else if (json.success) {
      const tk = monthKey(ty, tm)
      setEventsCache(prev => ({ ...prev, [tk]: json.data ?? [] }))
      setNextAtCache(prev => ({
        ...prev,
        [tk]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
      loadedRef.current.add(tk)
      if (ty !== year || tm !== month) {
        setYear(ty); setMonth(tm); setSelectedDate(null)
        setGenerateMsg(`${ty}年${tm}月のイベントを${(json.data ?? []).length}件取得しました`)
      } else {
        setGenerateMsg(`${(json.data ?? []).length}件のイベントを取得しました`)
      }
    } else {
      setGenerateMsg('取得に失敗しました。もう一度お試しください。')
    }
    setGenerating(false)
    setTimeout(() => setGenerateMsg(''), 5000)
  }

  // 翌月・翌々月
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
  const nextNextMonth = nextMonth.m === 12 ? { y: nextMonth.y + 1, m: 1 } : { y: nextMonth.y, m: nextMonth.m + 1 }

  // クールダウン判定ヘルパー
  const getCooldown = (y: number, m: number) => {
    const nextAt = nextAtCache[monthKey(y, m)]
    if (!nextAt || new Date() >= new Date(nextAt)) return { onCooldown: false, daysLeft: 0 }
    const daysLeft = Math.ceil((new Date(nextAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return { onCooldown: true, daysLeft }
  }
  const currentCd = getCooldown(year, month)
  const nextMonthCd = getCooldown(nextMonth.y, nextMonth.m)
  const nextNextMonthCd = getCooldown(nextNextMonth.y, nextNextMonth.m)

  // .ics エクスポート
  const exportToIcs = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//Manaita//Manaita Calendar//JA',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ]
    for (const ev of events) {
      const d = ev.date.replace(/-/g, '')
      const endBase = ev.end_date ?? ev.date
      const nd = new Date(new Date(endBase).getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '')
      lines.push('BEGIN:VEVENT', `UID:manaita-ev-${ev.id}@manaita`,
        `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${nd}`, `SUMMARY:${ev.title}`)
      if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}`)
      lines.push('END:VEVENT')
    }
    for (const [date, memo] of Object.entries(memos)) {
      if (!memo) continue
      const d = date.replace(/-/g, '')
      const nd = new Date(new Date(date).getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '')
      lines.push('BEGIN:VEVENT', `UID:manaita-memo-${date}@manaita`,
        `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${nd}`,
        `SUMMARY:📝 ${memo.split('\n')[0].slice(0, 40)}`,
        `DESCRIPTION:${memo.replace(/\n/g, '\\n')}`, 'END:VEVENT')
    }
    lines.push('END:VCALENDAR')
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manaita-${key}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/events?id=${id}`, { method: 'DELETE' })
    setEventsCache(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(e => e.id !== id) }))
  }

  // 各日のイベントマップ（複数日イベントは全日付に展開）
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const ev of events) {
    const start = new Date(ev.date + 'T00:00:00')
    const end = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : start
    const cur = new Date(start)
    while (cur <= end) {
      const ds = cur.toISOString().slice(0, 10)
      if (!eventsByDate[ds]) eventsByDate[ds] = []
      eventsByDate[ds].push(ev)
      cur.setDate(cur.getDate() + 1)
    }
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
          <div className="flex items-center justify-between mb-3">
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
            <div className="flex items-center gap-2">
              <button
                onClick={exportToIcs}
                disabled={events.length === 0 && Object.keys(memos).length === 0}
                title="Googleカレンダーに書き出し"
                className="flex items-center gap-1.5 bg-white border border-[#E5E9F2] text-[#6B7280] text-xs font-bold px-3 py-2 rounded-xl hover:border-[#E8320A] hover:text-[#E8320A] transition-colors disabled:opacity-40"
              >
                <CalendarIcon size={12} />.ics
              </button>
              {/* インフォアイコン */}
              <div className="relative group">
                <Info size={14} className="text-[#C4C9D4] cursor-help" />
                <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-56 bg-[#111827] text-white text-[10px] rounded-xl px-3 py-2.5 z-20 leading-relaxed shadow-lg">
                  AIでのイベント取得は<span className="font-bold text-amber-300">7日間に1度</span>のみです。一度取得したら7日間は再取得できません。
                  <span className="absolute top-full right-3 border-4 border-transparent border-t-[#111827]" />
                </div>
              </div>
              {/* AI取得ボタン */}
              <button
                onClick={() => handleGenerate()}
                disabled={generating || currentCd.onCooldown}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  currentCd.onCooldown
                    ? 'bg-[#F1F3F8] text-[#9CA3AF] cursor-not-allowed'
                    : 'bg-[#E8320A] text-white hover:bg-[#c92b09] disabled:opacity-50'
                }`}
              >
                {generating
                  ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />取得中...</>
                  : currentCd.onCooldown
                    ? <>あと{currentCd.daysLeft}日</>
                    : <><Sparkles size={12} />AI取得</>
                }
              </button>
            </div>
          </div>

          {/* 先取り取得ボタン */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleGenerate(nextMonth.y, nextMonth.m)}
              disabled={generating || nextMonthCd.onCooldown}
              className={`flex-1 flex items-center justify-center gap-1.5 bg-white border text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
                nextMonthCd.onCooldown
                  ? 'border-[#E5E9F2] text-[#C4C9D4] cursor-not-allowed'
                  : 'border-[#E5E9F2] text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] disabled:opacity-50'
              }`}
            >
              <Sparkles size={11} />
              {nextMonthCd.onCooldown
                ? `${nextMonth.m}月（あと${nextMonthCd.daysLeft}日）`
                : `${nextMonth.m}月を先取り取得`}
            </button>
            <button
              onClick={() => handleGenerate(nextNextMonth.y, nextNextMonth.m)}
              disabled={generating || nextNextMonthCd.onCooldown}
              className={`flex-1 flex items-center justify-center gap-1.5 bg-white border text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
                nextNextMonthCd.onCooldown
                  ? 'border-[#E5E9F2] text-[#C4C9D4] cursor-not-allowed'
                  : 'border-[#E5E9F2] text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A] disabled:opacity-50'
              }`}
            >
              <Sparkles size={11} />
              {nextNextMonthCd.onCooldown
                ? `${nextNextMonth.m}月（あと${nextNextMonthCd.daysLeft}日）`
                : `${nextNextMonth.m}月を先取り取得`}
            </button>
          </div>

          {generateMsg && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-xl">
              {generateMsg}
            </div>
          )}

          {/* 凡例 */}
          <div className="flex items-center gap-4 mb-3 px-1">
            <span className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-100 border border-[#E8320A]/40" />大型
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />中型
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
              <span className="inline-block w-2.5 h-1 rounded-full bg-indigo-400" />メモあり
            </span>
          </div>

          {/* カレンダーグリッド */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden mb-4">
            <div className="grid grid-cols-7 border-b border-[#E5E9F2]">
              {DOW.map((d, i) => (
                <div key={d} className={`text-center text-[10px] font-bold py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-[#9CA3AF]'}`}>
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {dates.map((day, idx) => {
                  if (!day) return <div key={`blank-${idx}`} className="aspect-square border-b border-r border-[#F1F3F8]" />
                  const dateStr = toDateStr(year, month, day)
                  const dow = idx % 7
                  const isSun = dow === 0
                  const isSat = dow === 6
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const dayEvents = eventsByDate[dateStr] ?? []
                  const hasMemo = !!memos[dateStr]
                  const wx = weather[dateStr]
                  const hasLarge = dayEvents.some(e => e.scale === 'large')
                  const hasMedium = !hasLarge && dayEvents.some(e => e.scale === 'medium')
                  const firstEvent = dayEvents[0]

                  // 複数日イベントの判定
                  const evIsMultiDay = firstEvent
                    ? (!!firstEvent.end_date && firstEvent.end_date !== firstEvent.date)
                    : false
                  const evIsStart = firstEvent ? firstEvent.date === dateStr : false
                  const evIsEnd = firstEvent
                    ? ((firstEvent.end_date ?? firstEvent.date) === dateStr)
                    : false

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className={`min-h-[72px] sm:min-h-[84px] border-b border-r border-[#F1F3F8] p-1 text-left transition-colors flex flex-col relative overflow-hidden ${
                        isSelected ? 'bg-red-50 ring-1 ring-inset ring-[#E8320A]' :
                        hasLarge ? 'bg-red-50/50 hover:bg-red-50' :
                        hasMedium ? 'bg-amber-50/50 hover:bg-amber-50' :
                        'hover:bg-[#F9FAFB]'
                      } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                      {/* 日付数字 */}
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

                      {/* イベントタイトル */}
                      {firstEvent && (
                        <span className={`text-[9px] font-semibold leading-tight mt-1 line-clamp-2 w-full ${
                          firstEvent.scale === 'large' ? 'text-[#E8320A]' : 'text-amber-600'
                        } ${evIsMultiDay && !evIsStart ? 'opacity-75' : ''}`}>
                          {evIsMultiDay && !evIsStart && '▸ '}
                          {firstEvent.title}
                          {evIsMultiDay && evIsEnd && !evIsStart && ' ◂'}
                        </span>
                      )}

                      {/* 複数日イベントの開始日に「〜xx日」表示 */}
                      {evIsMultiDay && evIsStart && firstEvent?.end_date && (
                        <span className={`text-[8px] leading-none ${
                          firstEvent.scale === 'large' ? 'text-[#E8320A]/60' : 'text-amber-500/70'
                        }`}>
                          〜{parseInt(firstEvent.end_date.slice(8, 10))}日
                        </span>
                      )}

                      {/* 複数イベントの場合 */}
                      {dayEvents.length > 1 && (
                        <span className="text-[9px] text-[#9CA3AF] leading-none">
                          +{dayEvents.length - 1}件
                        </span>
                      )}

                      {/* メモバー（底辺） */}
                      {hasMemo && (
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-400" />
                      )}
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
                          {ev.end_date && ev.end_date !== ev.date && (
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              📅 {parseInt(ev.date.slice(5, 7))}月{parseInt(ev.date.slice(8, 10))}日〜{parseInt(ev.end_date.slice(5, 7))}月{parseInt(ev.end_date.slice(8, 10))}日
                            </p>
                          )}
                          {ev.description && <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{ev.description}</p>}
                          {ev.impact && <p className="text-xs text-[#E8320A] mt-1.5 font-medium">💡 {ev.impact}</p>}
                          <button
                            onClick={() => {
                              const content = [ev.title, ev.description, ev.impact ? `営業への影響：${ev.impact}` : ''].filter(Boolean).join('\n\n')
                              router.push(`/tools/sns?content=${encodeURIComponent(content)}`)
                            }}
                            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[#6B7280] border border-[#E5E9F2] bg-white hover:border-[#E8320A] hover:text-[#E8320A] rounded-full px-2 py-0.5 transition-colors"
                          >
                            <Share2 size={10} />SNS投稿を作成
                          </button>
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
                      placeholder={`例：\n・花火大会の日→ビアガーデンメニューを準備\n・SNSで1週間前から告知する`}
                      rows={3}
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
