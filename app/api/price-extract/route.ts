export const maxDuration = 120

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/supabase-server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
const MAX_IMAGES_PER_REQUEST = 20 // Claude vision limit

const PROMPT = `あなたはメニュー表・価格表を読み取るOCRアシスタントです。
この画像からすべてのメニュー（料理・飲み物・デザート・コース等）の名前と価格を読み取り、JSON配列のみで返してください。文章は一切不要です。

【抽出ルール】
- メニュー名と価格（税込・税抜どちらでも読み取れた値）を抽出する
- 料理・フードは category を "料理"、ドリンク・飲み物・アルコール類は "ドリンク"、デザート・スイーツは "デザート"、コース・セットは "コース"、それ以外は "その他" にする
- 価格が複数ある場合（Sサイズ・Mサイズなど）はそれぞれ別の行として出力する
- 「〜円」「¥〜」「\\〜」などの表記から数値のみ抽出する
- 価格が読み取れないものは sell_price を null にする
- 写真が複数ある場合はすべてのページから抽出する

【返答形式（このJSONのみ）】
[
  {"menu_name": "メニュー名", "sell_price": 数値またはnull, "category": "料理" | "ドリンク" | "デザート" | "コース" | "その他"},
  ...
]`

const TEXT_PROMPT = `あなたはメニュー表・価格表のテキストデータを解析するアシスタントです。
以下のテキストからすべてのメニュー（料理・飲み物・デザート・コース等）の名前と価格を抽出し、JSON配列のみで返してください。文章は一切不要です。

【抽出ルール】
- メニュー名と価格を抽出する
- 料理・フードは category を "料理"、ドリンク・飲み物・アルコール類は "ドリンク"、デザート・スイーツは "デザート"、コース・セットは "コース"、それ以外は "その他" にする
- 価格が複数ある場合はそれぞれ別の行として出力する
- 価格が読み取れないものは sell_price を null にする

【返答形式（このJSONのみ）】
[
  {"menu_name": "メニュー名", "sell_price": 数値またはnull, "category": "料理" | "ドリンク" | "デザート" | "コース" | "その他"},
  ...
]

【テキストデータ】
`

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf'
}

function isExcelFile(file: File): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel'
    || file.name.endsWith('.xlsx')
    || file.name.endsWith('.xls')
    || file.name.endsWith('.csv')
}

function isCsvFile(file: File): boolean {
  return file.type === 'text/csv' || file.name.endsWith('.csv')
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const files = formData.getAll('file') as File[]
    if (files.length === 0) return NextResponse.json({ success: false, error: 'ファイルがありません' })

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: `ファイルサイズは1枚5MB以内にしてください（${file.name}）` })
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const allExtracted: { menu_name: string; sell_price: number | null; category: string }[] = []

    // 画像ファイルを収集
    const imageFiles = files.filter(isImageFile)
    // テキスト系ファイルを収集
    const textFiles = files.filter(f => isPdfFile(f) || isExcelFile(f) || isCsvFile(f))

    // 画像ファイルをバッチ処理（MAX_IMAGES_PER_REQUEST枚ずつ）
    for (let i = 0; i < imageFiles.length; i += MAX_IMAGES_PER_REQUEST) {
      const batch = imageFiles.slice(i, i + MAX_IMAGES_PER_REQUEST)
      const imageContents: Anthropic.ImageBlockParam[] = await Promise.all(
        batch.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer())
          const base64 = buffer.toString('base64')
          const mt = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
          return { type: 'image' as const, source: { type: 'base64' as const, media_type: mt, data: base64 } }
        })
      )

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: PROMPT }
          ]
        }]
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0])
        allExtracted.push(...items)
      }
    }

    // PDF をbase64画像として処理
    const pdfFiles = files.filter(isPdfFile)
    for (const file of pdfFiles) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document' as 'text', source: { type: 'base64' as const, media_type: 'application/pdf' as 'image/jpeg', data: base64 } } as unknown as Anthropic.ContentBlockParam,
            { type: 'text', text: PROMPT }
          ]
        }]
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0])
        allExtracted.push(...items)
      }
    }

    // CSV/Excelはテキストとして読み取り
    for (const file of textFiles.filter(f => !isPdfFile(f))) {
      const buffer = Buffer.from(await file.arrayBuffer())
      let textContent: string

      if (isCsvFile(file)) {
        // CSV: UTF-8 / Shift-JIS対応
        try {
          const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
          textContent = decoded
        } catch {
          const decoded = new TextDecoder('shift_jis').decode(buffer)
          textContent = decoded
        }
      } else {
        // Excel: バイナリなのでbase64でClaudeに送信
        const base64 = buffer.toString('base64')
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: TEXT_PROMPT + `（Excelファイル名: ${file.name}）\nBase64データ: ${base64.slice(0, 5000)}...`
          }]
        })
        const respText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
        const jsonMatch = respText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          allExtracted.push(...JSON.parse(jsonMatch[0]))
        }
        continue
      }

      // CSVテキストをClaudeで解析
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: TEXT_PROMPT + textContent.slice(0, 8000)
        }]
      })
      const respText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const jsonMatch = respText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        allExtracted.push(...JSON.parse(jsonMatch[0]))
      }
    }

    return NextResponse.json({ success: true, data: allExtracted })
  } catch (e) {
    console.error('price-extract error:', e)
    return NextResponse.json({ success: false, error: '読み取りに失敗しました。もう一度お試しください。' })
  }
}
