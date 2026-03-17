import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4000

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
    console.error('Claude Stream error:', error)
    throw new Error('AI生成に失敗しました。もう一度お試しください。')
  }
}

// チャット形式（ストリーミング）
export async function callClaudeChatStream(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  systemPrompt?: string
): Promise<void> {
  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
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
  maxTokens = 10000
): Promise<void> {
  try {
    const stream = await client.messages.stream({
      model: MODEL,
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
    console.error('Claude WebSearch Stream error:', error)
    throw new Error('リサーチに失敗しました。もう一度お試しください。')
  }
}

// マルチモーダル（PDF・画像対応）ストリーミング
export async function callClaudeWithContentStream(
  content: Anthropic.MessageParam['content'],
  onChunk: (text: string) => void,
  maxTokens = 6000
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

// チャット形式
export async function callClaudeChat(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('AI応答に失敗しました。もう一度お試しください。')
  }
}
