'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store'
import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import PageHeader from '@/components/ui/PageHeader'
import MenuPoster, {
  MENU_THEMES,
  MenuThemeKey,
  MenuOrientation,
} from '@/components/ui/MenuPoster'

const THEME_KEYS = Object.keys(MENU_THEMES) as MenuThemeKey[]

export default function MenuPage() {
  const { shopProfile } = useAppStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<MenuOrientation>('portrait')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [themeKey, setThemeKey] = useState<MenuThemeKey>('snow')
  const [downloading, setDownloading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPortrait = orientation === 'portrait'
  // プレビュー用スケール（最大360px幅に収める）
  const posterW = isPortrait ? 595 : 842
  const posterH = isPortrait ? 842 : 595
  const previewW = 320
  const scale = previewW / posterW
  const previewH = Math.round(posterH * scale)

  const loadImage = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setImageUrl(url)
      const img = new Image()
      img.onload = () => {
        setOrientation(img.width >= img.height ? 'landscape' : 'portrait')
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadImage(file)
  }

  const handleDownload = useCallback(async () => {
    const el = posterRef.current
    if (!el) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const jsPDF = (await import('jspdf')).jsPDF

      await toPng(el)
      const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: MENU_THEMES[themeKey].panelBg })

      const img = new Image()
      img.src = imgData
      await new Promise<void>(resolve => { img.onload = () => resolve() })

      const pageW = isPortrait ? 210 : 297
      const pageH = isPortrait ? 297 : 210
      const pdf = new jsPDF({ orientation: isPortrait ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' })

      const imgHeightMm = (img.height / img.width) * pageW
      if (imgHeightMm <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgHeightMm)
      } else {
        const canvas = document.createElement('canvas')
        const pxPerPageH = Math.round((pageH / pageW) * img.width)
        const totalPages = Math.ceil(img.height / pxPerPageH)
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage()
          canvas.width = img.width
          canvas.height = pxPerPageH
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = MENU_THEMES[themeKey].panelBg
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, page * pxPerPageH, img.width, pxPerPageH, 0, 0, img.width, pxPerPageH)
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH)
        }
      }

      pdf.save(`${productName || 'メニュー'}_${MENU_THEMES[themeKey].label}.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
      alert('PDF出力に失敗しました')
    } finally {
      setDownloading(false)
    }
  }, [isPortrait, themeKey, productName])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F1F3F8]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PageHeader
            title="メニュー表・販促POP"
            description="写真をアップして、A4サイズのおしゃれなメニューカードを作成"
            backHref="/"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">

            {/* 左：入力エリア */}
            <div className="space-y-4">

              {/* 写真アップロード */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4">
                <label className="block text-sm font-medium text-[#111008] mb-2">料理の写真</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    dragging ? 'border-[#E8320A] bg-red-50' : 'border-[#EDE5DF] hover:border-[#E8320A]'
                  }`}
                  style={{ height: '160px' }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📷</span>
                      <p className="text-sm text-[#9A8880]">タップまたはドラッグで写真を追加</p>
                      <p className="text-xs text-[#9A8880]">縦横比から自動でA4の向きを決定します</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imageUrl && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[#9A8880]">
                      A4 {orientation === 'portrait' ? '縦（ポートレート）' : '横（ランドスケープ）'} で出力
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrientation('portrait')}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${orientation === 'portrait' ? 'border-[#E8320A] text-[#E8320A]' : 'border-[#EDE5DF] text-[#9A8880]'}`}
                      >縦</button>
                      <button
                        onClick={() => setOrientation('landscape')}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${orientation === 'landscape' ? 'border-[#E8320A] text-[#E8320A]' : 'border-[#EDE5DF] text-[#9A8880]'}`}
                      >横</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 商品情報 */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4 space-y-3">
                <label className="block text-sm font-medium text-[#111008]">商品情報</label>

                <div>
                  <label className="block text-xs text-[#9A8880] mb-1">商品名 <span className="text-[#E8320A]">*</span></label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="例：特選和牛カルビ"
                    className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#9A8880] mb-1">価格 <span className="text-[#E8320A]">*</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#9A8880]">¥</span>
                    <input
                      type="text"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="1,500"
                      className="flex-1 border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                    />
                    <span className="text-sm text-[#9A8880]">円</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#9A8880] mb-1">
                    説明文
                    <span className="ml-1 text-[#9A8880] font-normal">（短く・30文字以内推奨）</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="例：厳選黒毛和牛をじっくり熟成"
                    maxLength={60}
                    className="w-full border border-[#EDE5DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8320A]"
                  />
                </div>
              </div>

              {/* テーマ選択 */}
              <div className="bg-white border border-[#EDE5DF] rounded-xl p-4">
                <label className="block text-sm font-medium text-[#111008] mb-3">デザインテーマ</label>
                <div className="grid grid-cols-5 gap-2">
                  {THEME_KEYS.map(key => {
                    const theme = MENU_THEMES[key]
                    const isSelected = themeKey === key
                    return (
                      <button
                        key={key}
                        onClick={() => setThemeKey(key)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                          isSelected ? 'border-[#111008] shadow-sm' : 'border-[#EDE5DF] hover:border-[#9A8880]'
                        }`}
                      >
                        {/* カラースウォッチ */}
                        <div className="flex gap-0.5">
                          {theme.colors.map((c, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: c }}
                              className="w-3.5 h-3.5 rounded-full border border-black/10"
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-[#111008]' : 'text-[#9A8880]'}`}>
                          {theme.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ダウンロードボタン */}
              <button
                onClick={handleDownload}
                disabled={downloading || !productName || !price}
                className="w-full bg-[#E8320A] text-white rounded-xl py-4 font-medium text-sm hover:bg-[#c92b09] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? 'PDF生成中...' : 'PDFをダウンロード'}
              </button>
            </div>

            {/* 右：プレビュー */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-[#9A8880] self-start">プレビュー</p>
              <div
                style={{
                  width: `${previewW}px`,
                  height: `${previewH}px`,
                  overflow: 'hidden',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  flexShrink: 0,
                }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${posterW}px` }}>
                  <MenuPoster
                    imageUrl={imageUrl}
                    orientation={orientation}
                    productName={productName}
                    price={price}
                    description={description}
                    shopName={shopProfile?.name}
                    themeKey={themeKey}
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#9A8880]">A4 {isPortrait ? '縦' : '横'}</p>
            </div>
          </div>

          {/* PDF用キャプチャ（画面外） */}
          <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
            <MenuPoster
              ref={posterRef}
              imageUrl={imageUrl}
              orientation={orientation}
              productName={productName}
              price={price}
              description={description}
              shopName={shopProfile?.name}
              themeKey={themeKey}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
