import { supabaseAdmin } from './supabase-server'

// fire-and-forget でログを記録（エラーでも呼び出し元に影響しない）
export function logUsage(shopId: string, toolName: string, inputSummary?: string) {
  supabaseAdmin.from('usage_logs').insert({
    shop_id: shopId,
    tool_name: toolName,
    input_summary: inputSummary ?? null,
  }).then(({ error }) => {
    if (error) console.error('logUsage error:', error.message)
  })
}
