import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  if (!shopId) return NextResponse.json({ success: false })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data } = await supabaseAdmin
    .from('usage_logs')
    .select('tool_name, created_at')
    .eq('shop_id', shopId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  const toolCounts: Record<string, number> = {}
  const lastUsed: Record<string, string> = {}
  for (const log of (data ?? [])) {
    toolCounts[log.tool_name] = (toolCounts[log.tool_name] ?? 0) + 1
    if (!lastUsed[log.tool_name]) lastUsed[log.tool_name] = log.created_at
  }

  return NextResponse.json({ success: true, toolCounts, lastUsed })
}
