export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return '+81' + digits.slice(1)
  }
  return '+' + digits
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json() as { phone: string }

    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    if (!phone?.trim()) {
      return NextResponse.json({ success: false, error: '電話番号を入力してください。' })
    }

    const e164 = toE164(phone.trim())

    // 新しいPlaces API (v1) を使用
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: e164, languageCode: 'ja' }),
    })

    const data = await res.json()

    if (!data.places?.length) {
      return NextResponse.json({
        success: false,
        error: '該当する店舗が見つかりませんでした。Googleビジネスプロフィールに登録された電話番号を確認してください。',
      })
    }

    const place = data.places[0]
    return NextResponse.json({
      success: true,
      candidate: {
        shopName: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        placeId: place.id,
      }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info-candidate error:', msg)
    return NextResponse.json({ success: false, error: '検索に失敗しました。もう一度お試しください。' })
  }
}
