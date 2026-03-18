export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function getPlaceId(query: string): Promise<{ placeId: string; shopName: string; address: string } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
  url.searchParams.set('input', query)
  url.searchParams.set('inputtype', 'textquery')
  url.searchParams.set('fields', 'place_id,name,formatted_address')
  url.searchParams.set('language', 'ja')
  url.searchParams.set('key', PLACES_API_KEY!)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' || !data.candidates?.length) return null

  const place = data.candidates[0]
  return {
    placeId: place.place_id,
    shopName: place.name,
    address: place.formatted_address,
  }
}

async function getShopNameFromTabelog(tabelogUrl: string): Promise<string> {
  try {
    const res = await fetch(tabelogUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
    })
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/)
    if (match) {
      // 「店名 - 食べログ」などの形式からお店名だけ取り出す
      return match[1].split(/[-（【]/)[0].trim()
    }
  } catch { /* fallback */ }
  return ''
}

export async function POST(req: Request) {
  try {
    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    const body = await req.json() as { tabelogUrl?: string; shopName?: string; area?: string; placeId?: string }

    let query = ''
    let confirmedPlaceId = body.placeId ?? ''

    if (body.placeId) {
      // 候補確認済み（Place IDが既に判明している場合）
      confirmedPlaceId = body.placeId
    } else if (body.tabelogUrl) {
      // 食べログURLから店名を取得してPlaces APIで検索
      const shopName = await getShopNameFromTabelog(body.tabelogUrl)
      query = shopName || body.tabelogUrl
    } else if (body.shopName) {
      query = `${body.shopName} ${body.area ?? ''}`.trim()
    }

    if (!confirmedPlaceId && query) {
      const result = await getPlaceId(query)
      if (!result) {
        return NextResponse.json({ success: false, error: '店舗が見つかりませんでした。店名や地域を変えてお試しください。' })
      }
      confirmedPlaceId = result.placeId
      return NextResponse.json({
        success: true,
        shopName: result.shopName,
        address: result.address,
        placeId: confirmedPlaceId,
        reviewUrl: `https://search.google.com/local/writereview?placeid=${confirmedPlaceId}`,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${confirmedPlaceId}`,
      })
    }

    if (confirmedPlaceId) {
      return NextResponse.json({
        success: true,
        placeId: confirmedPlaceId,
        reviewUrl: `https://search.google.com/local/writereview?placeid=${confirmedPlaceId}`,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${confirmedPlaceId}`,
      })
    }

    return NextResponse.json({ success: false, error: '検索条件が不足しています。' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
