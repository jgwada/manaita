'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/layout/AuthGuard'
import { Store, Users, Plus, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Mail, LogIn, Pencil, Save, X, Activity } from 'lucide-react'

type Shop = { id: string; name: string; area: string; industry: string; research_cache: string | null; research_updated_at: string | null }
type User = { id: string; email: string; role: string; is_active: boolean; created_at: string; shops: { name: string } | null }
type LogEntry = { id: string; shop_id: string; tool_name: string; input_summary: string | null; created_at: string; shops: { name: string } | null }

const TOOL_LABELS: Record<string, string> = {
  sns: 'SNS文章',
  review: '口コミ返信',
  recruit: '求人文章',
  banquet: '宴会プラン',
  'banquet-gen': '宴会コース生成',
  manual: 'マニュアル',
  chat: '経営相談',
  advisor: '集客アドバイザー',
  'advisor-research': 'アドバイザーリサーチ',
  research: '競合リサーチ',
}

export default function AdminPage() {
  const router = useRouter()
  const { user, setShopProfile } = useAppStore()
  const [enteringShopId, setEnteringShopId] = useState<string | null>(null)
  const [editingCacheId, setEditingCacheId] = useState<string | null>(null)
  const [editingCacheText, setEditingCacheText] = useState<string>('')
  const [savingCacheId, setSavingCacheId] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logShopFilter, setLogShopFilter] = useState<string>('all')

  const handleEnterShop = async (shopId: string) => {
    setEnteringShopId(shopId)
    try {
      const res = await fetch(`/api/admin/shops/${shopId}`)
      const json = await res.json()
      if (json.success && json.shop) {
        const s = json.shop
        const profile = {
          id: s.id,
          name: s.name,
          area: s.area,
          industry: s.industry,
          priceRange: s.price_range,
          seats: s.seats,
          googleReviewUrl: s.google_review_url,
          placeId: s.place_id,
          lineOfficialUrl: s.line_official_url,
          researchCache: s.research_cache,
          createdAt: s.created_at,
        }
        // sessionStorageに保存してページ遷移後も維持できるようにする
        sessionStorage.setItem('admin_viewing_shop', JSON.stringify(profile))
        setShopProfile(profile)
        router.push('/')
      }
    } finally {
      setEnteringShopId(null)
    }
  }
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [researchingId, setResearchingId] = useState<string | null>(null)
  const [researchedId, setResearchedId] = useState<string | null>(null)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  const [retryShopId, setRetryShopId] = useState<string | null>(null)
  const [expandedCacheId, setExpandedCacheId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [resetSentId, setResetSentId] = useState<string | null>(null)
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchShops()
    fetchUsers()
    fetchLogs()
  }, [user, router])

  const fetchShops = async () => {
    const res = await fetch('/api/admin/shops')
    const json = await res.json()
    if (json.success) setShops(json.data)
    setLoading(false)
  }

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    if (json.success) setUsers(json.data)
  }

  const fetchLogs = async (shopId?: string) => {
    setLogsLoading(true)
    const url = shopId && shopId !== 'all' ? `/api/admin/logs?shopId=${shopId}` : '/api/admin/logs'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) setLogs(json.data)
    setLogsLoading(false)
  }

  const handleResetPassword = async (userId: string, email: string) => {
    setResetLoadingId(userId)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.success) {
        setResetSentId(userId)
        setTimeout(() => setResetSentId(null), 3000)
      }
    } finally {
      setResetLoadingId(null)
    }
  }

  const doResearch = async (shopId: string, retryCount = 0) => {
    setResearchingId(shopId)
    setResearchedId(null)
    setResearchError(null)
    setRetryCountdown(null)
    setRetryShopId(null)
    try {
      const res = await fetch('/api/admin/research-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      })
      const json = await res.json()
      if (json.success) {
        setResearchedId(shopId)
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, research_cache: json.research, research_updated_at: json.research_updated_at } : s))
      } else if (json.error === 'RATE_LIMIT' && retryCount < 2) {
        setRetryShopId(shopId)
        let count = 60
        setRetryCountdown(count)
        const timer = setInterval(() => {
          count--
          if (count <= 0) {
            clearInterval(timer)
            setRetryCountdown(null)
            doResearch(shopId, retryCount + 1)
          } else {
            setRetryCountdown(count)
          }
        }, 1000)
      } else if (json.error === 'RATE_LIMIT') {
        setResearchError('レート制限が続いています。しばらく時間をおいてから再試行してください。')
      } else {
        setResearchError(json.error || 'リサーチに失敗しました')
      }
    } catch {
      setResearchError('タイムアウトまたはネットワークエラーが発生しました')
    } finally {
      setResearchingId(null)
    }
  }

  const handleReResearch = (shopId: string) => doResearch(shopId)

  const handleEditCache = (shop: Shop) => {
    setEditingCacheId(shop.id)
    setEditingCacheText(shop.research_cache ?? '')
    setExpandedCacheId(shop.id)
  }

  const handleSaveCache = async (shopId: string) => {
    setSavingCacheId(shopId)
    try {
      const res = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ research_cache: editingCacheText }),
      })
      const json = await res.json()
      if (json.success) {
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, research_cache: editingCacheText } : s))
        setEditingCacheId(null)
      }
    } finally {
      setSavingCacheId(null)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-6">管理者ダッシュボード</h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => router.push('/admin/shops/new')}
              className="bg-white border border-[#E5E9F2] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#E8320A] transition-colors"
            >
              <div className="w-10 h-10 bg-[#F1F3F8] rounded-full flex items-center justify-center">
                <Plus size={20} className="text-[#E8320A]" />
              </div>
              <span className="text-sm font-medium text-[#111827]">店舗を追加</span>
            </button>

            <button
              onClick={() => router.push('/admin/users/new')}
              className="bg-white border border-[#E5E9F2] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#E8320A] transition-colors"
            >
              <div className="w-10 h-10 bg-[#F1F3F8] rounded-full flex items-center justify-center">
                <Users size={20} className="text-[#E8320A]" />
              </div>
              <span className="text-sm font-medium text-[#111827]">ユーザーを発行</span>
            </button>
          </div>

          {researchError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠️ {researchError}
            </div>
          )}
          {retryCountdown !== null && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ⏳ APIのレート制限に達しました。{retryCountdown}秒後に自動で再試行します...
            </div>
          )}

          <h2 className="text-lg font-bold text-[#111827] mb-3 flex items-center gap-2">
            <Store size={18} />
            登録店舗一覧
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : shops.length === 0 ? (
            <p className="text-[#6B7280] text-sm text-center py-8">まだ店舗が登録されていません</p>
          ) : (
            <div className="space-y-2">
              {shops.map((shop) => (
                <div key={shop.id} className="bg-white border border-[#E5E9F2] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => handleEnterShop(shop.id)}
                        disabled={enteringShopId === shop.id}
                        className="font-medium text-[#111827] hover:text-[#E8320A] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {enteringShopId === shop.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <LogIn size={13} />
                        )}
                        {shop.name}
                      </button>
                      <p className="text-sm text-[#6B7280]">{shop.area} · {shop.industry}</p>
                      <p className="text-xs mt-0.5">
                        {shop.research_cache
                          ? <span className="text-green-600">
                              リサーチ済み（{shop.research_updated_at
                                ? new Date(shop.research_updated_at).toLocaleDateString('ja-JP')
                                : '日付不明'}）
                            </span>
                          : <span className="text-[#6B7280]">未リサーチ</span>
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {shop.research_cache && (
                        <>
                          <button
                            onClick={() => setExpandedCacheId(expandedCacheId === shop.id ? null : shop.id)}
                            className="flex items-center gap-1 text-xs text-[#6B7280] border border-[#E5E9F2] rounded-lg px-2.5 py-1.5 hover:border-[#111008] hover:text-[#111827] transition-colors"
                          >
                            {expandedCacheId === shop.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            内容
                          </button>
                          <button
                            onClick={() => handleEditCache(shop)}
                            className="flex items-center gap-1 text-xs text-[#6B7280] border border-[#E5E9F2] rounded-lg px-2.5 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors"
                          >
                            <Pencil size={12} />
                            編集
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleReResearch(shop.id)}
                        disabled={researchingId === shop.id}
                        className="flex items-center gap-1.5 text-xs border border-[#E5E9F2] rounded-lg px-3 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {researchingId === shop.id ? (
                          <><RefreshCw size={12} className="animate-spin" />リサーチ中...</>
                        ) : researchedId === shop.id ? (
                          <><CheckCircle size={12} className="text-green-600" />完了</>
                        ) : (
                          <><RefreshCw size={12} />再リサーチ</>
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedCacheId === shop.id && shop.research_cache && (
                    <div className="border-t border-[#E5E9F2] px-4 py-3 bg-[#F1F3F8]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">リサーチ内容</p>
                        {editingCacheId === shop.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingCacheId(null)}
                              className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
                            >
                              <X size={12} />キャンセル
                            </button>
                            <button
                              onClick={() => handleSaveCache(shop.id)}
                              disabled={savingCacheId === shop.id}
                              className="flex items-center gap-1 text-xs text-white bg-[#E8320A] rounded-lg px-2.5 py-1 hover:bg-[#c92b09] transition-colors disabled:opacity-50"
                            >
                              {savingCacheId === shop.id ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                              保存
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCacheId === shop.id ? (
                        <textarea
                          value={editingCacheText}
                          onChange={(e) => setEditingCacheText(e.target.value)}
                          className="w-full text-xs text-[#111827] bg-white border border-[#E5E9F2] rounded-lg p-3 leading-relaxed font-sans resize-none focus:outline-none focus:border-[#E8320A]"
                          rows={20}
                        />
                      ) : (
                        <pre className="text-xs text-[#111827] whitespace-pre-wrap leading-relaxed font-sans">{shop.research_cache}</pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* ユーザー一覧 */}
          <h2 className="text-lg font-bold text-[#111827] mt-8 mb-3 flex items-center gap-2">
            <Users size={18} />
            発行済みユーザー一覧
          </h2>
          {users.length === 0 ? (
            <p className="text-[#6B7280] text-sm text-center py-4">ユーザーがいません</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="bg-white border border-[#E5E9F2] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#111827] text-sm">{u.email}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {u.role === 'admin' ? '管理者' : `店舗：${u.shops?.name ?? '未紐づけ'}`}
                      　登録：{new Date(u.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResetPassword(u.id, u.email)}
                    disabled={resetLoadingId === u.id}
                    className="flex items-center gap-1.5 text-xs border border-[#E5E9F2] rounded-lg px-3 py-1.5 hover:border-[#E8320A] hover:text-[#E8320A] transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {resetSentId === u.id ? (
                      <><CheckCircle size={12} className="text-green-600" />送信済み</>
                    ) : resetLoadingId === u.id ? (
                      <><RefreshCw size={12} className="animate-spin" />送信中...</>
                    ) : (
                      <><Mail size={12} />PW再設定メール</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 利用ログ */}
          <h2 className="text-lg font-bold text-[#111827] mt-8 mb-3 flex items-center gap-2">
            <Activity size={18} />
            利用ログ
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <select
              value={logShopFilter}
              onChange={(e) => {
                setLogShopFilter(e.target.value)
                fetchLogs(e.target.value)
              }}
              className="text-xs border border-[#E5E9F2] rounded-lg px-3 py-1.5 bg-white text-[#111827] focus:outline-none focus:border-[#E8320A]"
            >
              <option value="all">全店舗</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={() => fetchLogs(logShopFilter)}
              className="flex items-center gap-1 text-xs text-[#6B7280] border border-[#E5E9F2] rounded-lg px-2.5 py-1.5 hover:border-[#111827] hover:text-[#111827] transition-colors"
            >
              <RefreshCw size={11} />更新
            </button>
          </div>
          {logsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-[#6B7280] text-sm text-center py-4">ログがありません</p>
          ) : (
            <div className="bg-white border border-[#E5E9F2] rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead className="bg-[#F1F3F8] text-[#6B7280]">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">日時</th>
                    <th className="text-left px-4 py-2 font-medium">店舗</th>
                    <th className="text-left px-4 py-2 font-medium">機能</th>
                    <th className="text-left px-4 py-2 font-medium">入力メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-4 py-2 text-[#6B7280] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 text-[#111827] whitespace-nowrap">{log.shops?.name ?? '不明'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="bg-[#F1F3F8] text-[#111827] rounded-md px-2 py-0.5">
                          {TOOL_LABELS[log.tool_name] ?? log.tool_name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#6B7280] max-w-[160px] truncate">{log.input_summary ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
