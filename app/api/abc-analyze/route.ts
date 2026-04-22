export const maxDuration = 60

import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildAbcAdvicePrompt } from '@/lib/prompts/abc'
import { logUsage } from '@/lib/log'
import { getAuthContext } from '@/lib/supabase-server'
import { ShopProfile } from '@/types'

type AnalyzedItem = {
  menuName: string
  sellPrice: number
  costPrice: number
  count: number
  quadrant: 'star' | 'improve' | 'hidden' | 'review'
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      shopProfile: ShopProfile
      items: AnalyzedItem[]
    }
    const auth = await getAuthContext(body.shopProfile?.id)
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const { shopId } = auth

    const { shopProfile, items } = body
    const prompt = buildAbcAdvicePrompt(shopProfile, items)
    const result = await callClaude(prompt)
    logUsage(shopId, 'abc-analyze', `${items.length}品分析`, result)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('abc-analyze error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
