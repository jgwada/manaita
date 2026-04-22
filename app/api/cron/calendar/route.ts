export const maxDuration = 60

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { callClaudeWithWebSearch } from '@/lib/claude'
import { buildCalendarEventsPrompt } from '@/lib/prompts/calendar'
import { ShopProfile } from '@/types'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const month = (now.getMonth() + 2 > 12) ? 1 : now.getMonth() + 2 // 翌月

  try {
    const { data: shops } = await supabaseAdmin.from('shop_profiles').select('*')
    if (!shops || shops.length === 0) return NextResponse.json({ success: true, message: '店舗なし' })

    let generated = 0
    for (const shop of shops as ShopProfile[]) {
      try {
        const prompt = buildCalendarEventsPrompt(shop, year, month)
        const raw = await callClaudeWithWebSearch(prompt, 3000)
        const jsonMatch = raw.match(/\[[\s\S]*\]/)
        if (!jsonMatch) continue

        const events = JSON.parse(jsonMatch[0])
        if (!Array.isArray(events) || events.length === 0) continue

        await supabaseAdmin
          .from('calendar_events')
          .delete()
          .eq('shop_id', shop.id)
          .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lte('date', `${year}-${String(month).padStart(2, '0')}-31`)

        await supabaseAdmin.from('calendar_events').insert(
          events.filter((e: { date?: string; title?: string }) => e.date && e.title).map((e: {
            date: string; end_date?: string | null; title: string; description?: string;
            scale?: string; category?: string; impact?: string
          }) => ({
            shop_id: shop.id,
            date: e.date,
            end_date: e.end_date ?? null,
            title: e.title,
            description: e.description ?? '',
            scale: e.scale ?? 'medium',
            category: e.category ?? 'その他',
            impact: e.impact ?? '',
          }))
        )
        generated++
      } catch (e) {
        console.error(`calendar cron error for shop ${shop.id}:`, e)
      }
    }

    return NextResponse.json({ success: true, message: `${generated}店舗分のカレンダーイベントを生成しました` })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
