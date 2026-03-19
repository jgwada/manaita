'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
}

export default function PageHeader({ title, description, backHref }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <button
        onClick={() => backHref ? router.push(backHref) : router.back()}
        className="flex items-center gap-1.5 text-[#6B7280] text-sm mb-4 hover:text-[#111827] transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E9F2] flex items-center justify-center group-hover:border-[#E8320A] group-hover:text-[#E8320A] transition-colors shadow-sm">
          <ArrowLeft size={14} />
        </div>
        <span>戻る</span>
      </button>
      <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
      {description && <p className="text-sm text-[#6B7280] mt-1">{description}</p>}
    </div>
  )
}
