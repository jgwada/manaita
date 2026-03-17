'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
        copied
          ? 'bg-[#16A34A] text-white'
          : 'bg-[#FFF9F5] text-[#9A8880] border border-[#EDE5DF] hover:border-[#E8320A] hover:text-[#E8320A]'
      }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'コピー完了' : 'コピー'}
    </button>
  )
}
