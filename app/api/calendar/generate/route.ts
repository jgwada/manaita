export const maxDuration = 60

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { callClaudeWithWebSearch } from '@/lib/claude'
import { buildCalendarEventsPrompt } from '@/lib/prompts/calendar'
import { ShopProfile } from '@/types'

const COOLDOWN_DAYS = 7

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

    const monthFrom = `${year}-${String(month).padStart(2, '0')}-01`
    const monthTo   = `${year}-${String(month).padStart(2, '0')}-31`

    // 7日間クールダウンチェック
    const { data: recent } = await supabaseAdmin
      .from('calendar_events')
      .select('created_at')
      .eq('shop_id', shopProfile.id)
      .gte('date', monthFrom)
      .lte('date', monthTo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent?.created_at) {
      const lastAt = new Date(recent.created_at)
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
      .eq('shop_id', shopProfile.id)
      .gte('date', monthFrom)
      .lte('date', monthTo)

    const rows = events
      .filter(e => e.date && e.title)
      .map(e => ({
        shop_id: shopProfile.id,
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

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('calendar/generate error:', e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}
