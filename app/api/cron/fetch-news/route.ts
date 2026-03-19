export const maxDuration = 60

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { callClaudeWithWebSearch } from '@/lib/claude'

// ─── RSS ソース（4件に絞って安全に） ───────────────────────────────────────
const RSS_SOURCES = [
  {
    url: 'https://www.maff.go.jp/rss.xml',
    source: '農林水産省',
    category: '農業・政策',
    maxItems: 8,
  },
  {
    url: 'https://www.jfa.maff.go.jp/rss.xml',
    source: '水産庁',
    category: '水産・漁業',
    maxItems: 8,
  },
  {
    url: 'https://food-stadium.com/feed/',
    source: 'フードスタジアム',
    category: '外食・飲食業界',
    maxItems: 8,
  },
  {
    url: 'https://www.ssnp.co.jp/feed/',
    source: '食品産業新聞',
    category: '食品・食材',
    maxItems: 8,
  },
]

// ─── XML タグ抽出（CDATA対応） ────────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (!plain) return ''
  return plain[1]
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '').trim()
}

function extractLink(xml: string): string {
  return (
    xml.match(/<link[^>]+href="([^"]+)"/)?.[1] ||
    xml.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ||
    xml.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1]?.trim() ||
    ''
  )
}

// ─── RSS パース ───────────────────────────────────────────────────────────
function parseRSS(xml: string, source: string, category: string, maxItems: number) {
  const items: {
    title: string; url: string; source_name: string
    category: string; summary: string; published_at: string
  }[] = []
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  for (const match of matches.slice(0, maxItems)) {
    const item = match[1]
    const title = extractTag(item, 'title')
    if (!title) continue
    items.push({
      title,
      url: extractLink(item),
      source_name: source,
      category,
      summary: extractTag(item, 'description').slice(0, 200),
      published_at: extractTag(item, 'pubDate') || extractTag(item, 'dc:date'),
    })
  }
  return items
}

// ─── 農業・水産カテゴリは3日以内の記事のみ残す ──────────────────────────
const RECENCY_FILTER_CATEGORIES = ['農業・政策', '水産・漁業']

function isWithin3Days(publishedAt: string): boolean {
  if (!publishedAt) return false
  const d = new Date(publishedAt)
  if (isNaN(d.getTime())) return false
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  return d >= threeDaysAgo
}

// ─── タイムアウト付き fetch ───────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms = 8000): Promise<string> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    return await res.text()
  } finally {
    clearTimeout(id)
  }
}

// ─── Claude Web検索結果パース ─────────────────────────────────────────────
function parseWebSearchArticles(text: string) {
  const articles: {
    title: string; url: string; source_name: string
    category: string; summary: string; published_at: string
  }[] = []
  const blocks = text.split('[ARTICLE]').slice(1)
  for (const block of blocks) {
    const content = block.split('[/ARTICLE]')[0] ?? ''
    const title = content.match(/\*{0,2}タイトル[：:]\*{0,2}\s*\*{0,2}(.+?)\*{0,2}$/m)?.[1]?.trim() ?? ''
    const category = content.match(/\*{0,2}カテゴリ[：:]\*{0,2}\s*\*{0,2}(.+?)\*{0,2}$/m)?.[1]?.trim() ?? '外食・飲食業界'
    const url = content.match(/\*{0,2}URL[：:]\*{0,2}\s*(https?:\/\/\S+)/)?.[1]?.trim() ?? ''
    const summary = content.match(/\*{0,2}概要[：:]\*{0,2}\s*([\s\S]+?)(?=\[\/ARTICLE]|$)/)?.[1]?.replace(/\*{1,2}/g, '').trim() ?? ''
    if (title) articles.push({ title, url, source_name: 'Web検索', category, summary: summary.slice(0, 200), published_at: '' })
  }
  return articles
}

// ─── メイン ───────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  // Vercel Cron の認証チェック（ユーザーからの直接アクセスを拒否）
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const allArticles: {
    title: string; url: string; source_name: string
    category: string; summary: string; published_at: string; fetched_date: string
  }[] = []

  // ── Step 1: RSS 並列取得（各8秒タイムアウト、失敗しても続行） ──────────
  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const xml = await fetchWithTimeout(src.url, 8000)
      return parseRSS(xml, src.source, src.category, src.maxItems)
    })
  )
  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      const filtered = result.value.filter(a =>
        RECENCY_FILTER_CATEGORIES.includes(a.category) ? isWithin3Days(a.published_at) : true
      )
      allArticles.push(...filtered.map(a => ({ ...a, fetched_date: today })))
    }
  }

  // ── Step 2: Claude Web検索（35秒タイムアウト、失敗しても続行） ──────────
  const webSearchPrompt = `今日の日本の飲食・食品業界の最新ニュースを検索して、以下の形式で各カテゴリ2件ずつ（計12件）まとめてください。

対象カテゴリ：
1. 外食・飲食業界（最優先）：新規出店・閉店、業界動向、話題の飲食店、外食チェーンの戦略
2. 食材・フードトレンド：旬の食材、ヒット食品、料理トレンド、新商品
3. 経営・コスト：食材・光熱費・人件費の値上がり、原価率、飲食店経営に影響するコスト情報
4. 補助金・法律・規制：飲食店向け補助金・助成金、食品衛生法、労働法改正、インボイス・税制
5. 農業・農家：農産物の価格・需給動向（直近3日以内のみ）
6. 水産・漁業：魚介類の価格・漁獲量動向（直近3日以内のみ）

各記事は必ず以下の形式で記載してください：
[ARTICLE]
タイトル：（記事タイトル）
カテゴリ：（上記カテゴリ名のいずれか）
URL：（記事URL、不明な場合は省略）
概要：（100字以内で要約）
[/ARTICLE]`

  try {
    const webSearchResult = await Promise.race([
      callClaudeWithWebSearch(webSearchPrompt, 3000),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 35000)
      ),
    ])
    console.log('[web-search] result length:', webSearchResult.length)
    console.log('[web-search] preview:', webSearchResult.slice(0, 300))
    const webArticles = parseWebSearchArticles(webSearchResult)
    console.log('[web-search] parsed articles:', webArticles.length)
    allArticles.push(...webArticles.map(a => ({ ...a, fetched_date: today })))
  } catch (e) {
    // Web検索がタイムアウト or 失敗 → RSS だけで続行（エラーにしない）
    console.log('Web search skipped:', e instanceof Error ? e.message : String(e))
  }

  // ── Step 3: Supabase に保存（今日分を入れ替え） ──────────────────────
  if (allArticles.length === 0) {
    return NextResponse.json({ ok: true, message: 'No articles fetched', count: 0 })
  }

  // 今日のデータを一旦削除
  await supabaseAdmin.from('news_articles').delete().eq('fetched_date', today)

  // 新しいデータを挿入
  const { error } = await supabaseAdmin.from('news_articles').insert(allArticles)
  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: allArticles.length, date: today })
}
