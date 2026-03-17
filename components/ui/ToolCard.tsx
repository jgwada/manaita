'use client'

import { useRouter } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface ToolCardProps {
  icon: LucideIcon
  name: string
  description: string
  href: string
  phase?: number
}

export default function ToolCard({ icon: Icon, name, description, href, phase }: ToolCardProps) {
  const router = useRouter()

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
