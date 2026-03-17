'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { FileText, Camera, Type, Upload, CheckCircle, Copy } from 'lucide-react'

type InputMethod = 'pdf' | 'image' | 'text'

// 画像をCanvas経由で圧縮してbase64（JPEG）に変換
function compressImageToBase64(file: File, maxPx = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      URL.revokeObjectURL(url)
      resolve(dataUrl.replace(/^data:image\/jpeg;base64,/, ''))
    }
    img.onerror = reject
    img.src = url
  })
}

type Plan = {
  number: number
  name: string
  target: string
  courses: string[]
  price: string
  drinks: string
  costRatio: string
  profitPer: string
  profit10: string
  appeal: string
}

function extractField(text: string, label: string): string {
  const regex = new RegExp(`${label}：([^\n]+)`)
  return text.match(regex)?.[1]?.trim() ?? ''
}

function extractCourses(text: string): string[] {
  const block = text.match(/コース構成：([\s\S]*?)(?=推奨売価|$)/)?.[1] ?? ''
  return block.split('\n')
    .map(l => l.replace(/^・/, '').trim())
    .filter(Boolean)
}

function parsePlans(raw: string): Plan[] {
  const plans: Plan[] = []
  const planRegex = /【プラン(\d)】([\s\S]*?)(?=【プラン\d】|$)/g
  let match
  while ((match = planRegex.exec(raw)) !== null) {
    const content = match[2].trim()
    plans.push({
      number: parseInt(match[1]),
      name: extractField(content, 'プラン名'),
      target: extractField(content, 'ターゲット'),
      courses: extractCourses(content),
      price: extractField(content, '推奨売価'),
      drinks: extractField(content, '飲み放題'),
      costRatio: extractField(content, '想定原価率'),
      profitPer: extractField(content, '一人あたり粗利'),
      profit10: extractField(content, '10名での粗利'),
      appeal: extractField(content, '売りポイント'),
    })
  }
  return plans
}

function planToText(plan: Plan): string {
  return `【${plan.name}】
ターゲット：${plan.target}
コース構成：
${plan.courses.map(c => `・${c}`).join('\n')}
推奨売価：${plan.price}
飲み放題：${plan.drinks}
想定原価率：${plan.costRatio}
一人あたり粗利：${plan.profitPer}
10名での粗利：${plan.profit10}
売りポイント：${plan.appeal}`
}

