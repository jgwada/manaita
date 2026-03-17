'use client'

import { useRouter } from 'next/navigation'
import { ComponentType } from 'react'

interface ToolCardProps {
  icon: ComponentType<{ size?: number; className?: string }>
  name: string
  description: string
  href: string
  disabled?: boolean
}

export default function ToolCard({ icon: Icon, name, description, href, disabled }: ToolCardProps) {
  const router = useRouter()

  if (disabled) {
    return (
      <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-4 text-left w-full opacity-60 cursor-not-allowed relative">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-[#BBBBBB]" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#888888] text-sm leading-snug">{name}</p>
            <p className="text-xs text-[#AAAAAA] mt-0.5 leading-snug">{description}</p>
          </div>
        </div>
        <span className="absolute top-2 right-2 text-[10px] bg-[#E5E5E5] text-[#999999] rounded-full px-2 py-0.5 font-medium">準備中</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push(href)}
      className="bg-white border border-[#EDE5DF] rounded-xl p-4 text-left hover:border-[#E8320A] hover:shadow-sm transition-all active:scale-95 w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#FFF9F5] rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[#E8320A]" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-[#111008] text-sm leading-snug">{name}</p>
          <p className="text-xs text-[#9A8880] mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
    </button>
  )
}
