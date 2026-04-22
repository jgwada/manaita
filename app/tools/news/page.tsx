'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { ExternalLink, Newspaper } from 'lucide-react'
import { useAppStore } from '@/store'

type Article = {
  id: string
  title: string
  url: string
  source_name: string
  category: string
  summary: string
  published_at: string
  fetched_date: string
}

const CATEGORIES = ['おすすめ', 'すべて', '外食・飲食業界', '食材・フードトレンド', '経営・コスト', '補助金・法律・規制', '農業・農家', '農業・政策', '水産・漁業', '食品・食材']

// 業態キーワード → 関連カテゴリのマッピング
const INDUSTRY_CATEGORY_MAP: { keywords: string[]; categories: string[] }[] = [
  { keywords: ['寿司', '海鮮', '魚', '鮮魚', '刺身', 'すし'], categories: ['水産・漁業', '外食・飲食業界', '食材・フードトレンド', '経営・コスト'] },
  { keywords: ['焼肉', '牛', '肉', 'ステーキ', 'ホルモン', '和牛'], categories: ['農業・農家', '外食・飲食業界', '食材・フードトレンド', '経営・コスト'] },
  { keywords: ['焼鳥', '鶏', '鳥', 'とり'], categories: ['農業・農家', '外食・飲食業界', '食材・フードトレンド', '経営・コスト'] },
  { keywords: ['野菜', 'ベジタリアン', 'ビーガン', '農家', 'オーガニック'], categories: ['農業・農家', '農業・政策', '外食・飲食業界', '食材・フードトレンド'] },
  { keywords: ['カフェ', 'コーヒー', 'スイーツ', 'ケーキ', 'パン', 'ベーカリー'], categories: ['食材・フードトレンド', '食品・食材', '外食・飲食業界', '経営・コスト'] },
  { keywords: ['イタリアン', 'フレンチ', 'フランス', '洋食', 'ビストロ', 'レストラン'], categories: ['食品・食材', '外食・飲食業界', '食材・フードトレンド', '経営・コスト'] },
  { keywords: ['居酒屋', '焼き鳥', '割烹', '和食', '日本料理'], categories: ['外食・飲食業界', '食材・フードトレンド', '経営・コスト', '補助金・法律・規制'] },
  { keywords: ['ラーメン', '中華', '餃子', 'チャイニーズ'], categories: ['食材・フードトレンド', '外食・飲食業界', '食品・食材', '経営・コスト'] },
]

function getRecommendedCategories(industry: string | null | undefined): string[] {
  if (!industry) return ['外食・飲食業界', '食材・フードトレンド', '経営・コスト', '補助金・法律・規制']
  const lower = industry.toLowerCase()
  for (const { keywords, categories } of INDUSTRY_CATEGORY_MAP) {
    if (keywords.some(k => lower.includes(k))) return categories
  }
  return ['外食・飲食業界', '食材・フードトレンド', '経営・コスト', '補助金・法律・規制']
}

const CATEGORY_COLORS: Record<string, string> = {
  '外食・飲食業界':     'bg-orange-100 text-orange-700',
  '食材・フードトレンド': 'bg-amber-100 text-amber-700',
  '経営・コスト':       'bg-red-100 text-red-700',
  '補助金・法律・規制': 'bg-indigo-100 text-indigo-700',
  '農業・農家':         'bg-green-100 text-green-700',
  '農業・政策':         'bg-lime-100 text-lime-700',
  '水産・漁業':         'bg-blue-100 text-blue-700',
  '食品・食材':         'bg-amber-100 text-amber-700',
  'Web検索':            'bg-purple-100 text-purple-700',
}

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
}

export default function NewsPage() {
  const { shopProfile } = useAppStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [latestDate, setLatestDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('おすすめ')

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setArticles(res.articles)
          setLatestDate(res.latestDate)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recommendedCats = getRecommendedCategories(shopProfile?.industry)
  const filtered = activeCategory === 'すべて'
    ? articles
    : activeCategory === 'おすすめ'
    ? articles.filter(a => recommendedCats.includes(a.category))
    : articles.filter(a => a.category === activeCategory)

  // 表示するカテゴリタブ（実際に記事があるもの + おすすめ・すべて）
  const activeCats = ['おすすめ', 'すべて', ...Array.from(new Set(articles.map(a => a.category)))]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PageHeader
            title="飲食ニュース"
            description="飲食・農業・水産業界の最新情報を毎朝6時に自動更新"
            backHref="/"
          />

          {/* 更新日 */}
          {latestDate && (
            <div className="flex items-center gap-2 mb-4 text-xs text-[#6B7280]">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>{new Date(latestDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 更新</span>
            </div>
          )}

          {/* カテゴリタブ */}
          {articles.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {activeCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                    activeCategory === cat
                      ? 'bg-[#E8320A] text-white'
                      : 'bg-white border border-[#E5E9F2] text-[#6B7280] hover:border-[#E8320A] hover:text-[#E8320A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ニュースなし */}
          {!loading && articles.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E9F2] p-10 text-center">
              <Newspaper size={32} className="text-[#C4C9D4] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280] font-medium">ニュースはまだありません</p>
              <p className="text-xs text-[#9CA3AF] mt-1">毎朝6時に自動で更新されます</p>
            </div>
          )}

          {/* 記事一覧 */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map(article => (
                <div key={article.id} className="bg-white rounded-2xl border border-[#E5E9F2] p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${categoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">{article.source_name}</span>
                        {article.published_at && (
                          <span className="text-[10px] text-[#9CA3AF]">{formatDate(article.published_at)}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#111827] leading-snug mb-1.5">
                        {article.title}
                      </p>
                      {article.summary && (
                        <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </div>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-[#F1F3F8] hover:bg-orange-50 hover:text-[#E8320A] text-[#9CA3AF] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-[#C4C9D4] mt-6">
            毎朝6時（日本時間）に自動更新
          </p>
        </div>
      </div>
    </AuthGuard>
  )
}
