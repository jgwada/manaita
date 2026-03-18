export const maxDuration = 30

import { NextResponse } from 'next/server'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function POST(req: Request) {
  try {
    if (!PLACES_API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Places APIキーが設定されていません。' })
    }

    const { placeId } = await req.json() as { placeId: string }

    if (!placeId) {
      return NextResponse.json({ success: false, error: 'Place IDが不足しています。' })
    }

    return NextResponse.json({
      success: true,
      placeId,
      reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('google-info error:', msg)
    return NextResponse.json({ success: false, error: msg })
  }
}
