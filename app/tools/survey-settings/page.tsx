'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'

type Setting = { id: string; category: string; label: string }
type Category = 'menu' | 'good_point' | 'scene'

const CATEGORY_LABELS: Record<Category, string> = {
  menu: 'メニュー',
  good_point: '特に良かった点',
  scene: '利用シーン',
}

export default function SurveySettingsPage() {
  const { shopProfile } = useAppStore()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<Record<Category, string>>({ menu: '', good_point: '', scene: '' })
  const [adding, setAdding] = useState<Category | null>(null)

  useEffect(() => {
    const url = shopProfile?.id
      ? `/api/survey-settings?shopId=${shopProfile.id}`
      : '/api/survey-settings'
    fetch(url)
      .then(r => r.json())
      .then(res => {
        if (res.success) setSettings(res.data)
      })
      .finally(() => setLoading(false))
  }, [shopProfile?.id])

  const handleAdd = async (category: Category) => {
    const label = inputs[category].trim()
    if (!label) return
    setAdding(category)

    const res = await fetch('/api/survey-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shopProfile?.id, category, label }),
    })
    const data = await res.json()
    if (data.success) {
      setSettings(prev => [...prev, data.data])
      setInputs(prev => ({ ...prev, [category]: '' }))
    }
    setAdding(null)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/survey-settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shopProfile?.id, id }),
    })
    const data = await res.json()
    if (data.success) {
      setSettings(prev => prev.filter(s => s.id !== id))
    }
  }

  const byCategory = (cat: Category) => settings.filter(s => s.category === cat)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFF9F5]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6">
          <PageHeader
            title="アンケート設定"
            description="お客様に表示する選択肢を設定します"
            backHref="/dashboard"
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {(['menu', 'good_point', 'scene'] as Category[]).map(cat => (
                <div key={cat} className="bg-white border border-[#EDE5DF] rounded-xl p-4">
                  <h2 className="text-sm font-bold text-[#111008] mb-3">{CATEGORY_LABELS[cat]}</h2>

                  {/* 既存の選択肢 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {byCategory(cat).map(s => (
                      <div key={s.id} className="flex items-center gap-1 bg-[#FFF9F5] border border-[#EDE5DF] rounded-full px-3 py-1.5">
                        <span className="text-sm text-[#111008]">{s.label}</span>
                        <button onClick={() => handleDelete(s.id)} className="text-[#9A8880] hover:text-[#E8320A] ml-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {byCategory(cat).length === 0 && (
                      <p className="text-xs text-[#9A8880]">まだ選択肢がありません</p>
                    )}
                  </div>

                  {/* 追加フォーム */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputs[cat]}
                      onChange={e => setInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && e.shiftKey && handleAdd(cat)}
                      placeholder={cat === 'menu' ? '例：ハラミ定食' : cat === 'good_point' ? '例：スタッフが親切' : '例：家族での食事'}
                      className="flex-1 border border-[#EDE5DF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                    />
                    <button
                      onClick={() => handleAdd(cat)}
                      disabled={adding === cat || !inputs[cat].trim()}
                      className="bg-[#E8320A] text-white rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#9A8880] mt-1">Shift + Enter で決定</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
