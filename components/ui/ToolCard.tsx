'use client'

import { useRouter } from 'next/navigation'
import { ComponentType } from 'react'
import { ChevronRight } from 'lucide-react'

interface ToolCardProps {
  icon: ComponentType<{ size?: number; className?: string }>
  name: string
  description: string
  href: string
  disabled?: boolean
  gradient?: string
}

export default function ToolCard({ icon: Icon, name, description, href, disabled, gradient = 'from-orange-400 to-red-500' }: ToolCardProps) {
  const router = useRouter()

  if (disabled) {
    return (
      <div className="bg-white rounded-2xl p-4 opacity-50 cursor-not-allowed relative border border-[#E5E9F2]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-[#F1F3F8] rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-[#9CA3AF]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#9CA3AF] text-sm leading-snug">{name}</p>
            <p className="text-xs text-[#C4C9D4] mt-0.5 leading-snug">{description}</p>
          </div>
        </div>
        <span className="absolute top-3 right-3 text-[10px] bg-[#F1F3F8] text-[#9CA3AF] rounded-full px-2 py-0.5 font-medium">準備中</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push(href)}
      className="group bg-white rounded-2xl p-4 text-left hover:shadow-lg transition-all duration-200 active:scale-95 w-full border border-[#E5E9F2] hover:border-transparent"
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-[#111827] text-sm leading-snug">{name}</p>
            <ChevronRight size={14} className="text-[#C4C9D4] group-hover:text-[#E8320A] transition-colors flex-shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
    </button>
  )
}
