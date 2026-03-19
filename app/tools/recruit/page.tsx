'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ResultBlock from '@/components/ui/ResultBlock'
import ErrorMessage from '@/components/ui/ErrorMessage'
import RecruitPoster, { ThemeKey, detectTheme } from '@/components/ui/RecruitPoster'

const POSTER_THEMES: { key: ThemeKey; label: string; sub: string; colors: string[] }[] = [
  { key: 'yakiniku', label: '焼肉・炭火系',    sub: '黒×赤・極太ゴシック',   colors: ['#0A0A0A', '#C41200', '#E8320A'] },
  { key: 'cafe',     label: 'カフェ・ナチュラル', sub: 'クリーム×ブラウン・明朝体', colors: ['#FAF7F2', '#2C1A0E', '#8B6F47'] },
  { key: 'izakaya',  label: '居酒屋・バー系',   sub: 'ネイビー×ゴールド',    colors: ['#0E1520', '#C8A84B', '#1A2535'] },
  { key: 'italian',  label: 'イタリアン・洋食',  sub: 'アイボリー×グリーン',  colors: ['#F8F5EE', '#2A4A1E', '#4A7A3A'] },
  { key: 'washoku',  label: '和食・日本料理',   sub: '和紙×辰砂・明朝体',   colors: ['#F7F2E8', '#1C1208', '#8B1A1A'] },
  { key: 'default',  label: 'スタンダード',     sub: '白×赤・シンプル',     colors: ['#FFFFFF', '#111008', '#E8320A'] },
]

const TYPES = ['アルバイト', '社員・正社員', 'シフト追加募集']
const SHIFTS = ['ランチ', 'ディナー', '深夜', '週末のみ', '平日のみ']
const MIN_DAYS = ['週1日〜', '週2日〜', '週3日〜', '週4日〜', '週5日〜']

type Toggle = { label: string; key: string; onlyFor?: '社員・正社員' }

const TOGGLES: Toggle[] = [
  { label: 'まかない付き', key: 'meal' },
  { label: '交通費支給', key: 'commute' },
  { label: '未経験歓迎', key: 'noExp' },
  { label: 'シフト相談可', key: 'shiftFlex' },
  { label: '制服貸与', key: 'uniform' },
  { label: '髪型自由', key: 'hair' },
  { label: 'ネイルOK', key: 'nail' },
  { label: 'ピアスOK', key: 'piercing' },
  { label: '駐車場あり', key: 'parking' },
  { label: '深夜手当あり', key: 'nightAllowance' },
  { label: '週払いOK', key: 'weeklyPay' },
  { label: '副業OK', key: 'sideJob' },
  { label: '研修制度あり', key: 'training' },
  { label: '昇給あり', key: 'raise' },
  { label: '禁煙・分煙', key: 'noSmoking' },
  { label: '友達と一緒に応募OK', key: 'friendApply' },
  { label: '外国人歓迎', key: 'foreign' },
  { label: 'シニア歓迎', key: 'senior' },
  { label: '学生歓迎', key: 'student' },
  { label: '主婦・主夫歓迎', key: 'housewife' },
  { label: 'ボーナスあり', key: 'bonus', onlyFor: '社員・正社員' },
  { label: '社会保険完備', key: 'insurance', onlyFor: '社員・正社員' },
  { label: '退職金制度あり', key: 'retirement', onlyFor: '社員・正社員' },
  { label: '資格取得支援', key: 'qualification', onlyFor: '社員・正社員' },
  { label: 'マネージャー候補', key: 'manager', onlyFor: '社員・正社員' },
]

type Results = { siteText: string; snsText: string; dmText: string }

function parseResults(raw: string): Results {
  const siteText = raw.match(/\[求人サイト用\]([\s\S]*?)(?=\[SNS・チラシ用\]|$)/)?.[1]?.trim() ?? ''
  const snsText = raw.match(/\[SNS・チラシ用\]([\s\S]*?)(?=\[面接誘導メッセージ\]|$)/)?.[1]?.trim() ?? ''
  const dmText = raw.match(/\[面接誘導メッセージ\]([\s\S]*?)$/)?.[1]?.trim() ?? ''
  return { siteText, snsText, dmText }
}

