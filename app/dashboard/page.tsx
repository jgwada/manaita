'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

type SurveyItem = {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

type DashboardData = {
  shop: { id: string; name: string; public_token: string; google_review_url: string | null }
  surveys: SurveyItem[]
  avgRating: number | null
  totalCount: number
  googleRedirectCount: number
}

const STAR_LABELS: Record<number, string> = {
  5: '最高', 4: '良い', 3: '普通', 2: '改善', 1: '不満'
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(res.error)
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const surveyUrl = data?.shop?.public_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${data.shop.public_token}`
    : ''

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="満足度ダッシュボード"
            description="お客様のフィードバックを管理します"
            backHref="/"
          />

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-[#E8320A] text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {data && (
            <div className="space-y-4">
              {/* サマリー */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#E8320A]">
                    {data.avgRating ?? '—'}
                  </p>
                  <p className="text-xs text-[#9A8880] mt-1">平均評価</p>
                </div>
                <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#111008]">{data.totalCount}</p>
                  <p className="text-xs text-[#9A8880] mt-1">総回答数</p>
                </div>
                <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#111008]">{data.googleRedirectCount}</p>
                  <p className="text-xs text-[#9A8880] mt-1">Google誘導数</p>
                </div>
              </div>

              {/* 設定リンク */}
              <Link
                href="/tools/survey-settings"
                className="block w-full text-center border border-[#EDE5DF] bg-white rounded-xl py-3 text-sm text-[#111008] hover:border-[#E8320A] transition-colors"
              >
                ⚙️ アンケートの選択肢を設定する
              </Link>

              {/* QRコード */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-6">
                <h2 className="text-sm font-bold text-[#111008] mb-4">アンケートQRコード</h2>
                <div className="flex flex-col items-center gap-4">
                  {surveyUrl && (
                    <QRCodeSVG value={surveyUrl} size={160} />
                  )}
                  <p className="text-xs text-[#9A8880] text-center break-all">{surveyUrl}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(surveyUrl)}
                    className="text-sm text-[#E8320A] border border-[#E8320A] rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
                  >
                    URLをコピー
                  </button>
                </div>
              </div>

              {/* フィードバック一覧 */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4">
                <h2 className="text-sm font-bold text-[#111008] mb-3">フィードバック一覧</h2>
                {data.surveys.length === 0 ? (
                  <p className="text-sm text-[#9A8880] text-center py-6">まだ回答がありません</p>
                ) : (
                  <div className="space-y-3">
                    {data.surveys.map((s) => (
                      <div key={s.id} className="border-b border-[#EDE5DF] last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{'⭐'.repeat(s.rating)}</span>
                            <span className="text-xs text-[#9A8880]">{STAR_LABELS[s.rating]}</span>
                          </div>
                          <span className="text-xs text-[#9A8880]">
                            {new Date(s.created_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        {s.comment && (
                          <p className="text-sm text-[#111008]">{s.comment}</p>
                        )}
                      </div>
                    ))}
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
