export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function POST(req: Request) {
  try {
    const { query } = await req.json() as { query: string }

    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
    url.searchParams.set('input', query)
    url.searchParams.set('inputtype', 'textquery')
    url.searchParams.set('fields', 'place_id,name,formatted_address')
    url.searchParams.set('language', 'ja')
    url.searchParams.set('key', PLACES_API_KEY)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== 'OK' || !data.candidates?.length) {
      return NextResponse.json({ success: false, error: '店舗が見つかりませんでした。別のキーワードでお試しください。' })
    }

    const place = data.candidates[0]
    return NextResponse.json({
      success: true,
      candidate: {
        shopName: place.name,
        address: place.formatted_address,
        area: place.formatted_address,
        placeId: place.place_id,
      }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info-candidate error:', msg)
    return NextResponse.json({ success: false, error: '検索に失敗しました。もう一度お試しください。' })
  }
}
