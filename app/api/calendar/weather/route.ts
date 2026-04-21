import { NextResponse } from 'next/server'

const WMO_ICON: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️',
  61: '🌦️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

async function geocode(area: string): Promise<{ latitude: number; longitude: number } | null> {
  const stripped = area.replace(/^.+[都道府県]/, '').replace(/[市区町村郡]$/, '')
  const candidates = [area, stripped + '市', stripped].filter((v, i, a) => v && a.indexOf(v) === i)
  for (const q of candidates) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ja&format=json`)
    const data = await res.json()
    if (data.results?.[0]) return data.results[0]
  }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  if (!area || !year || !month) return NextResponse.json({ success: false, error: 'params required' })

  try {
    const loc = await geocode(area)
    if (!loc) return NextResponse.json({ success: false, error: '地域が見つかりません' })

    const { latitude, longitude } = loc
    const y = parseInt(year)
    const m = parseInt(month)
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const today = new Date().toISOString().slice(0, 10)
    const forecastLimit = new Date()
    forecastLimit.setDate(forecastLimit.getDate() + 15)
    const forecastLimitStr = forecastLimit.toISOString().slice(0, 10)

    // 予報範囲内の日付のみ取得
    const fcEnd = endDate < forecastLimitStr ? endDate : forecastLimitStr
    const result: Record<string, { icon: string; temp: number | null }> = {}

    // 未来 or 今月の予報
    if (startDate <= forecastLimitStr) {
      const fcStart = startDate > today ? startDate : today
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,weather_code&timezone=Asia%2FTokyo&start_date=${fcStart}&end_date=${fcEnd}`
      )
      const data = await res.json()
      const dates: string[] = data.daily?.time ?? []
      const temps: number[] = data.daily?.temperature_2m_mean ?? []
      const codes: number[] = data.daily?.weather_code ?? []
      dates.forEach((d, i) => {
        result[d] = { icon: WMO_ICON[codes[i]] ?? '🌡️', temp: temps[i] != null ? Math.round(temps[i]) : null }
      })
    }

    // 過去日付
    if (startDate < today) {
      const archEnd = endDate < today ? endDate : new Date(new Date(today).getTime() - 86400000).toISOString().slice(0, 10)
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${archEnd}&daily=temperature_2m_mean,weather_code_dominant&timezone=Asia%2FTokyo`
      )
      const data = await res.json()
      const dates: string[] = data.daily?.time ?? []
      const temps: number[] = data.daily?.temperature_2m_mean ?? []
      const codes: number[] = data.daily?.weather_code_dominant ?? []
      dates.forEach((d, i) => {
        result[d] = { icon: WMO_ICON[codes[i]] ?? '🌡️', temp: temps[i] != null ? Math.round(temps[i]) : null }
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
