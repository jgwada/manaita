export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function extractPlaceId(inputUrl: string): Promise<string | null> {
  let url = inputUrl.trim()

  // 短縮URL・共有URLはリダイレクトを追う
  if (
    url.includes('maps.app.goo.gl') ||
    url.includes('goo.gl/maps') ||
    url.includes('share.google') ||
    url.includes('g.co/')
  ) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      url = res.url
    } catch {
      return null
    }
  }

  // place_id=ChIJ... クエリパラメータ
  try {
    const parsed = new URL(url)
    const placeId = parsed.searchParams.get('place_id')
    if (placeId) return placeId
  } catch { /* invalid URL */ }

  // data=...!1sChIJ... または data=...!4sChIJ... パターン
  const dataMatch = url.match(/[!&](?:1s|4s)(ChIJ[a-zA-Z0-9_-]+)/)
  if (dataMatch) return dataMatch[1]

  // URLのどこかに ChIJ... が含まれる場合
  const chijMatch = url.match(/ChIJ[a-zA-Z0-9_-]{10,}/)
  if (chijMatch) return chijMatch[0]

  return null
}

async function getPlaceDetails(placeId: string): Promise<{ name: string; address: string } | null> {
  if (!PLACES_API_KEY) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress',
      },
    })
    const data = await res.json()
    return {
      name: data.displayName?.text ?? '',
      address: data.formattedAddress ?? '',
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    const body = await req.json() as { mapsUrl?: string; placeId?: string }

    let placeId = body.placeId ?? ''

    if (body.mapsUrl) {
      const extracted = await extractPlaceId(body.mapsUrl)
      if (!extracted) {
        return NextResponse.json({
          success: false,
          error: 'URLからPlace IDを取得できませんでした。GoogleマップまたはGoogleビジネスプロフィールの共有URLを確認してください。',
        })
      }
      placeId = extracted
    }

    if (!placeId) {
      return NextResponse.json({ success: false, error: 'URLが不足しています。' })
    }

    const details = await getPlaceDetails(placeId)

    return NextResponse.json({
      success: true,
      placeId,
      shopName: details?.name ?? '',
      address: details?.address ?? '',
      reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
