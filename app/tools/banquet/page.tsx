'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Upload, X, CheckCircle, Copy, FileText, Image as ImageIcon } from 'lucide-react'

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
  additionalIngredients: string[]
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

function extractAdditionalIngredients(text: string): string[] {
  const block = text.match(/追加食材：([\s\S]*?)(?=【プラン\d】|$)/)?.[1] ?? ''
  if (!block.trim() || block.includes('追加食材なし')) return []
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
      additionalIngredients: extractAdditionalIngredients(content),
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

        {plan.appeal && (
          <div className={`${color.bg} rounded-xl p-3`}>
            <p className="text-xs font-bold text-[#9A8880] mb-1">💡 売りポイント</p>
            <p className="text-sm text-[#111008] leading-relaxed">{plan.appeal}</p>
          </div>
        )}

        {plan.additionalIngredients.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700 mb-2">🛒 追加食材</p>
            <ul className="space-y-1">
              {plan.additionalIngredients.map((item, i) => (
                <li key={i} className="text-xs text-amber-800 leading-relaxed">・{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BanquetGenPage() {
  const { shopProfile } = useAppStore()
  const [ingredientMode, setIngredientMode] = useState<'existing' | 'additional'>('additional')
  const [files, setFiles] = useState<File[]>([])
  const [menuText, setMenuText] = useState('')
  const [wishes, setWishes] = useState('')
  const [priceMin, setPriceMin] = useState('5000')
  const [priceMax, setPriceMax] = useState('8000')
  const [loading, setLoading] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const plans = parsePlans(rawOutput)
  const hasResults = plans.length > 0

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const valid: File[] = []
    for (const f of Array.from(newFiles)) {
      if (f.size > 4 * 1024 * 1024) {
        setError(`「${f.name}」は4MBを超えています。圧縮してから追加してください。`)
        continue
      }
      valid.push(f)
    }
    setFiles(prev => [...prev, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  const canGenerate = () => {
    if (!shopProfile) return false
    return files.length > 0 || menuText.trim().length > 0
  }

  const handleGenerate = async () => {
    if (!canGenerate() || !shopProfile) return
    setError('')
    setRawOutput('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('shopProfile', JSON.stringify(shopProfile))
      formData.append('priceMin', priceMin)
      formData.append('priceMax', priceMax)
      formData.append('ingredientMode', ingredientMode)
      formData.append('menuText', menuText)
      formData.append('wishes', wishes)

      for (const f of files) {
        const isImage = f.type.startsWith('image/')
        if (isImage) {
          const compressed = await compressImageToBase64(f)
          const blob = await fetch(`data:image/jpeg;base64,${compressed}`).then(r => r.blob())
          formData.append('file', blob, f.name.replace(/\.[^.]+$/, '.jpg'))
        } else {
          formData.append('file', f)
        }
      }

      const response = await fetch('/api/banquet-gen', {
        method: 'POST',
        body: formData,
      })

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="宴会プランジェネレーター"
            description="メニューを読み込んで、売れる宴会プランと価格を自動提案"
            backHref="/"
          />

          {/* 価格レンジ */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-3">推奨売価のレンジ（円/人）</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-[#9A8880] mb-1 block">下限</label>
                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} step={500}
                  className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]" />
              </div>
              <span className="text-[#9A8880] mt-4">〜</span>
              <div className="flex-1">
                <label className="text-xs text-[#9A8880] mb-1 block">上限</label>
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} step={500}
                  className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]" />
              </div>
            </div>
          </div>

          {/* 食材モード */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-3">食材の使い方</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIngredientMode('existing')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${ingredientMode === 'existing' ? 'border-[#E8320A] bg-red-50 text-[#E8320A]' : 'border-[#EDE5DF] text-[#9A8880] hover:border-[#E8320A]'}`}>
                <span className="text-lg">🍽️</span>
                <span className="text-xs font-bold">既存食材のみ</span>
                <span className="text-[10px] opacity-70">今あるもので組む</span>
              </button>
              <button onClick={() => setIngredientMode('additional')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${ingredientMode === 'additional' ? 'border-[#E8320A] bg-red-50 text-[#E8320A]' : 'border-[#EDE5DF] text-[#9A8880] hover:border-[#E8320A]'}`}>
                <span className="text-lg">🛒</span>
                <span className="text-xs font-bold">追加食材もOK</span>
                <span className="text-[10px] opacity-70">買い足しも提案</span>
              </button>
            </div>
          </div>

          {/* ファイル添付 */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-1">メニューのファイルを添付</p>
            <p className="text-xs text-[#9A8880] mb-3">PDF・JPEG・PNG を複数添付できます（1ファイル4MBまで）</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={e => addFiles(e.target.files)}
              className="hidden"
            />

            {files.length > 0 && (
              <div className="space-y-2 mb-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                    {f.type === 'application/pdf'
                      ? <FileText size={16} className="text-green-600 flex-shrink-0" />
                      : <ImageIcon size={16} className="text-green-600 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111008] truncate">{f.name}</p>
                      <p className="text-[10px] text-[#9A8880]">{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-[#9A8880] hover:text-[#E8320A] flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDragEnter={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#EDE5DF] rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-[#E8320A] hover:bg-red-50 transition-all"
            >
              <Upload size={22} className="text-[#9A8880]" />
              <p className="text-xs font-bold text-[#111008]">ファイルを追加</p>
              <p className="text-[10px] text-[#9A8880]">タップ または ドラッグ＆ドロップ</p>
            </div>
          </div>

          {/* テキスト入力 */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-1">テキストで補足入力 <span className="text-[#9A8880] font-normal text-xs">（任意）</span></p>
            <p className="text-xs text-[#9A8880] mb-2">日替わりメニューや追加食材など、ファイルに載っていない情報を自由に入力できます</p>
            <textarea
              value={menuText}
              onChange={e => setMenuText(e.target.value)}
              placeholder={`例：
本日のおすすめ：天然ぶり刺身 980円
日替わり食材：松茸（今週のみ）
...`}
              rows={4}
              className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
            />
          </div>

          {/* 希望欄 */}
          <div className="bg-white border border-[#EDE5DF] rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-[#111008] mb-0.5">希望・こだわり <span className="text-[#9A8880] font-normal text-xs">（任意）</span></p>
            <p className="text-xs text-[#9A8880] mb-2">ターゲットや食材へのこだわりなど、プランに反映させたい要望を自由に入力してください</p>
            <textarea
              value={wishes}
              onChange={e => setWishes(e.target.value)}
              placeholder={`例：
・仕事帰りのサラリーマン向けのコスパ重視プランにしたい
・インバウンド（中国富裕層）が喜ぶ豪華コースにしたい
・今まで扱ってこなかった高級食材を使って差別化したい
・平日限定の家族向けお食事メインプランが欲しい`}
              rows={4}
              className="w-full border border-[#EDE5DF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
            />
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate()}
            className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-bold text-base hover:bg-[#c92b09] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '分析・生成中...' : '🍺 宴会プランを提案してもらう'}
          </button>

          {loading && (
            <div className="bg-white border border-[#EDE5DF] rounded-2xl p-8 text-center mb-6">
              <div className="w-10 h-10 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-[#111008] text-sm">メニューを解析しています...</p>
              <p className="text-xs text-[#9A8880] mt-1">全国の繁盛店データを参照して提案中</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl mb-4 whitespace-pre-wrap">
              {error}
            </div>
          )}

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
