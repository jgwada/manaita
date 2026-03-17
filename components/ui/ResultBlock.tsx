'use client'

import CopyButton from './CopyButton'
import { RefreshCw } from 'lucide-react'

interface ResultBlockProps {
  label: string
  text: string
  onRegenerate?: () => void
}

export default function ResultBlock({ label, text, onRegenerate }: ResultBlockProps) {
  return (
    <div className="bg-white border border-[#EDE5DF] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#9A8880] uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs text-[#9A8880] hover:text-[#E8320A] transition-colors"
            >
              <RefreshCw size={12} /> 再生成
            </button>
          )}
          <CopyButton text={text} />
        </div>
      </div>
      <p className="text-sm text-[#111008] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}
