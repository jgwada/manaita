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

    const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
    url.searchParams.set('input', e164)
    url.searchParams.set('inputtype', 'phonenumber')
    url.searchParams.set('fields', 'place_id,name,formatted_address')
    url.searchParams.set('language', 'ja')
    url.searchParams.set('key', PLACES_API_KEY)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== 'OK' || !data.candidates?.length) {
      return NextResponse.json({
        success: false,
        error: '該当する店舗が見つかりませんでした。Googleビジネスプロフィールに登録された電話番号を確認してください。',
      })
    }

    const place = data.candidates[0]
    return NextResponse.json({
      success: true,
      candidate: {
        shopName: place.name,
        address: place.formatted_address,
        placeId: place.place_id,
      }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info-candidate error:', msg)
    return NextResponse.json({ success: false, error: '検索に失敗しました。もう一度お試しください。' })
  }
}
