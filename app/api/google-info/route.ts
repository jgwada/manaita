export const maxDuration = 30

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/supabase-server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function followRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return res.url
  } catch {
    return url
  }
}

/** Google Maps URL から店名と座標を抽出 */
function extractNameAndCoords(url: string): { shopName: string; lat: number; lng: number } | null {
  try {
    const nameMatch = url.match(/\/maps\/place\/([^/@]+)/)
    if (!nameMatch) return null
    const shopName = decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ')

    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (!coordMatch) return null

    return {
      shopName,
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
    }
  } catch {
    return null
  }
}

/** 座標＋店名でPlaces API検索（半径200m以内に絞り込み） */
async function searchByNameAndLocation(shopName: string, lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY!,
        'X-Goog-FieldMask': 'places.id',
      },
      body: JSON.stringify({
        textQuery: shopName,
        languageCode: 'ja',
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 200.0,
          },
        },
      }),
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
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })

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

      // 店名＋座標を抽出してPlaces API検索
      const extracted = extractNameAndCoords(url)
      if (extracted) {
        placeId = (await searchByNameAndLocation(extracted.shopName, extracted.lat, extracted.lng)) ?? ''
      }

      if (!placeId) {
        return NextResponse.json({
          success: false,
          error: 'URLからお店の情報を取得できませんでした。GoogleマップアプリのURLをご確認ください。',
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