export default function RecruitPage() {
  const { shopProfile } = useAppStore()
  const [type, setType] = useState('アルバイト')
  const [jobRoles, setJobRoles] = useState<string[]>([])
  const [jobRoleInput, setJobRoleInput] = useState('')
  const [wage, setWage] = useState('')
  const [minDays, setMinDays] = useState('週2日〜')
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [freeText, setFreeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')
  const [posterTheme, setPosterTheme] = useState<ThemeKey | null>(null)
  const [posterSize, setPosterSize] = useState<'A4' | 'A3'>('A4')
  const [downloading, setDownloading] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)

  const suggestedTheme = detectTheme(shopProfile?.industry ?? '')
  const activeTheme: ThemeKey = posterTheme ?? suggestedTheme

  const toggleShift = (s: string) =>
    setSelectedShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleOption = (key: string) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  const addJobRole = () => {
    const trimmed = jobRoleInput.trim()
    if (trimmed && !jobRoles.includes(trimmed)) {
      setJobRoles(prev => [...prev, trimmed])
    }
    setJobRoleInput('')
  }

  const removeJobRole = (role: string) =>
    setJobRoles(prev => prev.filter(r => r !== role))

  const handleJobRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addJobRole()
    }
  }

  const buildConditions = () => {
    const parts: string[] = []
    if (jobRoles.length > 0) parts.push(`募集職種：${jobRoles.join('・')}`)
    if (wage) parts.push(type === '社員・正社員' ? `月給${wage}` : `時給${wage}`)
    if (minDays) parts.push(minDays)
    if (selectedShifts.length > 0) parts.push(`勤務時間：${selectedShifts.join('・')}`)
    const activeToggles = TOGGLES
      .filter(t => toggles[t.key])
      .filter(t => !t.onlyFor || t.onlyFor === type)
      .map(t => t.label)
    parts.push(...activeToggles)
    if (freeText.trim()) parts.push(freeText.trim())
    return parts.join('、')
  }

  const handleGenerate = async () => {
    const conditions = buildConditions()
    if (!conditions || !shopProfile) return
    setError('')
    setRawOutput('')
    setLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'recruit',
          shopProfile,
          inputs: { type, jobRoles: jobRoles.join('・'), conditions },
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
      if (result.startsWith('ERROR:')) setError(result.replace('ERROR:', ''))
    } catch {
      setError('生成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const jsPDF = (await import('jspdf')).jsPDF
      const el = posterRef.current
      // 2回レンダリングして確実に描画させる
      await toPng(el, { pixelRatio: 2 })
      const imgData = await toPng(el, {
        quality: 1,
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
      })
      const isA3 = posterSize === 'A3'
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: posterSize.toLowerCase() as 'a4' | 'a3' })
      const w = isA3 ? 297 : 210
      const h = isA3 ? 420 : 297
      pdf.addImage(imgData, 'PNG', 0, 0, w, h)
      pdf.save(`求人ポスター_${shopProfile?.name || ''}_${posterSize}.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
      alert('ダウンロードに失敗しました')
    } finally {
      setDownloading(false)
    }
  }

  const results = parseResults(rawOutput)
  const hasResults = results.siteText || results.snsText || results.dmText
  const visibleToggles = TOGGLES.filter(t => !t.onlyFor || t.onlyFor === type)
  const activeToggleLabels = TOGGLES.filter(t => toggles[t.key] && (!t.onlyFor || t.onlyFor === type)).map(t => t.label)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="求人票・募集文ジェネレーター"
            description="店名・地域・業態はプロフィールから自動参照されます"
            backHref="/"
          />

          <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4 space-y-4">

            {/* 募集種別 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">募集種別</label>
              <div className="flex gap-2">
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs border transition-colors ${
                      type === t
                        ? 'bg-[#E8320A] text-white border-[#E8320A]'
                        : 'bg-white text-[#111008] border-[#EDE5DF] hover:border-[#E8320A]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ポスターデザイン */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">
                ポスターデザイン
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSTER_THEMES.map(theme => {
                  const isSelected = activeTheme === theme.key
                  const isSuggested = suggestedTheme === theme.key && posterTheme === null
                  return (
                    <button
                      key={theme.key}
                      onClick={() => setPosterTheme(theme.key)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-[#111008] bg-[#111008]'
                          : 'border-[#EDE5DF] bg-white hover:border-[#111008]'
                      }`}
                    >
                      {/* カラースウォッチ */}
                      <div className="flex gap-1 flex-shrink-0">
                        {theme.colors.map((c, i) => (
                          <div
                            key={i}
                            style={{ backgroundColor: c }}
                            className="w-3 h-3 rounded-full border border-black/10"
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#111008]'}`}>
                          {theme.label}
                          {isSuggested && (
                            <span className="ml-1.5 text-[9px] font-medium text-[#E8320A] bg-red-50 px-1.5 py-0.5 rounded-full">
                              推奨
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/60' : 'text-[#9A8880]'}`}>
                          {theme.sub}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 募集職種 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">
                募集職種（複数可）
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={jobRoleInput}
                  onChange={e => setJobRoleInput(e.target.value)}
                  onKeyDown={handleJobRoleKeyDown}
                  placeholder="例：ホールスタッフ、調理補助"
                  className="flex-1 border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
                <button
                  onClick={addJobRole}
                  disabled={!jobRoleInput.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#111008] text-white disabled:opacity-30 hover:bg-[#333] transition-colors"
                >
                  追加
                </button>
              </div>
              {jobRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {jobRoles.map(role => (
                    <span
                      key={role}
                      className="flex items-center gap-1.5 bg-[#111008] text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      {role}
                      <button
                        onClick={() => removeJobRole(role)}
                        className="text-[#9A8880] hover:text-white transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#9A8880] mt-1.5">Enterキーでも追加できます</p>
            </div>

            {/* 時給 / 月給 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">
                {type === '社員・正社員' ? '月給' : '時給'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wage}
                  onChange={e => setWage(e.target.value)}
                  placeholder={type === '社員・正社員' ? '例：220,000' : '例：1,100'}
                  className="flex-1 border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
                <span className="text-sm text-[#9A8880]">円〜</span>
              </div>
            </div>

            {/* 最低勤務日数 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">最低勤務日数</label>
              <div className="flex gap-2 flex-wrap">
                {MIN_DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => setMinDays(d)}
                    className={`py-1.5 px-3 rounded-full text-xs border transition-colors ${
                      minDays === d
                        ? 'bg-[#E8320A] text-white border-[#E8320A]'
                        : 'bg-white text-[#111008] border-[#EDE5DF]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 勤務時間帯 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">勤務時間帯（複数可）</label>
              <div className="flex gap-2 flex-wrap">
                {SHIFTS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleShift(s)}
                    className={`py-1.5 px-3 rounded-full text-xs border transition-colors ${
                      selectedShifts.includes(s)
                        ? 'bg-[#E8320A] text-white border-[#E8320A]'
                        : 'bg-white text-[#111008] border-[#EDE5DF]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 待遇・条件トグル */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">待遇・条件</label>
              <div className="flex flex-wrap gap-2">
                {visibleToggles.map(t => (
                  <button
                    key={t.key}
                    onClick={() => toggleOption(t.key)}
                    className={`py-1.5 px-3 rounded-full text-xs border transition-colors ${
                      toggles[t.key]
                        ? 'bg-[#111008] text-white border-[#111008]'
                        : 'bg-white text-[#111008] border-[#EDE5DF]'
                    }`}
                  >
                    {toggles[t.key] ? '✓ ' : ''}{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* その他自由入力 */}
            <div>
              <label className="block text-sm font-medium text-[#111008] mb-2">その他アピールポイント（任意）</label>
              <textarea
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="例：アットホームな職場、経験を活かして即リーダー候補"
                rows={2}
                className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '生成中...' : '求人文を生成する'}
          </button>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}

          {!loading && hasResults && (
            <div className="space-y-3">
              {results.siteText && (
                <ResultBlock label="求人サイト用" text={results.siteText} onRegenerate={handleGenerate} />
              )}
              {results.snsText && (
                <ResultBlock label="SNS・チラシ用" text={results.snsText} onRegenerate={handleGenerate} />
              )}
              {results.dmText && (
                <ResultBlock label="面接誘導メッセージ（DM・LINE用）" text={results.dmText} onRegenerate={handleGenerate} />
              )}

              {/* ポスターダウンロード */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4">
                <p className="text-sm font-bold text-[#111008] mb-3">📄 求人ポスター（PDF）</p>
                <div className="flex gap-2 mb-4">
                  {(['A4', 'A3'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setPosterSize(s)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                        posterSize === s
                          ? 'bg-[#111008] text-white border-[#111008]'
                          : 'bg-white text-[#111008] border-[#EDE5DF]'
                      }`}
                    >
                      {s}サイズ
                    </button>
                  ))}
                </div>

                {/* キャプチャ用（画面外） */}
                <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
                  <RecruitPoster
                    ref={posterRef}
                    shopName={shopProfile?.name || ''}
                    area={shopProfile?.area || ''}
                    industry={shopProfile?.industry || ''}
                    type={type}
                    jobRoles={jobRoles}
                    wage={wage}
                    minDays={minDays}
                    selectedShifts={selectedShifts}
                    activeToggles={activeToggleLabels}
                    freeText={freeText}
                    siteText={results.siteText}
                    size={posterSize}
                    themeKey={activeTheme}
                  />
                </div>

                {/* プレビュー（表示用・スケール縮小） */}
                <div className="overflow-hidden mb-4 rounded-lg border border-[#EDE5DF]" style={{ height: posterSize === 'A4' ? '421px' : '595px', width: posterSize === 'A4' ? '297px' : '421px' }}>
                  <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: posterSize === 'A4' ? '595px' : '842px' }}>
                    <RecruitPoster
                      shopName={shopProfile?.name || ''}
                      area={shopProfile?.area || ''}
                      industry={shopProfile?.industry || ''}
                      type={type}
                      jobRoles={jobRoles}
                      wage={wage}
                      minDays={minDays}
                      selectedShifts={selectedShifts}
                      activeToggles={activeToggleLabels}
                      freeText={freeText}
                      siteText={results.siteText}
                      size={posterSize}
                      themeKey={activeTheme}
                    />
                  </div>
                </div>

                <button
                  onClick={handleDownloadPoster}
                  disabled={downloading}
                  className="w-full bg-[#111008] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {downloading ? '生成中...' : `PDFをダウンロード（${posterSize}）`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
