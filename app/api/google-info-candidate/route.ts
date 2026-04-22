export const maxDuration = 30

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/supabase-server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // 11桁：050/070/080/090 → 3-4-4
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  // 10桁：03/06 → 2-4-4、それ以外 → 3-3-4
  if (digits.length === 10) {
    if (/^(03|06)/.test(digits)) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return digits
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

    const { phone } = await req.json() as { phone: string }

    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    if (!phone?.trim()) {
      return NextResponse.json({ success: false, error: '電話番号を入力してください。' })
    }

    const localPhone = normalizePhone(phone.trim())

    // 新しいPlaces API (v1) を使用
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: localPhone, languageCode: 'ja', regionCode: 'JP' }),
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
