'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { Plus, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

type Review = {
  id: string
  reviewer_name: string | null
  rating: number | null
  content: string
  replied: boolean
  reply_text: string | null
  reviewed_at: string | null
}

type Results = { patternA: string; patternB: string }

function parseResults(raw: string): Results {
  const patternA = raw.match(/\[パターンA（簡潔版）\]([\s\S]*?)(?=\[パターンB|$)/)?.[1]?.trim() ?? ''
  const patternB = raw.match(/\[パターンB（丁寧版）\]([\s\S]*?)$/)?.[1]?.trim() ?? ''
  return { patternA, patternB }
}

const STAR = (n: number | null) => n ? '⭐'.repeat(n) : '—'
const SENTIMENTS = ['高評価', '普通・改善あり', '低評価・クレーム']

export default function ReviewPage() {
  const { shopProfile } = useAppStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // 新規登録フォーム
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReviewerName, setNewReviewerName] = useState('')
  const [newRating, setNewRating] = useState<number>(5)
  const [newContent, setNewContent] = useState('')
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // 返信生成
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sentiment, setSentiment] = useState('高評価')
  const [generating, setGenerating] = useState(false)
  const [rawOutput, setRawOutput] = useState('')
  const [selectedReplyPattern, setSelectedReplyPattern] = useState<'A' | 'B'>('A')
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage('')
    const res = await fetch('/api/reviews/sync', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setSyncMessage(`${data.data.added}件の新しい口コミを取得しました`)
      await fetchReviews()
    } else {
      setSyncMessage(data.error || '同期に失敗しました')
    }
    setSyncing(false)
  }

  const fetchReviews = async () => {
    const res = await fetch('/api/reviews')
    const data = await res.json()
    if (data.success) setReviews(data.data)
    setLoadingList(false)
  }

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setAdding(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerName: newReviewerName,
        rating: newRating,
        content: newContent,
        reviewedAt: newDate || null,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setReviews(prev => [data.data, ...prev])
      setNewReviewerName('')
      setNewRating(5)
      setNewContent('')
      setNewDate('')
      setShowAddForm(false)
    }
    setAdding(false)
  }

  const handleSelect = (review: Review) => {
    if (selectedId === review.id) {
      setSelectedId(null)
      setRawOutput('')
      return
    }
    setSelectedId(review.id)
    setRawOutput('')
    setError('')
    // 評価から自動判定
    if (review.rating && review.rating >= 4) setSentiment('高評価')
    else if (review.rating && review.rating <= 2) setSentiment('低評価・クレーム')
    else setSentiment('普通・改善あり')
  }

  const handleGenerate = async (review: Review) => {
    if (!shopProfile) return
    setGenerating(true)
    setRawOutput('')
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'review',
          shopProfile,
          inputs: { review: review.content, sentiment },
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
      setGenerating(false)
    }
  }

  const handleMarkReplied = async (id: string, replyText: string) => {
    setMarkingId(id)
    const res = await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, replied: true, replyText }),
    })
    const data = await res.json()
    if (data.success) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, replied: true, reply_text: replyText } : r))
      setSelectedId(null)
      setRawOutput('')
    }
    setMarkingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この口コミを削除しますか？')) return
    const res = await fetch('/api/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (data.success) setReviews(prev => prev.filter(r => r.id !== id))
  }

  const unreplied = reviews.filter(r => !r.replied)
  const replied = reviews.filter(r => r.replied)
  const results = parseResults(rawOutput)
  const selectedReview = reviews.find(r => r.id === selectedId)
  const replyText = selectedReplyPattern === 'A' ? results.patternA : results.patternB

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="Google口コミ返信"
            description="口コミを選んでワンタップで返信文を生成"
            backHref="/"
          />

          {/* Googleから同期 */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE5DF] rounded-xl py-3 text-sm text-[#111008] hover:border-[#E8320A] transition-colors mb-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Googleから取得中...' : 'Googleから最新口コミを取得'}
          </button>
          {syncMessage && (
            <p className="text-xs text-center text-[#9A8880] mb-3">{syncMessage}</p>
          )}

          {/* 口コミ手動追加ボタン */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#EDE5DF] rounded-xl py-3 text-sm text-[#9A8880] hover:border-[#E8320A] hover:text-[#E8320A] transition-colors mb-4"
          >
            <Plus size={16} /> 手動で口コミを追加する
          </button>

          {/* 追加フォーム */}
          {showAddForm && (
            <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 mb-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#9A8880] mb-1 block">投稿者名（任意）</label>
                  <input
                    type="text"
                    value={newReviewerName}
                    onChange={e => setNewReviewerName(e.target.value)}
                    placeholder="例：山田 太郎"
                    className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9A8880] mb-1 block">評価</label>
                  <select
                    value={newRating}
                    onChange={e => setNewRating(Number(e.target.value))}
                    className="border border-[#EDE5DF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] bg-white"
                  >
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9A8880] mb-1 block">口コミ内容 <span className="text-[#E8320A]">*</span></label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Googleからコピペしてください"
                  rows={3}
                  className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A] resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#9A8880] mb-1 block">投稿日（任意）</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="border border-[#EDE5DF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !newContent.trim()}
                className="w-full bg-[#E8320A] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {adding ? '追加中...' : '追加する'}
              </button>
            </div>
          )}

          {loadingList && <LoadingSpinner />}

          {/* 未返信 */}
          {unreplied.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[#E8320A] rounded-full"></span>
                <span className="text-sm font-bold text-[#111008]">未返信 {unreplied.length}件</span>
              </div>
              <div className="space-y-2">
                {unreplied.map(review => (
                  <div key={review.id} className="bg-white border border-[#EDE5DF] rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleSelect(review)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{STAR(review.rating)}</span>
                            {review.reviewer_name && (
                              <span className="text-xs text-[#9A8880]">{review.reviewer_name}</span>
                            )}
                            {review.reviewed_at && (
                              <span className="text-xs text-[#9A8880]">{review.reviewed_at}</span>
                            )}
                          </div>
                          <p className="text-sm text-[#111008] line-clamp-2">{review.content}</p>
                        </div>
                        {selectedId === review.id ? <ChevronUp size={16} className="text-[#9A8880] shrink-0 mt-1" /> : <ChevronDown size={16} className="text-[#9A8880] shrink-0 mt-1" />}
                      </div>
                    </button>

                    {/* 展開パネル */}
                    {selectedId === review.id && (
                      <div className="border-t border-[#EDE5DF] p-4 bg-[#FFF9F5] space-y-3">
                        <p className="text-sm text-[#111008]">{review.content}</p>

                        {/* 評価傾向 */}
                        <div className="flex gap-2">
                          {SENTIMENTS.map(s => (
                            <button
                              key={s}
                              onClick={() => setSentiment(s)}
                              className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${
                                sentiment === s ? 'bg-[#E8320A] text-white border-[#E8320A]' : 'bg-white text-[#111008] border-[#EDE5DF]'
                              }`}
                            >
                              {s === '高評価' ? '😊' : s === '普通・改善あり' ? '😐' : '😞'} {s}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleGenerate(review)}
                          disabled={generating}
                          className="w-full bg-[#E8320A] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                        >
                          {generating ? '生成中...' : '返信文を生成する'}
                        </button>

                        {generating && <LoadingSpinner />}
                        {error && <ErrorMessage message={error} />}

                        {(results.patternA || results.patternB) && (
                          <div className="space-y-3">
                            {/* パターン切替 */}
                            <div className="flex gap-2">
                              {(['A', 'B'] as const).map(p => (
                                <button
                                  key={p}
                                  onClick={() => setSelectedReplyPattern(p)}
                                  className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${
                                    selectedReplyPattern === p ? 'bg-[#111008] text-white border-[#111008]' : 'bg-white text-[#111008] border-[#EDE5DF]'
                                  }`}
                                >
                                  パターン{p}（{p === 'A' ? '簡潔版' : '丁寧版'}）
                                </button>
                              ))}
                            </div>

                            <div className="bg-white border border-[#EDE5DF] rounded-lg p-3">
                              <p className="text-sm text-[#111008] leading-relaxed">{replyText}</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => navigator.clipboard.writeText(replyText)}
                                className="flex-1 border border-[#EDE5DF] rounded-lg py-2.5 text-sm text-[#111008] hover:border-[#E8320A] transition-colors"
                              >
                                コピー
                              </button>
                              <button
                                onClick={() => handleMarkReplied(review.id, replyText)}
                                disabled={markingId === review.id}
                                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Check size={14} /> 返信済みにする
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(review.id)}
                          className="w-full text-xs text-[#9A8880] py-1 hover:text-[#E8320A] transition-colors"
                        >
                          削除する
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 返信済み */}
          {replied.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-bold text-[#111008]">返信済み {replied.length}件</span>
              </div>
              <div className="space-y-2">
                {replied.map(review => (
                  <div key={review.id} className="bg-white border border-[#EDE5DF] rounded-xl p-4 opacity-60">
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={12} className="text-green-600" />
                      <span className="text-sm">{STAR(review.rating)}</span>
                      {review.reviewer_name && <span className="text-xs text-[#9A8880]">{review.reviewer_name}</span>}
                    </div>
                    <p className="text-sm text-[#111008] line-clamp-2">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingList && reviews.length === 0 && (
            <div className="text-center py-12 text-[#9A8880]">
              <p className="text-sm">口コミがまだ登録されていません</p>
              <p className="text-xs mt-1">上の「口コミを追加する」から登録してください</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
