import { NextResponse } from 'next/server'

const WMO_LABELS: Record<number, string> = {
  0: '快晴', 1: '晴れ', 2: '一部曇り', 3: '曇り',
  45: '霧', 48: '霧氷',
  51: '小雨', 53: '雨', 55: '強雨',
  61: '小雨', 63: '雨', 65: '大雨',
  71: '小雪', 73: '雪', 75: '大雪', 77: 'あられ',
  80: 'にわか雨', 81: 'にわか雨', 82: '激しいにわか雨',
  85: 'にわか雪', 86: '激しいにわか雪',
  95: '雷雨', 96: '雷雨（ひょう）', 99: '激しい雷雨',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const dateStr = searchParams.get('date') // YYYY-MM-DD

  if (!area || !dateStr) {
    return NextResponse.json({ success: false, error: 'パラメータ不足' })
  }

  try {
    // 1. ジオコーディング（フルテキスト → 市区町村名のみ でリトライ）
    async function geocode(query: string) {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=ja&format=json`
      )
      const data = await res.json()
      return data.results?.[0] ?? null
    }

    // 「滋賀県草津市」→「草津市」→「草津」と段階的に試す
    const stripped = area
      .replace(/^.+[都道府県]/, '')   // 都道府県部分を除去
      .replace(/[市区町村郡]$/, '')    // 末尾の行政区分を除去
    const candidates = [area, stripped.replace(/[市区町村郡]$/, '') + '市', stripped, area.replace(/[市区町村郡県都道府]/, '')]
      .filter((v, i, arr) => v && arr.indexOf(v) === i)

    let location = null
    for (const q of candidates) {
      location = await geocode(q)
      if (location) break
    }

    if (!location) {
      return NextResponse.json({ success: false, error: '地域が見つかりません' })
    }
    const { latitude, longitude } = location

    // 2. 当日の天気・気温
    const [mm, dd] = dateStr.slice(5).split('-')
    const today = new Date(dateStr)
    const isToday = dateStr === new Date().toISOString().slice(0, 10)
    const isPast = today < new Date(new Date().toISOString().slice(0, 10))

    let condition = ''
    let temperature: number | null = null

    if (isToday) {
      // 今日：forecastから現在気温
      const fcRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`
      )
      const fcData = await fcRes.json()
      condition = WMO_LABELS[fcData.current?.weather_code] ?? '不明'
      temperature = Math.round(fcData.current?.temperature_2m * 10) / 10
    } else if (isPast) {
      // 過去：archive APIから
      const archRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_mean,weather_code_dominant&timezone=Asia%2FTokyo`
      )
      const archData = await archRes.json()
      condition = WMO_LABELS[archData.daily?.weather_code_dominant?.[0]] ?? '不明'
      temperature = archData.daily?.temperature_2m_mean?.[0] != null
        ? Math.round(archData.daily.temperature_2m_mean[0] * 10) / 10
        : null
    } else {
      // 未来：forecastから
      const fcRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,weather_code&timezone=Asia%2FTokyo&start_date=${dateStr}&end_date=${dateStr}`
      )
      const fcData = await fcRes.json()
      condition = WMO_LABELS[fcData.daily?.weather_code?.[0]] ?? '不明'
      temperature = fcData.daily?.temperature_2m_mean?.[0] != null
        ? Math.round(fcData.daily.temperature_2m_mean[0] * 10) / 10
        : null
    }

    // 3. 平年比（過去5年同日の平均気温）
    const year = parseInt(dateStr.slice(0, 4))
    const histStart = `${year - 5}-${mm}-${dd}`
    const histEnd = `${year - 1}-${mm}-${dd}`

    let tempVsAvg: number | null = null
    try {
      const histRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${histStart}&end_date=${histEnd}&daily=temperature_2m_mean&timezone=Asia%2FTokyo`
      )
      const histData = await histRes.json()
      const temps: number[] = (histData.daily?.temperature_2m_mean ?? []).filter((t: number | null) => t != null)
      // 同じ日付のみ抽出
      const sameDayTemps = (histData.daily?.time ?? [])
        .map((t: string, i: number) => t.slice(5) === `${mm}-${dd}` ? histData.daily.temperature_2m_mean[i] : null)
        .filter((t: number | null) => t != null)

      if (sameDayTemps.length > 0) {
        const avg = sameDayTemps.reduce((a: number, b: number) => a + b, 0) / sameDayTemps.length
        tempVsAvg = temperature != null ? Math.round((temperature - avg) * 10) / 10 : null
      } else if (temps.length > 0) {
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length
        tempVsAvg = temperature != null ? Math.round((temperature - avg) * 10) / 10 : null
      }
    } catch {
      // 平年比取得失敗は無視
    }

    return NextResponse.json({
      success: true,
      data: { condition, temperature, tempVsAvg, locationName: location.name }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
