export const maxDuration = 60

import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthContext } from '@/lib/supabase-server'
import { callClaudeWithWebSearch } from '@/lib/claude'
import { buildCalendarEventsPrompt } from '@/lib/prompts/calendar'
import { ShopProfile } from '@/types'

const COOLDOWN_DAYS = 7
const FEATURE_KEY = 'calendar_generate'

type EventRow = {
  date: string
  end_date?: string | null
  title: string
  description: string
  scale: 'large' | 'medium'
  category: string
  impact: string
}

export async function POST(req: Request) {
  try {
    const { shopProfile, year, month } = await req.json() as {
      shopProfile: ShopProfile
      year: number
      month: number
    }

    const auth = await getAuthContext(shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const mm = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const monthFrom = `${year}-${mm}-01`
    const monthTo   = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`
    const scope = `${year}-${mm}`

    // 7日間クールダウンチェック（専用テーブル）
    const { data: cd } = await supabaseAdmin
      .from('feature_cooldowns')
      .select('last_used_at')
      .eq('shop_id', shopId)
      .eq('feature', FEATURE_KEY)
      .eq('scope', scope)
      .maybeSingle()

    if (cd?.last_used_at) {
      const lastAt = new Date(cd.last_used_at)
      const nextAt = new Date(lastAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
      if (new Date() < nextAt) {
        return NextResponse.json({ success: false, cooldown: true, nextAt: nextAt.toISOString() })
      }
    }

    const prompt = buildCalendarEventsPrompt(shopProfile, year, month)
    const raw = await callClaudeWithWebSearch(prompt, 3000)

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ success: true, data: [] })
    }

    const events: EventRow[] = JSON.parse(jsonMatch[0])
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 既存の同月イベントを削除して上書き
    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('shop_id', shopId)
      .gte('date', monthFrom)
      .lte('date', monthTo)

    const rows = events
      .filter(e => e.date && e.title)
      .map(e => ({
        shop_id: shopId,
        date: e.date,
        end_date: e.end_date ?? null,
        title: e.title,
        description: e.description ?? '',
        scale: e.scale ?? 'medium',
        category: e.category ?? 'その他',
        impact: e.impact ?? '',
      }))

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert(rows)
      .select()

    if (error) throw error

    // クールダウン記録をupsert
    await supabaseAdmin
      .from('feature_cooldowns')
      .upsert({ shop_id: shopId, feature: FEATURE_KEY, scope, last_used_at: new Date().toISOString() }, { onConflict: 'shop_id,feature,scope' })

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('calendar/generate error:', e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}
