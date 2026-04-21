'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Bug, Lightbulb, MessageCircle, Send, CheckCircle } from 'lucide-react'

const TYPES = [
  { value: 'bug', label: 'バグ報告', icon: Bug, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  { value: 'feature', label: '機能リクエスト', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'other', label: 'その他', icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
] as const

type FeedbackType = 'bug' | 'feature' | 'other'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim() }),
      })
      setDone(true)
      setTimeout(() => {
        setOpen(false)
        setDone(false)
        setTitle('')
        setDescription('')
        setType('feature')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquarePlus size={15} />
        ご意見・バグ報告
      </button>

      {/* モーダル */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {/* 閉じるボタン */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F1F3F8] rounded-full transition-colors"
            >
              <X size={15} />
            </button>

            {done ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle size={40} className="text-green-500" />
                <p className="font-bold text-[#111827]">送信しました！</p>
                <p className="text-sm text-[#6B7280]">ご意見ありがとうございます。</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#111827] mb-1">ご意見・バグ報告</h2>
                <p className="text-xs text-[#6B7280] mb-5">機能リクエストやバグはここから送ってください</p>

                {/* タイプ選択 */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {TYPES.map(({ value, label, icon: Icon, color, bg }) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        type === value ? bg + ' border-current ' + color : 'border-[#E5E9F2] text-[#9CA3AF] hover:border-[#d1d5db]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {/* タイトル */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-[#374151] mb-1.5 block">タイトル</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：SNS生成ボタンが押せない"
                    className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8320A] transition-colors"
                  />
                </div>

                {/* 詳細 */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-[#374151] mb-1.5 block">詳細</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="どんな状況で起きたか、どんな機能がほしいかを教えてください"
                    rows={4}
                    className="w-full border border-[#E5E9F2] rounded-xl px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8320A] transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !title.trim() || !description.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#E8320A] hover:bg-[#c92b09] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send size={14} />送信する</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
