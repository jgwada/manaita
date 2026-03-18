export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

/** URLをリダイレクト追跡して最終URLを返す */
async function followRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return res.url
  } catch {
    return url
  }
}

/** Google Maps URL から Place ID (ChIJ...) を直接抽出 */
function extractPlaceIdFromUrl(url: string): string | null {
  // place_id= クエリパラメータ
  try {
    const placeId = new URL(url).searchParams.get('place_id')
    if (placeId) return placeId
  } catch { /* ignore */ }

  // data= 内の !1s / !4s に続く ChIJ...
  const dataMatch = url.match(/[!&](?:1s|4s)(ChIJ[a-zA-Z0-9_-]+)/)
  if (dataMatch) return dataMatch[1]

  // URL中に ChIJ... が存在する場合
  const chijMatch = url.match(/ChIJ[a-zA-Z0-9_-]{10,}/)
  if (chijMatch) return chijMatch[0]

  return null
}

/** google.com/search の q パラメータから店名を取り出してPlaces APIで検索 */
async function searchByShopNameFromSearchUrl(searchUrl: string): Promise<string | null> {
  try {
    const q = new URL(searchUrl).searchParams.get('q')
    if (!q) return null

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY!,
        'X-Goog-FieldMask': 'places.id',
      },
      body: JSON.stringify({ textQuery: q, languageCode: 'ja', regionCode: 'JP' }),
    })
    const data = await res.json()
    return data.places?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function getPlaceDetails(placeId: string): Promise<{ name: string; address: string } | null> {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': PLACES_API_KEY!,
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
      let url = body.mapsUrl.trim()

      // 短縮URL・共有URLはリダイレクトを追う
      const needsRedirect =
        url.includes('maps.app.goo.gl') ||
        url.includes('goo.gl/maps') ||
        url.includes('share.google') ||
        url.includes('g.co/')

      if (needsRedirect) {
        url = await followRedirect(url)
      }

      // Google Maps URL から直接 Place ID を抽出
      placeId = extractPlaceIdFromUrl(url) ?? ''

      // ビジネスプロフィールの共有URL（google.com/search に飛ぶ場合）は店名で検索
      if (!placeId && url.includes('google.com/search')) {
        placeId = (await searchByShopNameFromSearchUrl(url)) ?? ''
      }

      if (!placeId) {
        return NextResponse.json({
          success: false,
          error: `[DEBUG] リダイレクト後URL=${url}`,
        })
      }
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