const PLAN_COLORS = [
  { badge: 'bg-[#E8320A] text-white', border: 'border-[#E8320A]', bg: 'bg-red-50' },
  { badge: 'bg-[#111008] text-white', border: 'border-[#111008]', bg: 'bg-gray-50' },
  { badge: 'bg-amber-500 text-white', border: 'border-amber-500', bg: 'bg-amber-50' },
]

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const [copied, setCopied] = useState(false)
  const color = PLAN_COLORS[index % 3]

  const handleCopy = () => {
    navigator.clipboard.writeText(planToText(plan))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-white border-2 ${color.border} rounded-2xl overflow-hidden`}>
      {/* ヘッダー */}
      <div className={`${color.bg} px-5 py-4 border-b ${color.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${color.badge} mb-2`}>
              プラン {plan.number}
            </span>
            <h3 className="text-lg font-bold text-[#111008] leading-tight">{plan.name}</h3>
            <p className="text-sm text-[#9A8880] mt-1">🎯 {plan.target}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-[#9A8880] border border-[#EDE5DF] bg-white rounded-lg px-2.5 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors"
          >
            {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? 'コピー済' : 'コピー'}
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* コース構成 */}
        <div>
          <p className="text-xs font-bold text-[#9A8880] uppercase tracking-wider mb-2">コース構成</p>
          <ul className="space-y-1">
            {plan.courses.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#111008]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8320A] flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* 価格・利益グリッド */}
        <div>
          <p className="text-xs font-bold text-[#9A8880] uppercase tracking-wider mb-2">価格・収益シミュレーション</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#9A8880] mb-0.5">推奨売価</p>
              <p className="text-sm font-bold text-[#E8320A]">{plan.price}</p>
            </div>
            <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#9A8880] mb-0.5">想定原価率</p>
              <p className="text-sm font-bold text-[#111008]">{plan.costRatio}</p>
            </div>
            <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#9A8880] mb-0.5">粗利/1人</p>
              <p className="text-sm font-bold text-[#111008]">{plan.profitPer}</p>
            </div>
            <div className="bg-[#FFF9F5] border border-[#EDE5DF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#9A8880] mb-0.5">粗利/10名</p>
              <p className="text-sm font-bold text-green-600">{plan.profit10}</p>
            </div>
          </div>
          {plan.drinks && (
            <p className="text-xs text-[#9A8880] mt-2 text-center">飲み放題：{plan.drinks}</p>
          )}
        </div>

        {/* 売りポイント */}
        {plan.appeal && (
          <div className={`${color.bg} rounded-xl p-3`}>
            <p className="text-xs font-bold text-[#9A8880] mb-1">💡 売りポイント</p>
            <p className="text-sm text-[#111008] leading-relaxed">{plan.appeal}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BanquetGenPage() {
  const { shopProfile } = useAppStore()
  const [method, setMethod] = useState<InputMethod>('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [menuText, setMenuText] = useState('')
  const [priceMin, setPriceMin] = useState('5000')
  const [priceMax, setPriceMax] = useState('8000')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const plans = parsePlans(rawOutput)
  const hasResults = plans.length > 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  const canGenerate = () => {
    if (!shopProfile) return false
    if (method === 'text') return menuText.trim().length > 0
    return file !== null
  }

  const handleGenerate = async () => {
    if (!canGenerate() || !shopProfile) return
    setError('')
    setRawOutput('')
    setLoading(true)

    try {
      if ((method === 'pdf' || method === 'image') && file) {
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('ファイルサイズが大きすぎます（20MB以下のファイルをご利用ください）')
        }
      }

      const formData = new FormData()
      formData.append('inputType', method)
      formData.append('shopProfile', JSON.stringify(shopProfile))
      formData.append('priceMin', priceMin)
      formData.append('priceMax', priceMax)
      if (method === 'text') {
        formData.append('menuText', menuText)
      } else if (file) {
        // 画像はCanvasで圧縮してから送る
        if (method === 'image') {
          const compressed = await compressImageToBase64(file)
          const blob = await fetch(`data:image/jpeg;base64,${compressed}`).then(r => r.blob())
          formData.append('file', blob, 'menu.jpg')
        } else {
          formData.append('file', file)
        }
      }

      const response = await fetch('/api/banquet-gen', {
        method: 'POST',
        body: formData,
      })

      // JSON エラーレスポンスを先に検出
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `エラーが発生しました (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setRawOutput(result)
      }
      if (result.startsWith('ERROR:')) {
        setError(result.replace('ERROR:', '').trim())
        setRawOutput('')
      } else if (!result.trim()) {
        setError('生成結果が空でした。もう一度お試しください。')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const methods: { id: InputMethod; icon: React.ReactNode; label: string; sub: string }[] = [
    { id: 'pdf', icon: <FileText size={22} />, label: 'PDFを読み込む', sub: 'メニューのPDFファイル' },
    { id: 'image', icon: <Camera size={22} />, label: '写真を使う', sub: 'メニューを撮影した画像' },
    { id: 'text', icon: <Type size={22} />, label: 'テキストで入力', sub: 'メニューをコピペ' },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="宴会プランジェネレーター"
            description="グランドメニューを読み込んで、売れる宴会プランと価格を自動提案"
            backHref="/"
          />

          {/* 価格レンジ */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-3">推奨売価のレンジ（円/人）</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-[#9A8880] mb-1 block">下限</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  step={500}
                  className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
              </div>
              <span className="text-[#9A8880] mt-4">〜</span>
              <div className="flex-1">
                <label className="text-xs text-[#9A8880] mb-1 block">上限</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  step={500}
                  className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
              </div>
            </div>
          </div>

          {/* 入力方法選択 */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-3">メニューの入力方法</p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setFile(null); setMenuText('') }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    method === m.id
                      ? 'border-[#E8320A] bg-red-50 text-[#E8320A]'
                      : 'border-[#EDE5DF] text-[#9A8880] hover:border-[#E8320A]'
                  }`}
                >
                  {m.icon}
                  <span className="text-xs font-bold leading-tight">{m.label}</span>
                  <span className="text-[10px] opacity-70">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 入力エリア */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            {(method === 'pdf' || method === 'image') && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={method === 'pdf' ? 'application/pdf' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                  capture={method === 'image' ? 'environment' : undefined}
                />
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111008] truncate">{file.name}</p>
                      <p className="text-xs text-[#9A8880]">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-xs text-[#9A8880] hover:text-[#E8320A]"
                    >
                      変更
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#EDE5DF] rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#E8320A] hover:bg-red-50 transition-all"
                  >
                    <Upload size={28} className="text-[#9A8880]" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#111008]">
                        {method === 'pdf' ? 'PDFをアップロード' : '写真を選択・撮影'}
                      </p>
                      <p className="text-xs text-[#9A8880] mt-1">タップしてファイルを選ぶ</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {method === 'text' && (
              <>
                <p className="text-sm font-medium text-[#111008] mb-2">
                  メニューの内容を貼り付けてください
                </p>
                <textarea
                  value={menuText}
                  onChange={e => setMenuText(e.target.value)}
                  placeholder={`例：
【前菜】サラダ 680円、枝豆 380円
【刺身】本日の刺身盛り 1,280円
【焼き物】牛タン塩焼き 1,480円、鶏もも焼き 780円
【揚げ物】唐揚げ 680円
...`}
                  rows={8}
                  className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
                />
              </>
            )}
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate()}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '分析・生成中...' : '🍺 宴会プランを提案してもらう'}
          </button>

          {/* ローディング */}
          {loading && (
            <div className="bg-white border border-[#EDE5DF] rounded-2xl p-8 text-center mb-6">
              <div className="w-10 h-10 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-[#111008] text-sm">メニューを解析しています...</p>
              <p className="text-xs text-[#9A8880] mt-1">全国の繁盛店データを参照して提案中</p>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* 結果 */}
          {!loading && hasResults && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#9A8880] uppercase tracking-widest">
                提案プラン — {plans.length}案
              </p>
              {plans.map((plan, i) => (
                <PlanCard key={plan.number} plan={plan} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
