import { supabaseAdmin } from './supabase-server'

// fire-and-forget でログを記録（エラーでも呼び出し元に影響しない）
export function logUsage(shopId: string | null, toolName: string, inputSummary?: string, outputSummary?: string) {
  supabaseAdmin.from('usage_logs').insert({
    shop_id: shopId,
    tool_name: toolName,
    input_summary: inputSummary ?? null,
    output_summary: outputSummary ? outputSummary.slice(0, 300) : null,
  }).then(({ error }) => {
    if (error) console.error('logUsage error:', error.message)
  })
}
