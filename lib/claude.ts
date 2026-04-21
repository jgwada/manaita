import Anthropic from '@anthropic-ai/sdk'

type SystemBlockWithCache = { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 2000
const CHAT_HISTORY_LIMIT = 10

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// 通常呼び出し（分析系）
export async function callClaude(prompt: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }]
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('AI生成に失敗しました。もう一度お試しください。')
  }
}

// ストリーミング呼び出し（生成系・チャット系）
export async function callClaudeStream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }]
    })
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Claude Stream error:', msg)
    throw new Error(msg)
  }
}

// チャット形式（ストリーミング）
export async function callClaudeChatStream(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  systemPrompt?: string,
  maxTokens = MAX_TOKENS
): Promise<void> {
  try {
    const recentMessages = messages.slice(-CHAT_HISTORY_LIMIT)
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      ...(systemPrompt ? {
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] as SystemBlockWithCache[]
      } : {}),
      messages: recentMessages,
    })
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }
  } catch (error) {
    console.error('Claude Chat Stream error:', error)
    throw new Error('AI応答に失敗しました。もう一度お試しください。')
  }
}

// Web検索付きストリーミング（店舗リサーチ用）
export async function callClaudeWithWebSearchStream(
  prompt: string,
  onChunk: (text: string) => void,
  maxTokens = 10000,
  model = MODEL
): Promise<void> {
  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
      messages: [{ role: 'user', content: prompt }]
    })
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Claude WebSearch Stream error:', msg)
    throw new Error(msg)
  }
}

// マルチモーダル（PDF・画像対応）ストリーミング
export async function callClaudeWithContentStream(
  content: Anthropic.MessageParam['content'],
  onChunk: (text: string) => void,
  maxTokens = 10000
): Promise<void> {
  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }]
    })
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }
  } catch (error) {
    console.error('Claude Multimodal Stream error:', error)
    throw new Error('AI生成に失敗しました。もう一度お試しください。')
  }
}

// Web検索付き（完全非ストリーミング・Cron用）
// ストリーミングはVercelサーバーレスで接続が切れるため messages.create を使用
export async function callClaudeWithWebSearch(
  prompt: string,
  maxTokens = 3000
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')
}

// チャット形式
export async function callClaudeChat(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: messages.slice(-CHAT_HISTORY_LIMIT)
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('AI応答に失敗しました。もう一度お試しください。')
  }
}
