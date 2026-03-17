'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type Setting = { id: string; category: string; label: string }
type Step = 'form' | 'review' | 'thanks'

const SCENES = ['デート・記念日', '家族での食事', '友人との飲み会', '職場の宴会・歓送迎会', '一人ごはん', 'その他']

export default function SurveyPage() {
  const { publicToken } = useParams<{ publicToken: string }>()
  const [settings, setSettings] = useState<Setting[]>([])
  const [shopName, setShopName] = useState('')

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const [selectedGoodPoints, setSelectedGoodPoints] = useState<string[]>([])
  const [scene, setScene] = useState('')
  const [revisitScore, setRevisitScore] = useState(3)
  const [freeComment, setFreeComment] = useState('')

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [generatedReview, setGeneratedReview] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/survey-public?token=${publicToken}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setSettings(res.data.settings)
          setShopName(res.data.shopName)
        }
      })
  }, [publicToken])

  const menuOptions = settings.filter(s => s.category === 'menu')
  const goodPointOptions = settings.filter(s => s.category === 'good_point')

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const handleSubmit = async () => {
    if (!rating || selectedMenus.length === 0 || selectedGoodPoints.length === 0) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken, rating, selectedMenus, selectedGoodPoints, scene, revisitScore, freeComment }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      if (rating >= 4 && data.data.generatedReview) {
        setGeneratedReview(data.data.generatedReview)
        setGoogleReviewUrl(data.data.googleReviewUrl || '')
        setStep('review')
      } else {
        setStep('thanks')
      }
    } catch {
      setError('送信に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'review') {
    return (
      <div className="min-h-screen bg-[#FFF9F5] px-4 py-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-lg font-bold text-[#111008]">ありがとうございます！</h1>
            <p className="text-sm text-[#9A8880] mt-1">
              よろしければ、Googleでもご感想をお聞かせください
            </p>
          </div>

          <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4">
            <p className="text-xs font-medium text-[#9A8880] mb-2">口コミ文（コピーしてGoogleに貼るだけ！）</p>
            <p className="text-sm text-[#111008] leading-relaxed">{generatedReview}</p>
          </div>

          <button
            onClick={handleCopy}
            className={`w-full rounded-xl py-3.5 font-medium text-sm mb-3 transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-[#111008] text-white hover:bg-[#333]'
            }`}
          >
            {copied ? 'コピーしました！' : '口コミ文をコピーする'}
          </button>

          {googleReviewUrl && (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#E8320A] text-white rounded-xl py-3.5 font-medium text-sm text-center mb-3"
            >
              Googleで口コミを投稿する
            </a>
          )}

          <button onClick={() => setStep('thanks')} className="w-full text-sm text-[#9A8880] py-2">
            またの機会に
          </button>
        </div>
      </div>
    )
  }

  if (step === 'thanks') {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-xl font-bold text-[#111008] mb-2">ありがとうございました</h1>
          <p className="text-sm text-[#9A8880]">
            貴重なご意見をいただきありがとうございます。<br />
            サービス向上に活かしてまいります。
          </p>
        </div>
      </div>
    )
  }

  const canSubmit = rating > 0 && selectedMenus.length > 0 && selectedGoodPoints.length > 0

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* ヘッダー */}
      <div className="bg-[#111008] px-4 py-6">
        <p className="text-[#9A8880] text-xs mb-1">ご来店ありがとうございます</p>
        <h1 className="text-white text-xl font-bold">本日のお食事は<br />いかがでしたか？</h1>
        <p className="text-[#9A8880] text-xs mt-2">皆様のご意見をもとに、より良いお店づくりに活かしてまいります。</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* 1. 満足度 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-[#E8320A] text-white text-xs rounded-full flex items-center justify-center font-bold">1</span>
            <span className="font-medium text-[#111008]">総合的なご満足度</span>
            <span className="text-[#E8320A] text-xs font-medium">必須</span>
          </div>
          <div className="flex gap-3">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="text-4xl transition-transform hover:scale-110"
              >
                {star <= (hovered || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. メニュー */}
        {menuOptions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 bg-[#E8320A] text-white text-xs rounded-full flex items-center justify-center font-bold">2</span>
              <span className="font-medium text-[#111008]">ご注文されたメニュー（複数可）</span>
              <span className="text-[#E8320A] text-xs font-medium">必須</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {menuOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleItem(selectedMenus, setSelectedMenus, opt.label)}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    selectedMenus.includes(opt.label)
                      ? 'bg-[#E8320A] text-white border-[#E8320A]'
                      : 'bg-white text-[#111008] border-[#EDE5DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. 良かった点 */}
        {goodPointOptions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 bg-[#E8320A] text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
              <span className="font-medium text-[#111008]">特に良かった点（複数可）</span>
              <span className="text-[#E8320A] text-xs font-medium">必須</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {goodPointOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleItem(selectedGoodPoints, setSelectedGoodPoints, opt.label)}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    selectedGoodPoints.includes(opt.label)
                      ? 'bg-[#E8320A] text-white border-[#E8320A]'
                      : 'bg-white text-[#111008] border-[#EDE5DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. また来たい */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-[#E8320A] text-white text-xs rounded-full flex items-center justify-center font-bold">4</span>
            <span className="font-medium text-[#111008]">また来たいですか？</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">😐</span>
            <input
              type="range"
              min={1}
              max={5}
              value={revisitScore}
              onChange={e => setRevisitScore(Number(e.target.value))}
              className="flex-1 accent-[#E8320A]"
            />
            <span className="text-2xl">🔥</span>
            {revisitScore >= 4 && (
              <span className="bg-[#E8320A] text-white text-xs px-2 py-1 rounded-lg font-bold whitespace-nowrap">また来たい！</span>
            )}
          </div>
        </div>

        {/* 5. シーン */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-[#9A8880] text-white text-xs rounded-full flex items-center justify-center font-bold">5</span>
            <span className="font-medium text-[#111008]">どんなシーンでご利用でしたか？</span>
          </div>
          <select
            value={scene}
            onChange={e => setScene(e.target.value)}
            className="w-full border border-[#EDE5DF] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
          >
            <option value="">選択してください（任意）</option>
            {SCENES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 6. 自由コメント */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-[#9A8880] text-white text-xs rounded-full flex items-center justify-center font-bold">6</span>
            <span className="font-medium text-[#111008]">印象的だったこと・ご感想（任意）</span>
          </div>
          <textarea
            value={freeComment}
            onChange={e => setFreeComment(e.target.value)}
            placeholder={`例：${shopName}の料理がとても美味しかったです`}
            rows={3}
            className="w-full border border-[#EDE5DF] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-[#E8320A] bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'AI口コミ文を生成中...' : 'アンケートに回答する 🚀'}
        </button>
      </div>
    </div>
  )
}
